import React, { useState, useEffect } from 'react';

import { Game as GameType } from 'phaser';

const Game = () => {
    const isDevelopment = process?.env?.NODE_ENV !== 'production';
    const [game, setGame] = useState<GameType>();

    /*  useEffect(() => {
    async function initPhaser() {
      const Phaser = await import('phaser');
      const { default: NewScene } = await import('../game/scenes/new-scene');

      if(game){
        return;
      }

      const phaserGame = new Phaser.Game({
        type: Phaser.AUTO,
        parent: 'game',
        scene: [NewScene],
        input: {
            keyboard: true,
            mouse: false,
            touch: false,
            gamepad: false,
        },
        width: 400,
        height: 300,
        backgroundColor: '#304858',
        // render: { pixelArt: true, antialias: false },
    })

      setGame(phaserGame);

      // if(isDevelopment) {
      //   window.phaserGame = phaserGame;
      // }
    }
    initPhaser()
  }, []); */

    return (
        <>
            {/*  <div className="flex justify-center items-center">
      <div key="game" id="game">
      </div>
    </div> */}
        </>
    );
};

export default Game;
