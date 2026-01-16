import type { Unit } from "@/core/units/Unit";
import { AbstractPwoerController } from "../AbstractPwoerController";
import { playerSelectAttackMovement } from "@/core/action/UnitAttack";

import * as AttackSystem from "@/core/system/AttackSystem";
import { golbalSetting } from "@/core/golbalSetting";
import { useStandAction } from "@/core/system/InitiativeSystem";
import { BasicAttackSelector } from "@/core/selector/BasicAttackSelector";

import type { FederatedPointerEvent } from "pixi.js";
import { HearteningStrikeAimBuff } from "@/core/power/cleric/HearteningStrike/HearteningStrikeAimBuff";
import { BuffSystem } from "@/core/system/BuffSystem";
import { HearteningStrikeAimEvent } from "@/core/power/cleric/HearteningStrike/HearteningStrikeAimEvent";
import { HearteningStrikeTimerEvent } from "@/core/power/cleric/HearteningStrike/HearteningStrikeTimerEvent";

export class HearteningStrikeController extends AbstractPwoerController {
  public static isUse: boolean = false;
  public static instense: HearteningStrikeController | null = null;

  selectedCharacter: Unit | null = null;
  powerName = "HearteningStrike";
  constructor() {
    super();
  }

  doSelect = (): Promise<any> => {
    if (!this.preFix()) return Promise.resolve();
    const { x, y } = this.getXY();
    const unit = this.selectedCharacter as Unit;
    const weapon = unit.creature?.weapons?.[0];
    const attackParams = {
      attackFormula: "[WIS]",
      damageFormula: "2*[W]+[WIS]",
      keyWords: [],
      weapon: weapon,
      unit: unit,
    };
    const attack = AttackSystem.createAttack(attackParams);
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
          ).then((result) => {
            console.log("resolveCallback", {});
            const buff = new HearteningStrikeAimBuff();
            buff.giver = unit;
            // if (typeof result == typeof {}) {
            //   resolveCallback({});
            //   return;
            // }
            const r2=result as unknown as {beAttack:Unit}
            const target = r2?.beAttack as unknown as Unit;
            BuffSystem.getInstance().addTo(buff, target);
              console.log("resolveCallback",target);
            const aimEvent = new HearteningStrikeAimEvent(unit);
            aimEvent.curesdUnit = target;
            const continueEvent = new HearteningStrikeTimerEvent(unit, 2);
            continueEvent.childEventId = aimEvent.eventId;
            aimEvent.hook();
            continueEvent.hook;
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
