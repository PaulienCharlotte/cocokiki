import Phaser from 'phaser';
import PlayScene, { SceneCallbacks } from './scenes/PlayScene';

export function createLuaGame(parent: HTMLElement, callbacks: SceneCallbacks, reducedMotion: boolean) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 960,
    height: 600,
    transparent: false,
    backgroundColor: '#9de2e2',
    scene: [new PlayScene(callbacks, reducedMotion)],
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, pixelArt: false },
  });
}
