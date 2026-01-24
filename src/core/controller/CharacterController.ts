import * as PIXI from "pixi.js";
import { Unit } from "../units/Unit";

import type { TiledMap } from "../MapClass";
import { SelectAnimSprite } from "../anim/SelectAnimSprite";
import { zIndexSetting } from "../envSetting";
import { lookOn } from "../anim/LookOnAnim";
import { golbalSetting } from "../golbalSetting";
import { useCharacterStore } from "@/stores/characterStore";

export class CharacterController {
  public static curser: number = 0;
  public static isUse: boolean = false;
  public static onAnim: boolean = false;
  public static selectedCharacter: Unit | null = null;

  mapPassiable: TiledMap | null = null;
  constructor(mapPassiable: TiledMap) {
    this.mapPassiable = mapPassiable;
  }
  static selectCharacter(unit: Unit) {
    CharacterController.selectedCharacter = unit;
    CharacterController.curser = unit.id;
    console.log("useCharacterStore().selectCharacter(unit):", unit);
    useCharacterStore().selectCharacter(unit);
    this.showSelectEffect();
    this.lookOn();
  }
  static lookOn() {
    // 只负责视角转移到选中单位
    const unit = CharacterController.selectedCharacter;
    if (!unit) {
      console.warn("没有选中单位，无法进行视角转移");
      return;
    }
    lookOn(unit.x, unit.y);
  }
  
  static showSelectEffect() {
    // 显示选中单位的视觉效果（箭头动画）
    const unit = CharacterController.selectedCharacter;
    if (!unit || !unit.animUnit) {
      console.warn("没有选中单位或单位动画精灵不存在");
      return;
    }
    
    let effectContainer =
      unit.animUnit.children.find(
        (child) => child.label === "effect"
      ) as PIXI.Container | undefined;
    if (!effectContainer) {
      effectContainer = new PIXI.Container();
      effectContainer.label = "effect";
      unit.animUnit.addChild(effectContainer);
    }

    const arrowSprite = new SelectAnimSprite();
    arrowSprite.label = "arrow";
    arrowSprite.select(); // 激活选中状态
    effectContainer.addChild(arrowSprite);

    arrowSprite.zIndex = zIndexSetting.spriteZIndex;

    const lineLayer = golbalSetting.rlayers.lineLayer;
    lineLayer?.attach(arrowSprite);

    // 添加到应用的 ticker 以更新动画
    if (golbalSetting.app) {
      const updateFn = (ticker: any) => {
        arrowSprite.update(ticker.deltaTime);
      };
      golbalSetting.app.ticker.add(updateFn);
      // 将更新函数存储在 sprite 上，以便后续移除
      (arrowSprite as any)._tickerFn = updateFn;
    }
  }
  static removeSelectEffect() {
    if (!CharacterController.selectedCharacter?.animUnit) {
      console.warn("没有选中单位，无法移除选中效果");
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
        // 移除 ticker 更新函数
        if (golbalSetting.app && (arrowSprite as any)._tickerFn) {
          golbalSetting.app.ticker.remove((arrowSprite as any)._tickerFn);
        }
        effectContainer.removeChild(arrowSprite);
        arrowSprite.destroy();
      }
    }
  }
}
