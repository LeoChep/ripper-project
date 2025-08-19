import { tileSize } from "@/core/envSetting";
import { useAction } from "@/core/system/InitiativeSystem";
import type { Unit } from "@/core/units/Unit";

import * as PIXI from "pixi.js";

export abstract class AbstractPwoerController {
  static isUse: boolean;
  static instense: AbstractPwoerController | null;
  powerName: string = "";
  selectedCharacter: Unit | null = null;

  graphics: PIXI.Graphics | null = null;

  abstract doSelect: () => Promise<any>;
  preFix = () => {
    const unit = this.selectedCharacter;
    if (unit === null) {
      console.warn("没有选中单位，无法进行选择");
      return false;
    }
    if (this.graphics) {
      this.removeFunction();
    }
    const spriteUnit = unit.animUnit;
    if (!spriteUnit) {
      return false;
    }
    let canuse = false;
    const unitPowers = unit?.creature?.powers;
    console.log("power can use", unitPowers, this.powerName);
    unitPowers?.forEach((power) => {
      if (power.name === this.powerName) {
         console.log("power can use", power,canuse);
       // canuse = power.canUse();
        console.log("power can use", power,canuse);
      }
    });

   // return canuse;
    return true;
  };
  use = () => {
    const unit = this.selectedCharacter;
    if (!unit) {
      console.warn("没有选中单位，无法使用技能");
      return;
    }
    const unitPowers = unit?.creature?.powers;
    unitPowers?.forEach((power) => {
      if (power.name === this.powerName) {
        power.use();
        const actionType=power.actionType;
        //useAction(unit, actionType);
      }
    });
  };
  getXY = () => {
    const unit = this.selectedCharacter;
    const spriteUnit = unit?.animUnit;
    const centerX = spriteUnit?.x;
    const centerY = spriteUnit?.y;
    const startX = Math.floor((centerX ? centerX : 0) / tileSize);
    const startY = Math.floor((centerY ? centerY : 0) / tileSize);
    return { x: startX, y: startY };
  };
  removeFunction = (args?: any) => {};
  // 添加你的方法和属性
}
