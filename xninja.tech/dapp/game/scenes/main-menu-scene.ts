import { CONST } from '../const/const';

export default class MainMenuScene extends Phaser.Scene {
    private bitmapTexts: Phaser.GameObjects.BitmapText[] = [];

    constructor() {
        super('MainMenuScene');
    }

    init() {
        if (CONST.SCORE > CONST.HIGHSCORE) {
            CONST.HIGHSCORE = CONST.SCORE;
        }
        CONST.SCORE = 0;
    }

    preload() {
        this.load.bitmapFont('snakeFont', './assets/font/snakeFont.png', './assets/font/snakeFont.fnt');
    }

    create() {
        this.bitmapTexts.push(this.add.bitmapText(this.sys.canvas.width / 2 - 28, this.sys.canvas.height / 2 - 10, 'snakeFont', 'S: PLAY', 8));

        this.bitmapTexts.push(this.add.bitmapText(this.sys.canvas.width / 2 - 70, this.sys.canvas.height / 2 - 60, 'snakeFont', 'S N A K E', 16));

        this.bitmapTexts.push(this.add.bitmapText(this.sys.canvas.width / 2 - 45, this.sys.canvas.height / 2 + 30, 'snakeFont', 'HIGHSCORE: ' + CONST.HIGHSCORE, 8));
    }

    update() {
        const cursors = this.input.keyboard?.addKey('S');
        if (cursors?.isDown) {
            this.scene.start('GameScene');
        }
    }
}
