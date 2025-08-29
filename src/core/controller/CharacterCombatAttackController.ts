import { MessageTipSystem } from "./../system/MessageTipSystem";
import * as PIXI from "pixi.js";
import { Unit } from "../units/Unit";

import { golbalSetting } from "../golbalSetting";

import { playerSelectAttackMovement } from "../action/UnitAttack";

import { BasicAttackSelector } from "../selector/BasicAttackSelector";

import { useStandAction } from "../system/InitiativeSystem";

import { CharacterController } from "./CharacterController";
import * as AttackSystem from "@/core/system/AttackSystem";

export class CharCombatAttackController {
  public static isUse: boolean = false;
  selectedCharacter: Unit | null = null;
  public static instense = null as CharCombatAttackController | null;
  graphics: PIXI.Graphics | null = null;
  constructor() {
    // 初始化逻辑
  }
  getAttack = (unit: Unit, num: number) => {
    const weapon = unit.creature?.weapons?.[num - 1];
    const attackParams = {
      attackFormula: "[STR]",
      damageFormula: "[W]+[STR]",
      keyWords: [],
      weapon: weapon,
      unit: unit,
    };
    const attack = AttackSystem.createAttack(attackParams);

    return attack;
  };
  attackSelect = (): Promise<any> => {
    const unit = this.selectedCharacter;
    if (!unit) return Promise.resolve({});
    const attack = this.getAttack(unit, 1);
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

    const range = attack.range ? attack.range : 1; // 默认攻击范围为1

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
