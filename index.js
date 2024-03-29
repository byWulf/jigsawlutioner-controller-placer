import Controller from 'jigsawlutioner-controller';
import BrickPi from 'brickpi3';

const controller = new Controller(3000);

controller.createEndpoint('reset', async (parameters, resolve) => {
    const pushMotor = await controller.getMotor(parameters, 'pushMotor');
    const moveMotor = await controller.getMotor(parameters, 'moveMotor');
    const boardMotor = await controller.getMotor(parameters, 'boardMotor');
    const plateMotor = await controller.getMotor(parameters, 'plateMotor');

    await controller.resetMotor(pushMotor, BrickPi.utils.RESET_MOTOR_LIMIT.FORWARD_LIMIT, 30);

    await Promise.all([
        controller.resetMotor(moveMotor, BrickPi.utils.RESET_MOTOR_LIMIT.BACKWARD_LIMIT, 50),
        controller.resetMotor(boardMotor, BrickPi.utils.RESET_MOTOR_LIMIT.BACKWARD_LIMIT, 80),
        controller.resetMotor(plateMotor, BrickPi.utils.RESET_MOTOR_LIMIT.BACKWARD_LIMIT, 50),
    ]);
});

controller.createEndpoint('place', async (parameters, resolve) => {
    const pushMotor = await controller.getMotor(parameters, 'pushMotor');
    const moveMotor = await controller.getMotor(parameters, 'moveMotor');
    const boardMotor = await controller.getMotor(parameters, 'boardMotor');
    const plateMotor = await controller.getMotor(parameters, 'plateMotor');

    if (typeof parameters.boardOffset === 'undefined') {
        throw new Error('Parameter "boardOffset" was missing from the call.');
    }
    if (typeof parameters.plateOffset === 'undefined') {
        throw new Error('Parameter "plateOffset" was missing from the call.');
    }

    let targetPlatePosition = getPlateOffset(parameters.plateOffset);
    const targetBoardPosition = getBoardOffset(parameters.boardOffset);
    const movePlateBackwards = targetPlatePosition > 500;

    if (movePlateBackwards) {
        targetPlatePosition += 100;
    }

    await Promise.all([
        (async () => {
            await Promise.all([
                (async() => {
                    await movePieceToCliff(moveMotor, pushMotor, parameters.pieceOffset || 0);

                    resolve();
                })(),
                plateMotor.setPosition(0),
            ]);

            await Promise.all([
                moveMotor.setPosition(850 + targetPlatePosition),
                plateMotor.setPosition(targetPlatePosition)
            ]);
        })(),
        boardMotor.setPosition(targetBoardPosition),
    ]);

    await plateMotor.setPosition(Math.max(targetPlatePosition + (movePlateBackwards ? -500 : 500), 0));

    await Promise.all([
        pushMotor.setPosition(0),
        plateMotor.setPosition(0),
        moveMotor.setPosition(500),
    ]);

    await Promise.all([
        pushMotor.setPower(0),
        moveMotor.setPower(0),
        boardMotor.setPower(0),
        plateMotor.setPower(0),
    ]);
});

controller.createEndpoint('move-board', async (parameters, resolve) => {
    const boardMotor = await controller.getMotor(parameters, 'boardMotor');

    if (typeof parameters.boardOffset === 'undefined') {
        throw new Error('Parameter "boardOffset" was missing from the call.');
    }

    const targetBoardPosition = getBoardOffset(parameters.boardOffset);

    await boardMotor.setPosition(targetBoardPosition);
    await boardMotor.setPower(0);
});

async function movePieceToCliff(moveMotor, pushMotor, offset) {
    const offsetToMiddle = 70;
    const cmPerTeeth = 3.2 / 10; //https://www.brickowl.com/catalog/lego-gear-rack-4-3743
    const cmPerRotation = cmPerTeeth * 20; //https://www.brickowl.com/catalog/lego-gear-with-20-teeth-and-double-bevel-unreinforced-32269

    let offsetInDegree = offsetToMiddle + 360 * offset * (14/*cm plate height*/ / 2) / cmPerRotation;

    if (offsetInDegree < 0) {
        offsetInDegree = 0;
    }

    await moveMotor.setPosition(offsetInDegree);

    await pushMotor.setPosition(-100);

    await moveMotor.setPosition(850);
}

function getBoardOffset(x) {
    const cmPerTeeth = 3.2 / 10; //https://www.brickowl.com/catalog/lego-gear-rack-4-3743
    const cmPerRotation = cmPerTeeth * 16; //https://www.brickowl.com/catalog/lego-gear-with-16-teeth-reinforced-94925

    return (x / cmPerRotation) * 360;
}

function getPlateOffset(y) {
    const cmPerTeeth = 3.2 / 10; //https://www.brickowl.com/catalog/lego-gear-rack-4-3743
    const cmPerRotation = cmPerTeeth * 20; //https://www.brickowl.com/catalog/lego-gear-with-20-teeth-and-double-bevel-unreinforced-32269

    return 50 + (y / cmPerRotation) * 360;
}
