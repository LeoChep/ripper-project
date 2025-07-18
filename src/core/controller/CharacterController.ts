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
  constructor(
    mapPassiable: TiledMap
  ) {
    this.mapPassiable = mapPassiable;
  }
  selectCharacter(unit: Unit) {
    CharacterController.selectedCharacter = unit;
  }
  static lookOn() {
    const arrowSprite = new SelectAnimSprite();
    const unit = CharacterController.selectedCharacter;
    if (!unit || !unit.animUnit) {
      console.warn("没有选中单位或单位动画精灵不存在");
      return;
    }
    arrowSprite.zIndex = zIndexSetting.spriteZIndex;

    const lineLayer = golbalSetting.rlayers.lineLayer;
    unit.animUnit?.addChild(arrowSprite);
    lineLayer?.attach(arrowSprite);

    lockOn(unit.x, unit.y);
  }
}
