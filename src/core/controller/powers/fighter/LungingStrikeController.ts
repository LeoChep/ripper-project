import type { Unit } from "@/core/units/Unit";
import { AbstractPwoerController } from "../AbstractPwoerController";
import { playerSelectAttackMovement } from "@/core/action/UnitAttack";

import * as AttackSystem from "@/core/system/AttackSystem";
import { golbalSetting } from "@/core/golbalSetting";
import { useStandAction } from "@/core/system/InitiativeSystem";
import { BasicAttackSelector } from "@/core/selector/BasicAttackSelector";

import type { FederatedPointerEvent } from "pixi.js";

export class LungingStrikeController extends AbstractPwoerController {
  public static isUse: boolean = false;
  public static instense: LungingStrikeController | null = null;

  selectedCharacter: Unit | null = null;
  powerName = "LungingStrike";
  constructor() {
    super();
  }

  doSelect = (): Promise<any> => {
    if (!this.preFix()) return Promise.resolve();
    const { x, y } = this.getXY();
    const unit = this.selectedCharacter as Unit;
    const weapon = unit.creature?.weapons?.[0];
    const attackParams = {
      attackFormula: "[STR]",
      damageFormula: "[W]+[STR]",
      keyWords: [],
      weapon: weapon,
      unit: unit,
    };
    const attack = AttackSystem.createAttack(attackParams);
    if (attack?.range) {
      attack.range++;
    }
    // 执行攻击选择逻辑
    const basicAttackSelector = BasicAttackSelector.getInstance().selectBasic({
      unit: unit,
      range: attack.range,
      color: "red",
    });
    this.removeFunction = basicAttackSelector.removeFunction;
    let resolveCallback = (result: any) => {};
    const promise = new Promise((resolve) => {
      resolveCallback = resolve;
    });
    basicAttackSelector.promise?.then(
      (result: { cancel: boolean; event: FederatedPointerEvent }) => {
        console.log(
          "basicAttackSelector result",
          result,
          result.cancel !== true
        );
        if (result.cancel !== true) {
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
      }
    );

    return promise;
  };
}
