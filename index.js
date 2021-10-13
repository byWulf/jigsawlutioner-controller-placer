import Controller from 'jigsawlutioner-controller/Controller.js';
import BrickPi from 'brickpi3';

const controller = new Controller(3000);

controller.createEndpoint('reset', async (parameters, resolve) => {
    const pushMotor = await controller.getMotor(parameters.pushMotor);
    const moveMotor = await controller.getMotor(parameters.moveMotor);
    const boardMotor = await controller.getMotor(parameters.boardMotor);
    const plateMotor = await controller.getMotor(parameters.plateMotor);

    await Promise.all([
        controller.resetMotor(pushMotor, BrickPi.utils.RESET_MOTOR_LIMIT.FORWARD_LIMIT, 30),
        controller.resetMotor(moveMotor, BrickPi.utils.RESET_MOTOR_LIMIT.BACKWARD_LIMIT, 50),
        controller.resetMotor(boardMotor, BrickPi.utils.RESET_MOTOR_LIMIT.FORWARD_LIMIT, 70),
        controller.resetMotor(plateMotor, BrickPi.utils.RESET_MOTOR_LIMIT.FORWARD_LIMIT, 50),
    ]);
});

controller.createEndpoint('place', async (parameters, resolve) => {
    const pushMotor = await controller.getMotor(parameters.pushMotor);
    const moveMotor = await controller.getMotor(parameters.moveMotor);
    const boardMotor = await controller.getMotor(parameters.boardMotor);
    const plateMotor = await controller.getMotor(parameters.plateMotor);

    await Promise.all([
        (async () => {
            await Promise.all([
                movePieceToCliff(moveMotor, pushMotor, parameters.offset),
                plateMotor.setPosition(0),
            ]);
            await Promise.all([
                moveMotor.setPosition(900),
                pushMotor.setPosition(-200),
            ]);


            resolve();

            await Promise.all([
                moveMotor.setPosition(1500),
                plateMotor.setPosition(-670)
            ]);
        })(),
        boardMotor.setPosition(Math.random() * -1000),
    ]);

    await plateMotor.setPosition(0);

    await Promise.all([
        pushMotor.setPosition(0),
        moveMotor.setPosition(500),
    ]);
});

async function movePieceToCliff(moveMotor, pushMotor, offset) {
    const offsetToMiddle = 270;
    const cmPerTeeth = 3.2 / 10; //https://www.brickowl.com/catalog/lego-gear-rack-4-3743
    const cmPerRotation = cmPerTeeth * 20; //https://www.brickowl.com/catalog/lego-gear-with-20-teeth-and-double-bevel-unreinforced-32269

    let offsetInDegree = offsetToMiddle + 360 * offset * (6/*cm plate height*/ / 2) / cmPerRotation;

    await moveMotor.setPosition(-offsetInDegree);

    await pushMotor.setPosition(-150);

    await moveMotor.setPosition(500);
}
