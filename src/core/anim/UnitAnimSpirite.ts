import { Container } from "pixi.js";
import * as PIXI from "pixi.js";
import type { Unit } from "../Unit";
export class UnitAnimSpirite extends Container {
  // 单位的朝向，单位为弧度，0 表示向右
  private _direction: number = -1;

  // 单位的状态
  private _state: string = "walk"; // 例如 'walking', 'attacking', 'idle' 等

  private owner: Unit | undefined;

  // 动画执行状态
  private _animationState: string = "";
  public anims: { [key: string]: PIXI.AnimatedSprite } = {};
  public animsSheet: { [key: string]: PIXI.Spritesheet } = {};
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
  public update(callback?:any): void {
    // 如果当前状态与动画状态不一致，则更新渲染状态
    if (this._state !== this._animationState)
      this.children.forEach((child) => {
        if (child.label !== this._state) {
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
        this.anims[this._state].x =0-
          (this.anims[this._state].width - (this.owner?.width ?? 0)) / 2;
        this.anims[this._state].y =0-
          (this.anims[this._state].height - (this.owner?.height ?? 0)) / 2;
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
      if ( this.anims[this.state]&&
          this.anims[this.state].currentFrame ===
          this.anims[this.state].textures.length - 1
          &&
          this.callback
        ){
          this.callback(this)
          this.callback = undefined; // 清除回调函数
        }
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
    animSprite.animationSpeed = 0.1666;
    animSprite.textures = spritesheet.animations[animKeys[0]];
    animSprite.renderable = false;
    // play the animation on a loop
    // animSprite.play();
    animSprite.label = name;
    this.addAnimation(name, animSprite);
  }
}
