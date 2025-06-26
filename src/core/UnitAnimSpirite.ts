

import { Container } from "pixi.js";
import * as PIXI from "pixi.js";
export class UnitAnimSpirite extends Container {
  // 单位的朝向，单位为弧度，0 表示向右
  private _direction: number = 0;

  // 单位的状态
  private _state: string = "walking"; // 例如 'walking', 'attacking', 'idle' 等

  // 单位的行走动画
  private _walkingSpritesheet?: PIXI.Spritesheet;
  // 动画执行状态
  private _animationState: string = "";

  // 行走动画
  public walking_anim?: PIXI.AnimatedSprite;

  constructor(walkingSpritesheet:PIXI.Spritesheet) {
    super();
    this.walkingSpritesheet=walkingSpritesheet;
    this.walking_anim = new PIXI.AnimatedSprite(walkingSpritesheet.animations.walk_w);
    this.walking_anim.animationSpeed = 0.1666;
    this.walking_anim.textures = walkingSpritesheet.animations.walk_d
    this.direction=0;
    this.walking_anim.renderable = false;
    // play the animation on a loop
    this.walking_anim.play();
    this.walking_anim.label= 'walking';
    this.addChild(this.walking_anim);
    // 可以在这里初始化你的自定义属性
    this.onRender = () => {
      this.update();
    };
  }

  // 获取行走动画Spritesheet
  public get walkingSpritesheet(): PIXI.Spritesheet | undefined {
    return this._walkingSpritesheet;
  }

  // 设置行走动画Spritesheet
  public set walkingSpritesheet(value: PIXI.Spritesheet | undefined) {
    this._walkingSpritesheet = value;
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
  public update(): void {
    if (this._state !== this._animationState)
      this.children.forEach((child) => {
        if (child.label !== "walking") {
          child.renderable = false;
        }
      });
    if (this._state === "walking") {
      if (this.walking_anim) {
        this.walking_anim.renderable = true;
      }
      this._animationState= "walking";
    }
  }
}
