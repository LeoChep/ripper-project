import { Container } from "pixi.js";
import * as PIXI from "pixi.js";
import type { Unit } from "../units/Unit";
import { spriteTile, tileSize, zIndexSetting } from "../envSetting";
import type { BuffInterface } from "../buff/BuffInterface";
import { getStatusEffectsIconUrl } from "@/utils/utils";
import { frustumCullService } from "@/core/service/2dcanvas/FrustumCullService";
import * as envSetting from "../envSetting";
import { screenToWorld, worldToScreen } from "../service/2dcanvas/renderUtils";
import { CameraManager } from "../service/2dcanvas/cameraTool";
import { updateUnitPositionOnRender } from "@/core/composables/useWorldPoints";

const lineIconLimit = 4;
export class UnitAnimSpirite extends Container {
  // 单位的朝向，单位为弧度，0 表示向右
  private _direction: number = 0;

  // 单位的状态
  private _state: string = "walk"; // 例如 'walking', 'attacking', 'idle' 等

  // 是否只使用左右朝向（true时只判断左右，忽略上下）
  private _onlySide: boolean = false;

  private owner: Unit | undefined;
  private frameSize: { width: number; height: number } = {
    width: tileSize,
    height: tileSize,
  };
  private visisualSize: { width: number; height: number } = {
    width: tileSize,
    height: tileSize,
  };

  // 存储2.5D模式下的原始缩放比例
  private baseScale25D: { x: number; y: number } | null = null;

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
  private isLeftClick = false;
  private callback: any;
  // containsPoint  (point: PIXI.Point): boolean {
  //   // 仅当右键触发时，才判定“命中”；左键时返回false，不拦截
  //   console.log("containsPoint called with point:", point, "isLeftClick:", this.isLeftClick);
  //   return false;;
  // };
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

    // this.eventMode = "none";
    // this.on("click", (e) => {
    //  console.log("点击了单位动画精灵");

    //   this.isLeftClick = e.button === 0;
    // });

    // 监听鼠标松开事件，重置标记（避免状态残留）
    this.on("mouseup", () => {
      this.isLeftClick = false;
    });
    this.on("mouseupoutside", () => {
      this.isLeftClick = false;
    });
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
    console.log(`单位 ${this.owner?.name} 的朝向设置为: ${value}`);
  }

  // 获取单位状态
  public get state(): string {
    return this._state;
  }

  // 设置单位状态
  public set state(value: string) {
    this._state = value;
  }

  // 获取是否只使用左右朝向
  public get onlySide(): boolean {
    return this._onlySide;
  }

  // 设置是否只使用左右朝向
  public set onlySide(value: boolean) {
    this._onlySide = value;
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
    // 渲染跟踪：更新单位位置到世界点
    if (this.owner && this.owner.state !== 'dead') {
      updateUnitPositionOnRender(
        this.owner.id,
        this.owner.x,
        this.owner.y,
        this.owner.name || String(this.owner.id)
      );
    }

    // 2.5D模式下：检查是否在视窗内（视锥体裁剪）和距离缩放
    if (envSetting.is25dEnabled) {
      // 获取单位的中心点位置
      const centerX = this.owner!.x
      const centerY = this.owner!.y ;

      const cameraParams = CameraManager.getInstance().getCameraParams();
      const screenPos = worldToScreen(
        centerX,
        centerY,
        envSetting.appSetting.width,
        envSetting.appSetting.height,
        cameraParams
      );
      //console.log('cameraParams', cameraParams);
//       if (screenPos) {
// const worldpoint2=screenToWorld(screenPos!.x,screenPos!.y,envSetting.appSetting.width,envSetting.appSetting.height,cameraParams)
//       console.log(`单位 ${this.owner?.name} 的世界坐标: (${worldpoint2?.x}, ${worldpoint2?.y})`);
//         if(worldpoint2?.x!==centerX||worldpoint2?.y!==centerY){
//         //  console.warn(`单位 ${this.owner?.name} 的屏幕坐标转换回世界坐标不匹配！原世界坐标: (${centerX}, ${centerY}), 转换回的世界坐标: (${worldpoint2?.x}, ${worldpoint2?.y})`);
//         }
//     }
      

      // 检查是否在视窗内
      const inViewport = frustumCullService.isRectInViewport(
        centerX,
        centerY,
        this.visisualSize.width ?? tileSize,
        this.visisualSize.height ?? tileSize
      );

      if (!inViewport || !screenPos) {
        this.visible = false;
        return; // 不在视窗内，直接返回不进行后续渲染
      }

  

      // 透视投影原理：缩放比例与深度成反比
      // 使用近裁剪面距离作为基准（在近裁剪面处缩放为100%）

      const scaleX = CameraManager.getInstance().getScaleXByScreenY(
        screenPos.y
      );
      const scaleY = CameraManager.getInstance().getScaleYByScreenY(
        screenPos.y
      );

      // 保存原始缩放比例（首次进入2.5D模式时）
      if (this.baseScale25D === null) {
        this.baseScale25D = { x: this.scale.x, y: this.scale.y };
      }

      // 应用新的缩放比例
      const baseX = this.baseScale25D?.x ?? this.scale.x;
      const baseY = this.baseScale25D?.y ?? this.scale.y;
      this.scale.set(baseX * scaleY, baseY * scaleY);
      // this.scale.set(1,1);
      // 将单位中心对齐到屏幕坐标位置（考虑单位视觉大小）

      this.x = screenPos.x+tileSize*scaleX/2
      this.y = screenPos.y + tileSize*scaleY/2; // 根据缩放调整y位置，使单位脚部贴地
      this.visible = true;
    } else {
      // 非2.5D模式，恢复原始缩放比例
      if (this.baseScale25D !== null) {
        this.scale.set(this.baseScale25D.x, this.baseScale25D.y);
        this.baseScale25D = null;
      }
      // 恢复原始位置
      if (this.owner) {
        this.x =
          Math.round(this.owner.x / envSetting.tileSize) * envSetting.tileSize;
        this.y =
          Math.round(this.owner.y / envSetting.tileSize) * envSetting.tileSize;
      }
    }

    // 原有的场景隐藏逻辑
    if (this.owner?.isSceneHidden) {
      this.visible = false;
    } else {
      this.visible = true;
    }
    // 如果当前状态与动画状态不一致，则更新渲染状态
    if (this._state !== this._animationState)
      this.children.forEach((child) => {
        if (child.label !== this._state && child.label !== "effect") {
          child.renderable = false;
        }
      });
    let dirctionWASD = this.getWASDDirection();
    // console.log(`当前状态: ${this._state}, 当前方向: ${this.direction}, WASD方向: ${dirctionWASD}`);
    let diretionAfter = this.getUnitShouldBeDirection();
    //是否切换转向
    if (this.direction !== diretionAfter) {
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
        this.direction !== diretionAfter
      ) {
        //调整位置
        // this.anims[this._state].x =
        //   0 -
        //   (this.anims[this._state].width - (this.visisualSize.width ?? 0)) / 2;
        // this.anims[this._state].y =
        //   0 -
        //   (this.anims[this._state].height - (this.visisualSize.height ?? 0)) /
        //     2;

        if (diretionAfter != null) {
          this.direction = diretionAfter;
          this.anims[this._state].textures =
            this.animsSheet[this._state].animations[
              this._state + "_" + dirctionWASD
            ];
          console.log("切换动画状态转向: " + this._state + "_" + dirctionWASD);
        }

        this._animationState = this._state;
        this.anims[this._state].play();
      }
    if (this.anims[this._state]) {
      this.anims[this._state].zIndex = this.y;
      this.zIndex = this.y + tileSize;
      //  console.log(`更新z-index  : ${this.zIndex}`);
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
    if (this._state === "idle") {
      if (this.anims["idle"]) {
        this.anims["idle"].renderable = true;
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
    this.drawBuffs();
  }

  public getUnitShouldBeDirection() {
    let direction = this.owner?.direction ?? 0;

    // 如果只使用左右朝向，将上下方向转换为左右
    if (this._onlySide) {
      if (direction === 2 || direction === 3) {
        // 如果是上下方向，使用当前已存储的左右方向，默认为右(0)
        direction = this?._direction; // 保持当前左右方向不变
        console.log(
          `单位 ${this.owner?.name} 只使用左右朝向，保持当前方向: ${direction}`
        );
      }
    }
    // console.log(
    //   `计算单位 ${this.owner?.name} 的动画朝向: ${direction} (onlySide: ${this._onlySide})`
    // );
    return direction;
  }
  public getWASDDirection(): string {
    let dirctionWASD = "";

    let direction = this.getUnitShouldBeDirection();
    switch (direction) {
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

    animation.eventMode = "static";
    //  animation.on("pointerdown", (e) => {
    //    alert("点击了动画:" + name + " 事件对象:" + e);
    //    this.isLeftClick = e.button === 0;
    //  })
    //    animation.containsPoint = (point: PIXI.Point): boolean => {
    //   // 仅当右键触发时，才判定“命中”；左键时返回false，不拦截
    //   console.log("containsPoint called with animation:", point, "isLeftClick:", this.isLeftClick);
    //   return false;;
    // };
    console.log("添加动画:", name, animation);
    animation.renderable = false; // 默认不渲染

    // 为动画精灵添加锚点调试红点
    this.addAnchorDotToAnimation(animation);
  }

  /**
   * 为动画精灵添加锚点调试红点
   * 红点添加到动画精灵上，位置在 (0, 0) 即锚点位置
   */
  private addAnchorDotToAnimation(animSprite: PIXI.AnimatedSprite): void {
    const debugDot = new PIXI.Graphics();
    // 画红色圆点
    debugDot.circle(0, 0, 10);
    debugDot.fill({ color: 0xff0000, alpha: 1 });
    // 十字线
    debugDot.moveTo(-30, 0);
    debugDot.lineTo(30, 0);
    debugDot.moveTo(0, -30);
    debugDot.lineTo(0, 30);
    debugDot.stroke({ width: 3, color: 0xff0000, alpha: 1 });

    animSprite.addChild(debugDot);
  }

  public addAnimationSheet(name: string, spritesheet: PIXI.Spritesheet): void {
    this.animsSheet[name] = spritesheet;
    const animKeys = Object.keys(spritesheet.animations);
    console.log(animKeys[0]);
    console.log(spritesheet.animations);
    const animSprite = new PIXI.AnimatedSprite(
      spritesheet.animations[animKeys[0]]
    );
    animSprite.scale =
      (this.visisualSize.width / this.frameSize.width) * spriteTile;
    // console.log("动画精灵的视觉大小:", this.visisualSize);
    animSprite.animationSpeed = 0.1666;
    animSprite.textures = spritesheet.animations[animKeys[0]];
    animSprite.renderable = false;
    // play the animation on a loop
    // animSprite.play();
    animSprite.label = name;
    animSprite.anchor.set(0.5, 1); // 设置锚点为左上角，避免偏移
    this.addAnimation(name, animSprite);
   
    // this.anims['walk'].renderable = true;
  }
  public async addIcon(buff: BuffInterface) {
    const unit = this.owner;
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
    if (statusIcons[buff.uid]) {
      console.log("Icon already exists for buff:", buff.uid);
    }
    if (!statusIcons[buff.uid]) {
      console.log(
        "Adding icon for buff:",
        buff.name,
        buff.uid,
        buff.icon,
        "to unit:",
        unit.name
      );
      const iconContainer = new PIXI.Container();
      iconContainer.label = "effect";
      statusIcons[buff.uid] = iconContainer;
      const iconUrl = getStatusEffectsIconUrl(buff.icon, buff.iconType);
      await PIXI.Assets.load(iconUrl);

      const iconGraphic = new PIXI.Graphics();
      iconGraphic.setStrokeStyle({ width: 2, color: "white", alpha: 1 });
      iconGraphic.lineTo(0, tileSize / lineIconLimit);
      iconGraphic.lineTo(tileSize / lineIconLimit, tileSize / lineIconLimit);
      iconGraphic.lineTo(tileSize / lineIconLimit, 0);
      iconGraphic.lineTo(0, 0);
      iconGraphic.stroke();
      iconGraphic.rect(
        0,
        0,
        tileSize / lineIconLimit,
        tileSize / lineIconLimit
      );
      iconGraphic.fill(0x000000);
      iconContainer.addChild(iconGraphic);
      const iconSprite = new PIXI.Sprite(PIXI.Texture.from(iconUrl));
      iconSprite.renderable = true;
      iconSprite.scale.x = tileSize / lineIconLimit / iconSprite.width;
      iconSprite.scale.y = tileSize / lineIconLimit / iconSprite.height;
      iconContainer.addChild(iconSprite);

      animUnit.addChild(iconContainer);
      // golbalSetting.rlayers.spriteLayer?.attach(iconSprite);
      iconContainer.zIndex = zIndexSetting.spriteZIndex + 1;
    }

    console.log(buff.giver, "给", unit.name, "添加了", buff.name, "效果");
  }

  public drawBuffs(): void {
    const animUnit = this;
    const unit = this.owner;
    if (!animUnit || !unit) {
      console.error("Unit does not have an animation sprite.");
      return;
    }
    const buffs = unit.creature?.buffs;
    //console.log("drawBuffs", buffs, unit.name);
    if (!buffs || buffs.length === 0) {
      // console.warn(`No buffs found for unit: ${unit.name} ${unit.id}`);
      return;
    }
    const statusIcons = animUnit.statusIcons;
    if (!statusIcons) {
      console.warn(`No status icons found for unit: ${unit.name}`);
      return;
    }
    buffs.forEach((buff) => {
      if (!statusIcons[buff.uid]) {
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
      if (!icon) return;
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
export const toward = (
  unit: { direction: any; x: number; y: number; name: any; onlySide: boolean },
  targetX: number,
  targetY: number
) => {
  let direction = unit.direction;
  const spriteUnitX = Math.floor(unit.x / tileSize); // 假设动画
  const spriteUnitY = Math.floor(unit.y / tileSize); // 假设动画
  const dx = targetX - spriteUnitX;
  const dy = targetY - spriteUnitY;
  //设置朝向
  if (Math.abs(dx) >= Math.abs(dy) && Math.abs(dx) > 0) {
    // 水平移动
    direction = dx > 0 ? 0 : 1; // 0向右, 1向左
  } else if (Math.abs(dy) > Math.abs(dx) && unit.onlySide == false) {
    // 垂直移动
    direction = dy > 0 ? 2 : 3; // 2向下, 3向上
  }
  // console.log(
  //   `单位 ${unit.name} 攻击方向: ${direction}，目标位置: (${targetX}, ${targetY}), dx: ${dx}, dy: ${dy}`
  // );
  // 设置动画精灵的新位置
  unit.direction = direction;
};
