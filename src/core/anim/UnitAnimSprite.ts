import { Container } from "pixi.js";
import * as PIXI from "pixi.js";
import type { Unit } from "../units/Unit";
import { tileSize, zIndexSetting } from "../envSetting";
import type { BuffInterface } from "../buff/BuffInterface";
import { getStatusEffectsIconUrl } from "@/utils/utils";
  const lineIconLimit = 4;
export class UnitAnimSpirite extends Container {
  // 单位的朝向，单位为弧度，0 表示向右
  private _direction: number = -1;

  // 单位的状态
  private _state: string = "walk"; // 例如 'walking', 'attacking', 'idle' 等

  private owner: Unit | undefined;
  private frameSize: { width: number; height: number } = { width: 64, height:64 };
  private visisualSize: { width: number; height: number } = { width: 64, height:64 };

  public getFrameSize(): { width: number; height: number } {
    return this.frameSize;
  }

  public setFrameSize(size: { width: number; height: number }): void {
    this.frameSize = size;
  }

  public get visisualSizeValue(): { width: number; height: number } {
    return this.visisualSize;
  }

  public set visisualSizeValue(size: { width: number; height: number }) {
    this.visisualSize = size;
  }
  // 动画执行状态
  private _animationState: string = "";
  public anims: { [key: string]: PIXI.AnimatedSprite } = {};
  public animsSheet: { [key: string]: PIXI.Spritesheet } = {};
  public statusIcons: { [key: string]: PIXI.Container } = {};
  private callback: any;
  public get animationCallback(): any {
    return this.callback;
  }

  public set animationCallback(cb: any) {
    this.callback = cb;
  }

  constructor(unit: Unit | undefined) {
    super();

    this.owner = unit;
    // 可以在这里初始化你的自定义属性
    this.onRender = () => {
      this.update(this.callback);
    };
  }
  public get ownerUnit(): Unit | undefined {
    return this.owner;
  }

  public set ownerUnit(unit: Unit | undefined) {
    this.owner = unit;
  }

  // 获取单位朝向
  public get direction(): number {
    return this._direction;
  }

  // 设置单位朝向
  public set direction(value: number) {
    this._direction = value;
  }

  // 获取单位状态
  public get state(): string {
    return this._state;
  }

  // 设置单位状态
  public set state(value: string) {
    this._state = value;
  }

  // 获取动画执行状态
  public get animationState(): string {
    return this._animationState;
  }

  // 设置动画执行状态
  public set animationState(value: string) {
    this._animationState = value;
  }

  // 可以添加自定义方法
  public update(callback?: any): void {
    // 如果当前状态与动画状态不一致，则更新渲染状态
    if (this._state !== this._animationState)
      this.children.forEach((child) => {
        if (child.label !== this._state && child.label !== "effect") {
          child.renderable = false;
        }
      });
    let dirctionWASD = this.getWASDDirection();
    // console.log(`当前状态: ${this._state}, 当前方向: ${this.direction}, WASD方向: ${dirctionWASD}`);

    //是否切换转向
    if (this.direction !== this.owner?.direction) {
      if (this.anims[this._state] && this.animsSheet[this._state]) {
        this.anims[this._state].textures =
          this.animsSheet[this._state].animations[
            this._state + "_" + dirctionWASD
          ];
        console.log("切换动画状态转向: " + this._state + "_" + dirctionWASD);
      }
    }
    //存在切换则调整并播放动画
    if (this.anims[this._state] && this.animsSheet[this._state])
      if (
        this._state !== this._animationState ||
        this.direction !== this.owner?.direction
      ) {
        //调整位置
        this.anims[this._state].x =
          0 - (this.anims[this._state].width - (this.visisualSize.width ?? 0)) / 2;
        this.anims[this._state].y =
          0 - (this.anims[this._state].height - (this.visisualSize.height ?? 0)) / 2;
        if (this.owner?.direction != null) {
          this.direction = this.owner.direction;
          this.anims[this._state].textures =
            this.animsSheet[this._state].animations[
              this._state + "_" + dirctionWASD
            ];
          console.log("切换动画状态转向: " + this._state + "_" + dirctionWASD);
        }
        this._animationState = this._state;
        this.anims[this._state].play();
      }
    // 如果当前状态是行走状态，则渲染行走动画
    if (this._state === "walk") {
      if (this.anims["walk"]) {
        this.anims["walk"].renderable = true;
      }
    }
    if (this._state === "slash") {
      if (this.anims["slash"]) {
        this.anims["slash"].renderable = true;
      }
    }
    if (this._state === "hurt") {
      if (this.anims["hurt"]) {
        this.anims["hurt"].renderable = true;
      }
    }
    if (
      this.anims[this.state] &&
      this.anims[this.state].currentFrame ===
        this.anims[this.state].textures.length - 1 &&
      this.callback
    ) {
      this.callback(this);
      this.callback = undefined; // 清除回调函数
    }
    this.drawBuffs()
  }

  public getWASDDirection(): string {
    let dirctionWASD = "";
    switch (this.owner?.direction) {
      case 0:
        dirctionWASD = "d";
        break;
      case 1:
        dirctionWASD = "a";
        break;
      case 2:
        dirctionWASD = "s";
        break;
      case 3:
        dirctionWASD = "w";
        break;
    }
    return dirctionWASD;
  }
  public addAnimation(name: string, animation: PIXI.AnimatedSprite): void {
    this.anims[name] = animation;
    this.addChild(animation);
    animation.renderable = false; // 默认不渲染
  }
  public addAnimationSheet(name: string, spritesheet: PIXI.Spritesheet): void {
    this.animsSheet[name] = spritesheet;
    const animKeys = Object.keys(spritesheet.animations);
    console.log(animKeys[0]);
    console.log(spritesheet.animations);
    const animSprite = new PIXI.AnimatedSprite(
      spritesheet.animations[animKeys[0]]
    );
    animSprite.scale = this.visisualSize.width / this.frameSize.width;
    console.log("动画精灵的视觉大小:", this.visisualSize);
    animSprite.animationSpeed = 0.1666;
    animSprite.textures = spritesheet.animations[animKeys[0]];
    animSprite.renderable = false;
    // play the animation on a loop
    // animSprite.play();
    animSprite.label = name;
    animSprite.anchor.set(0, 0); // 设置锚点为左上角，避免偏移
    this.addAnimation(name, animSprite);
  }
  public  async addIcon(buff: BuffInterface) {
  const unit = this.owner
  // console.log("Adding icon for buff:", buff.name, "to unit:", unit?.name);
  if (!unit) {
    console.error("Buff owner is not defined.");
    return;
  }
  const animUnit = unit.animUnit;
  if (!animUnit) {
    console.error("Unit does not have an animation sprite.");
    return;
  }
  const statusIcons = animUnit.statusIcons;
  console.log("statusIcons", statusIcons);
  if (statusIcons[buff.name]) {
    console.log("Icon already exists for buff:", buff.name);
  
  }
  if (!statusIcons[buff.name]) {
    console.log("Adding icon for buff:", buff.name,buff.icon, "to unit:", unit.name);
    const iconUrl = getStatusEffectsIconUrl(buff.icon);
    await PIXI.Assets.load(iconUrl);
    const iconContainer = new PIXI.Container();
    const iconGraphic = new PIXI.Graphics();
    iconGraphic.setStrokeStyle({ width: 2, color: "white", alpha: 1 });
    iconGraphic.lineTo(0, tileSize / lineIconLimit);
    iconGraphic.lineTo(tileSize / lineIconLimit, tileSize / lineIconLimit);
    iconGraphic.lineTo(tileSize / lineIconLimit, 0);
    iconGraphic.lineTo(0, 0);
    iconGraphic.stroke();
    iconGraphic.rect(0, 0, tileSize / lineIconLimit, tileSize / lineIconLimit);
    iconGraphic.fill(0x000000);
    iconContainer.addChild(iconGraphic);
    const iconSprite = new PIXI.Sprite(PIXI.Texture.from(iconUrl));
    iconSprite.renderable = true;
    iconSprite.scale.x = tileSize / lineIconLimit / iconSprite.width;
    iconSprite.scale.y = tileSize / lineIconLimit / iconSprite.height;
    iconContainer.addChild(iconSprite);
    iconContainer.label = "effect";
    statusIcons[buff.name] = iconContainer;
    animUnit.addChild(iconContainer);
    // golbalSetting.rlayers.spriteLayer?.attach(iconSprite);
    iconContainer.zIndex = zIndexSetting.spriteZIndex + 1;
  }

  console.log(buff.giver, "给", unit.name, "添加了", buff.name, "效果");
}


  public drawBuffs():void {
  const animUnit = this
  const unit= this.owner;
  if (!animUnit|| !unit) {
    console.error("Unit does not have an animation sprite.");
    return;
  }
  const buff = unit.creature?.buffs;
  if (!buff || buff.length === 0) {
   // console.warn(`No buffs found for unit: ${unit.name} ${unit.id}`);
    return;
  }
  const statusIcons = animUnit.statusIcons;
  if (!statusIcons) {
    console.warn(`No status icons found for unit: ${unit.name}`);
    return;
  }
  buff.forEach((buff) => {
    if (!statusIcons[buff.name]) {
      //如果图标不存在，添加
      this.addIcon(buff);
    }
  });
  const iconKeys = Object.keys(statusIcons);
  // console.log("statusIcons", statusIcons);
  if (iconKeys.length === 0) {
    return;
  }
  let drawIndex = 0;
  iconKeys.forEach((key) => {
    const icon = statusIcons[key];
    // console.log("statusIcons", icon);
    if (icon.renderable) {
      // icon.renderable=false
      drawIndex++;
      const row = Math.floor(drawIndex / lineIconLimit);
      const col =
        drawIndex % lineIconLimit == 0 ? 0 : (drawIndex % lineIconLimit) - 1;
      icon.x = col * (tileSize / lineIconLimit); // 设置图标位置
      icon.y = row * (tileSize / lineIconLimit); // 设置图标位置
    }
  });
}


}
export const toward = (unit: { direction: any; x: number; y: number; name: any; },targetX: number,targetY: number) => {
  let direction = unit.direction;
  const spriteUnitX = Math.floor(unit.x / 64); // 假设动画
  const spriteUnitY = Math.floor(unit.y / 64); // 假设动画
  const dx = targetX - spriteUnitX;
  const dy = targetY - spriteUnitY;
  //设置朝向
  if (Math.abs(dx) >= Math.abs(dy) && Math.abs(dx) > 0) {
    // 水平移动
    direction = dx > 0 ? 0 : 1; // 0向右, 1向左
  } else if (Math.abs(dy) > Math.abs(dx)) {
    // 垂直移动
    direction = dy > 0 ? 2 : 3; // 2向下, 3向上
  }
  console.log(
    `单位 ${unit.name} 攻击方向: ${direction}，目标位置: (${targetX}, ${targetY}), dx: ${dx}, dy: ${dy}`
  );
  // 设置动画精灵的新位置
  unit.direction = direction;
};
