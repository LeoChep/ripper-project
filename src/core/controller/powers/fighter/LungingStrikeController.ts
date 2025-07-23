import type { Unit } from "@/core/units/Unit";
import { AbstractPwoerController } from "../AbstractPwoerController";
import {  playerSelectAttackMovement } from "@/core/action/UnitAttack";
import type { CreatureAttack } from "@/core/units/Creature";

import { golbalSetting } from "@/core/golbalSetting";
import { useStandAction } from "@/core/system/InitiativeSystem";
import { BasicAttackSelector } from "@/core/selector/BasicAttackSelector";
import { checkPassiable } from "@/core/system/AttackSystem";
import { tileSize } from "@/core/envSetting";

export class LungingStrikeController extends AbstractPwoerController {
  public static isUse: boolean = false;
  public static instense: LungingStrikeController | null = null;

  selectedCharacter: Unit | null = null;

  constructor() {
    super();
  }

  doSelect = (): Promise<any> => {
    if (!this.preFix()) return Promise.resolve();
    const { x, y } = this.getXY();
    const unit = this.selectedCharacter as Unit;
    const attack = {} as CreatureAttack;
    const range = 2; // 假设冲刺攻击范围为2
    attack.attackBonus =
      unit.creature?.abilities?.find((ability) => ability.name === "Strength")
        ?.modifier ?? 0; // 使用力量作为攻击加值
    attack.damage='1d8+'+attack.attackBonus
    // 执行攻击选择逻辑
    const basicAttackSelector = BasicAttackSelector.selectBasicAttack(
      (x, y, pre, prey) => {
        return checkPassiable(
          unit,
          x * tileSize,
          y * tileSize,
          golbalSetting.map
        );
      },
      range,
      x,
      y
    );
    this.removeFunction = basicAttackSelector.removeFunction;
    let resolveCallback = (result: any) => {};
    const promise = new Promise((resolve) => {
      resolveCallback = resolve;
    });
    basicAttackSelector.promise?.then((result) => {
      if (result.cencel !== true) {
        useStandAction(unit);
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
}
