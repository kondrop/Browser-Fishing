import Phaser from 'phaser';
import GameScene from './scenes/GameScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  pixelArt: true,  // ドット絵をシャープに表示
  fps: {
    target: 60,  // ターゲットFPSを明示的に設定
    forceSetTimeOut: false,
    smoothStep: false
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0, x: 0 }, // トップダウンなので重力はなし
      debug: false
    }
  },
  scene: [GameScene],
  scale: {
    mode: Phaser.Scale.RESIZE,  // ウィンドウサイズに追従
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

new Phaser.Game(config);
