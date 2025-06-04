import Phaser from 'phaser';

export default class NewScene extends Phaser.Scene {
    private bg!: Phaser.GameObjects.TileSprite;
    private trees!: Phaser.GameObjects.TileSprite;

    constructor() {
        super('NewScene');
    }

    preload() {
        this.load.atlas('ninja', 'assets/animations/ninja.png', 'assets/animations/ninja.json');
        this.load.image('clouds', 'assets/skies/clouds.png');
        this.load.image('trees', 'assets/skies/ms3-trees.png');
    }

    create() {
        this.bg = this.add.tileSprite(0, 0, 400, 196, 'clouds').setOrigin(0, 0);
        this.trees = this.add.tileSprite(0, 88, 400, 220, 'trees').setOrigin(0, 0);

        const animConfig = {
            key: 'walk',
            frames: 'ninja',
            frameRate: 10,
            repeat: -1,
        };

        this.anims.create(animConfig);

        const sprite = this.add.sprite(200, 269, 'ninja');

        sprite.play('walk');
    }

    update() {
        this.bg.tilePositionX += 2;
        this.trees.tilePositionX += 6;
    }
}
