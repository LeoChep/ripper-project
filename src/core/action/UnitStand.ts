import { walk } from "vue/compiler-sfc";
import { golbalSetting } from "../golbalSetting";
import type { WalkStateMachine } from "../stateMachine/WalkStateMachine";
import type { Unit } from "../units/Unit";
import * as PIXI from "pixi.js";
import { BuffSystem } from "../system/BuffSystem";

export const standMovement = (unit: Unit) => {
  const movePromise = new Promise<void>((resolve) => {
    let pronedBuff;
    unit.creature?.buffs.forEach((buff) => {
      if (buff.name === "Proned") {
        pronedBuff = buff;
      }
    });
    if (pronedBuff) {
      BuffSystem.getInstance().removeBuff(pronedBuff, unit);
    }
    resolve();
  });
  return movePromise;
};
