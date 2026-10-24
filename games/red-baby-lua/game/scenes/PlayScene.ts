import Phaser from 'phaser';

export interface SceneCallbacks {
  onReady: (scene: PlayScene) => void;
  onTick: (remaining: number) => void;
  onTimeout: () => void;
}

const POSE = { idle: 0, swing: 1, ready: 2, sleep: 3, jump: 4, alert: 5, celebrate: 6, sad: 7 } as const;

function luaAnchor(width: number, height: number) {
  const narrow = width < 640;
  return {
    narrow,
    x: width * (narrow ? .37 : .47),
    y: height * (narrow ? .69 : .735),
    scale: narrow ? .35 : .43,
    shadowY: height * (narrow ? .73 : .765),
  };
}

export default class PlayScene extends Phaser.Scene {
  private background!: Phaser.GameObjects.Image;
  private groundShadow!: Phaser.GameObjects.Ellipse;
  private lua!: Phaser.GameObjects.Sprite;
  private rock!: Phaser.GameObjects.Container;
  private rockArt!: Phaser.GameObjects.Sprite;
  private vine!: Phaser.GameObjects.Arc;
  private callbacks: SceneCallbacks;
  private activeRound = false;
  private calm = false;
  private elapsed = 0;
  private duration = 5000;
  private reducedMotion: boolean;

  constructor(callbacks: SceneCallbacks, reducedMotion: boolean) {
    super('play');
    this.callbacks = callbacks;
    this.reducedMotion = reducedMotion;
  }

  preload() {
    this.load.image('jungle-bg', '/assets/baby-lua/backgrounds/jungle.png');
    this.load.spritesheet('lua-new', '/assets/baby-lua/characters/lua-poses.png', { frameWidth: 384, frameHeight: 512 });
    this.load.spritesheet('lua-rocks', '/games/red-baby-lua/rocks.png', { frameWidth: 512, frameHeight: 512 });
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#77bda9');
    this.background = this.add.image(width / 2, height / 2, 'jungle-bg').setDepth(-10);
    this.groundShadow = this.add.ellipse(width * .54, height * .735, 116, 25, 0x173e30, .24).setDepth(2);
    this.vine = this.add.arc(width * .68, -90, 280, 22, 158, false, 0x573b24, 0).setStrokeStyle(9, 0x573b24, .95).setVisible(false);
    this.lua = this.makeLua(width * .54, height * .7);
    this.rock = this.makeRock(width * .54, -100).setDepth(6);
    this.lua.setDepth(4);
    this.layout(this.scale.gameSize);
    this.scale.on('resize', this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off('resize', this.layout, this));
    this.callbacks.onReady(this);
  }

  private makeLua(x: number, y: number) {
    const sprite = this.add.sprite(x, y, 'lua-new', POSE.idle).setOrigin(.5, .88).setScale(.39);
    if (!this.reducedMotion) this.tweens.add({ targets: sprite, alpha: .96, yoyo: true, repeat: -1, duration: 1150, ease: 'Sine.inOut' });
    return sprite;
  }

  private makeRock(x: number, y: number) {
    this.rockArt = this.add.sprite(0, 0, 'lua-rocks', 1).setScale(.4);
    return this.add.container(x, y, [this.rockArt]).setVisible(false);
  }

  private setPose(frame: number) { this.lua.setFrame(frame); }
  private setRock(index: number) { this.rockArt.setFrame(index); }

  private layout(gameSize: Phaser.Structs.Size) {
    const source = this.textures.get('jungle-bg').getSourceImage() as HTMLImageElement;
    const cover = Math.max(gameSize.width / source.width, gameSize.height / source.height);
    const anchor = luaAnchor(gameSize.width, gameSize.height);
    this.background.setPosition(gameSize.width / 2, gameSize.height / 2).setScale(cover);
    this.groundShadow.setPosition(anchor.x, anchor.shadowY).setAlpha(anchor.narrow ? .34 : .24).setScale(anchor.narrow ? .72 : 1);
    if (!this.activeRound) this.lua.setPosition(anchor.x, anchor.y).setScale(anchor.scale);
  }

  beginRound(duration: number, calm: boolean) {
    const anchor = luaAnchor(this.scale.width, this.scale.height);
    this.tweens.killTweensOf([this.lua, this.rock]);
    this.lua.setPosition(anchor.x, anchor.y).setScale(anchor.scale).setAngle(0).setAlpha(1);
    this.groundShadow.setPosition(anchor.x, anchor.shadowY).setAlpha(anchor.narrow ? .34 : .24).setScale(anchor.narrow ? .72 : 1);
    this.setPose(calm ? POSE.idle : POSE.alert);
    this.rock.setPosition(anchor.x, anchor.narrow ? 68 : 90).setScale(anchor.narrow ? .58 : .76).setAngle(0).setVisible(!calm);
    this.setRock(Phaser.Math.Between(0, 2));
    this.vine.setVisible(false);
    this.duration = duration; this.elapsed = 0; this.calm = calm; this.activeRound = true;
    this.callbacks.onTick(1);
  }

  resolveSuccess() {
    if (!this.activeRound) return;
    this.activeRound = false; this.setPose(POSE.swing); this.vine.setVisible(true); this.rock.setVisible(true);
    this.tweens.add({ targets: this.groundShadow, alpha: .08, scaleX: .72, duration: this.reducedMotion ? 100 : 280 });
    this.tweens.add({ targets: this.rock, x: this.scale.width * .31, y: this.scale.height * .73, duration: this.reducedMotion ? 180 : 430, ease: 'Quad.in' });
    this.tweens.add({ targets: this.lua, x: this.scale.width * .76, y: this.scale.height * .38, angle: 12, duration: this.reducedMotion ? 200 : 620, ease: 'Cubic.out' });
    this.time.delayedCall(this.reducedMotion ? 220 : 520, () => this.burst(0xffce53));
  }

  resolveTimeout() {
    if (!this.activeRound) return;
    this.activeRound = false; this.rock.setVisible(true);
    const delay = this.reducedMotion ? 150 : 360;
    const narrow = this.scale.width < 640;
    const contactY = this.scale.height * (narrow ? .43 : .51);
    this.tweens.add({ targets: this.rock, y: contactY, duration: delay, ease: 'Quad.in' });
    this.time.delayedCall(delay, () => {
      this.burst(0xe8c99a); this.makeImpactCloud(this.lua.x, this.scale.height * (narrow ? .55 : .7)); this.setPose(POSE.sad);
      const anchor = luaAnchor(this.scale.width, this.scale.height);
      this.lua.setPosition(anchor.x, this.scale.height * (narrow ? .64 : .82)).setScale(narrow ? .39 : .48, narrow ? .15 : .18);
      this.cameras.main.shake(this.reducedMotion ? 0 : 110, .004);
      this.time.delayedCall(this.reducedMotion ? 120 : 520, () => {
        this.tweens.add({ targets: this.rock, x: this.scale.width * .32, y: this.scale.height * .7, angle: -22, duration: this.reducedMotion ? 120 : 340, ease: 'Back.out' });
        this.tweens.add({ targets: this.lua, scaleX: .42, scaleY: .22, duration: this.reducedMotion ? 80 : 220, ease: 'Back.out' });
      });
    });
  }

  private makeImpactCloud(x: number, y: number) {
    const puffs = [-50, -25, 0, 25, 50].map((offset, index) => this.add.circle(x + offset, y + Math.abs(index - 2) * 4, 20, 0xeee4cf, .88));
    puffs.forEach((puff, index) => this.tweens.add({ targets: puff, x: puff.x + (index - 2) * 15, y: puff.y - 22, scale: 1.3, alpha: 0, duration: this.reducedMotion ? 220 : 560, onComplete: () => puff.destroy() }));
  }

  private burst(color: number) {
    for (let index = 0; index < 12; index++) {
      const particle = this.add.star(this.lua.x, this.lua.y, 5, 3, 8, color).setDepth(6);
      const angle = (Math.PI * 2 * index) / 12;
      this.tweens.add({ targets: particle, x: particle.x + Math.cos(angle) * 120, y: particle.y + Math.sin(angle) * 85, alpha: 0, duration: 600, onComplete: () => particle.destroy() });
    }
  }

  update(_time: number, delta: number) {
    if (!this.activeRound || this.calm) return;
    this.elapsed = Math.min(this.duration, this.elapsed + delta);
    const remaining = 1 - this.elapsed / this.duration;
    const narrow = this.scale.width < 640;
    this.rock.y = Phaser.Math.Linear(narrow ? 68 : 90, this.scale.height * (narrow ? .43 : .51), 1 - remaining);
    this.rock.setScale(Phaser.Math.Linear(narrow ? .58 : .76, narrow ? .76 : 1, 1 - remaining));
    this.rock.angle += delta * .018;
    this.callbacks.onTick(remaining);
    if (remaining <= 0) this.callbacks.onTimeout();
  }
}
