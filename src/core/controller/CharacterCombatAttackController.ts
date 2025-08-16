import { MessageTipSystem } from "./../system/MessageTipSystem";
import * as PIXI from "pixi.js";
import { Unit } from "../units/Unit";

import { useInitiativeStore } from "@/stores/initiativeStore";

import { golbalSetting } from "../golbalSetting";

import { playerSelectAttackMovement } from "../action/UnitAttack";
import { checkPassiable } from "../system/AttackSystem";
import type { CreatureAttack } from "../units/Creature";

import { BasicAttackSelector } from "../selector/BasicAttackSelector";
import { tileSize } from "../envSetting";
import { useStandAction } from "../system/InitiativeSystem";
import { generateWays } from "../utils/PathfinderUtil";
import { BasicSelector } from "../selector/BasicSelector";
import { CharacterController } from "./CharacterController";

export class CharCombatAttackController {
  public static isUse: boolean = false;
  selectedCharacter: Unit | null = null;
  public static instense = null as CharCombatAttackController | null;
  graphics: PIXI.Graphics | null = null;
  constructor() {
    // 初始化逻辑
  }
  attackSelect = (attack: CreatureAttack): Promise<any> => {
    const unit = this.selectedCharacter;
    if (CharacterController.onAnim) {
      console.warn("当前有动画正在执行，无法进行攻击选择");
      return Promise.resolve({});
    }

    if (unit === null) {
      console.warn("没有选中单位，无法进行选择");
      return Promise.resolve({});
    }
    if (this.graphics) {
      this.removeFunction();
    }
    const spriteUnit = unit.animUnit;
    if (!spriteUnit) {
      return Promise.resolve({});
    }
    //
    const centerX = spriteUnit.x;
    const centerY = spriteUnit.y;
    const startX = Math.floor(centerX / tileSize);
    const startY = Math.floor(centerY / tileSize);
    const range = attack.range ? attack.range : 1; // 默认攻击范围为1
    const grids = generateWays({
      start: { x: startX, y: startY },
      range: range,
      checkFunction: (x: number, y: number, preX: number, preY: number) => {
        return checkPassiable(
          unit,
          x * tileSize,
          y * tileSize,
          golbalSetting.map
        );
      },
    });
    const basicAttackSelector = BasicAttackSelector.getInstance().selectBasic({
      unit: unit,
      range: range,
      color: "red",
    });
    MessageTipSystem.getInstance().setMessage("请选择攻击目标");
    this.removeFunction = basicAttackSelector.removeFunction;
    let resolveCallback = (result: any) => {};
    const promise = new Promise((resolve) => {
      resolveCallback = resolve;
    });
    basicAttackSelector.promise?.then((result) => {
      console.log("basicAttackSelector result", result, result.cancel !== true);
      MessageTipSystem.getInstance().clearMessage();
      if (result.cancel !== true) {
        useStandAction(unit);
        console.log(
          "playerSelectAttackMovement",
          result.cancel == true,
          unit,
          attack,
          golbalSetting.map
        );
        playerSelectAttackMovement(
          result.event,
          unit,
          attack,
          golbalSetting.map
        ).then(() => {
          console.log("resolveCallback", {});
          resolveCallback({});
        });
      } else {
        resolveCallback(result);
      }
    });

    return promise;
  };
  removeFunction = (args?: any) => {};
  // 添加你的方法和属性
}
