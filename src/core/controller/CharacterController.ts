import * as PIXI from "pixi.js";
import { Unit } from "../units/Unit";

import type { TiledMap } from "../MapClass";
import { TurnEffectAnim } from "../anim/TurnEffectAnim";
import { zIndexSetting } from "../envSetting";
import { lookOn } from "../anim/LookOnAnim";
import { golbalSetting } from "../golbalSetting";
import { useCharacterStore } from "@/stores/characterStore";
import { UnitSystem } from "../system/UnitSystem";

export class CharacterController {
  public static curser: number = 0;
  public static isUse: boolean = false;
  public static onAnim: boolean = false;
  public static selectedCharacter: Unit | null = null;

  mapPassiable: TiledMap | null = null;
  constructor(mapPassiable: TiledMap) {
    this.mapPassiable = mapPassiable;
  }
  static selectCharacterById(id: string) {
    const unit = UnitSystem.getInstance().getUnitById(id);
    this.selectCharacter(unit!);
  }
  static selectCharacter(unit: Unit) {
    CharacterController.selectedCharacter = unit;
    CharacterController.curser = unit.id;
    console.log("useCharacterStore().selectCharacter(unit):", unit);
    UnitSystem.getInstance()
      .getAllUnits()
      .forEach((u) => {
        TurnEffectAnim.removePlayerEffect(u);
        if (u.id === unit.id) {
          // TurnEffectAnim.showPlayerEffect(u);
          CharacterController.showSelectEffect();
          // console.log("选中单位，显示选中效果:", u===unit,u,unit);
        }
      });
  

    CharacterController.lookOn();
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
    TurnEffectAnim.showPlayerEffect(unit);
  }
  static removeSelectEffect() {
    if (!CharacterController.selectedCharacter?.animUnit) {
      console.warn("没有选中单位，无法移除选中效果");
      return;
    }
    TurnEffectAnim.removePlayerEffect(CharacterController.selectedCharacter);
  }
}
