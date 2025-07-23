import * as PIXI from "pixi.js";
import { Unit } from "../units/Unit";

import type { TiledMap } from "../MapClass";
import { SelectAnimSprite } from "../anim/SelectAnimSprite";
import { zIndexSetting } from "../envSetting";
import { lockOn } from "../anim/LockOnAnim";
import { golbalSetting } from "../golbalSetting";

const tileSize = 64;

type Rlayer = {
  basicLayer: PIXI.IRenderLayer;
  spriteLayer: PIXI.IRenderLayer;
  lineLayer: PIXI.IRenderLayer;
  fogLayer: PIXI.IRenderLayer;
  selectLayer: PIXI.IRenderLayer;
  controllerLayer: PIXI.IRenderLayer;
};

export class CharacterController {
  public static curser: number = 0;
  public static isUse: boolean = false;
  public static selectedCharacter: Unit | null = null;

  mapPassiable: TiledMap | null = null;
  constructor(mapPassiable: TiledMap) {
    this.mapPassiable = mapPassiable;
  }
  selectCharacter(unit: Unit) {
    CharacterController.selectedCharacter = unit;
  }
  static lookOn() {
    //后续需要单独处理effectContainer的生成与更新
    const unit = CharacterController.selectedCharacter;
    if (!unit || !unit.animUnit) {
      console.warn("没有选中单位或单位动画精灵不存在");
      return;
    }
    if (!CharacterController.selectedCharacter?.animUnit) {
      console.warn("没有选中单位，无法进行锁定");
      return;
    }
    let effectContainer =
      CharacterController.selectedCharacter.animUnit.children.find(
        (child) => child.label === "effect"
      ) as PIXI.Container | undefined;
    if (!effectContainer) {
      effectContainer = new PIXI.Container();
      effectContainer.label = "effect";
      unit.animUnit?.addChild(effectContainer);
    }

    const arrowSprite = new SelectAnimSprite();
    arrowSprite.label = "arrow";
    effectContainer.addChild(arrowSprite);

 
    arrowSprite.zIndex = zIndexSetting.spriteZIndex;

    const lineLayer = golbalSetting.rlayers.lineLayer;

    lineLayer?.attach(arrowSprite);

    lockOn(unit.x, unit.y);
  }
  static removeLookOn() {
    if (!CharacterController.selectedCharacter?.animUnit) {
      console.warn("没有选中单位，无法移除锁定效果");
      return;
    }
    const effectContainer =
      CharacterController.selectedCharacter.animUnit.children.find(
        (child) => child.label === "effect"
      ) as PIXI.Container | undefined;
    if (effectContainer) {
      const arrowSprite = effectContainer.children.find(
        (child) => child.label === "arrow"
      ) as SelectAnimSprite | undefined;
      if (arrowSprite) {
        effectContainer.removeChild(arrowSprite);
        arrowSprite.destroy();
      }
    }
  }
}
