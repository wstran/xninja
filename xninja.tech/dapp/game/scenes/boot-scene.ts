export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    update() {
        this.scene.start('MainMenuScene');
    }
}
