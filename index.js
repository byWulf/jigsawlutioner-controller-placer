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
        controller.resetMotor(boardMotor, BrickPi.utils.RESET_MOTOR_LIMIT.FORWARD_LIMIT, 80),
        controller.resetMotor(plateMotor, BrickPi.utils.RESET_MOTOR_LIMIT.BACKWARD_LIMIT, 50),
    ]);
});

controller.createEndpoint('place', async (parameters, resolve) => {
    const pushMotor = await controller.getMotor(parameters, 'pushMotor');
    const moveMotor = await controller.getMotor(parameters, 'moveMotor');
    const boardMotor = await controller.getMotor(parameters, 'boardMotor');
    const plateMotor = await controller.getMotor(parameters, 'plateMotor');

    const targetPlatePosition = Math.random() * 900;

    await Promise.all([
        (async () => {
            await Promise.all([
                (async() => {
                    await movePieceToCliff(moveMotor, pushMotor, parameters.offset || 0);

                    resolve();
                })(),
                plateMotor.setPosition(0),
            ]);

            await pushMotor.setPosition(-170);
            await moveMotor.setPosition(850);

            await Promise.all([
                moveMotor.setPosition(850 + targetPlatePosition),
                plateMotor.setPosition(targetPlatePosition)
            ]);
        })(),
        boardMotor.setPosition(Math.random() * -1000),
    ]);

    await plateMotor.setPosition(Math.max(targetPlatePosition + 400, 0));
    await pushMotor.setPosition(0);

    await Promise.all([
        plateMotor.setPosition(0),
        moveMotor.setPosition(500),
    ]);

    pushMotor.setPower(0);
    moveMotor.setPower(0);
    boardMotor.setPower(0);
    plateMotor.setPower(0);
});

async function movePieceToCliff(moveMotor, pushMotor, offset) {
    const offsetToMiddle = 270;
    const cmPerTeeth = 3.2 / 10; //https://www.brickowl.com/catalog/lego-gear-rack-4-3743
    const cmPerRotation = cmPerTeeth * 20; //https://www.brickowl.com/catalog/lego-gear-with-20-teeth-and-double-bevel-unreinforced-32269

    let offsetInDegree = offsetToMiddle + 360 * offset * (6/*cm plate height*/ / 2) / cmPerRotation;

    await moveMotor.setPosition(-offsetInDegree);

    await pushMotor.setPosition(-100);

    await moveMotor.setPosition(630);
}
