import { ShieldEdgeBlock } from "./ShieldEdgeBlock";

import { attackMovementToUnit } from "@/core/action/UnitAttack";
import { Marked } from "@/core/buff/Marked";
import type { EventSerializeData } from "@/core/event/EventSerializeData";
import { EventSerializer } from "@/core/event/EventSerializer";
import {
  BasedAbstractEvent,
  UnitAttackSerializer,
} from "@/core/event/BasedAbstractEvent";
import { golbalSetting } from "@/core/golbalSetting";
import { BattleEvenetSystem } from "@/core/system/BattleEventSystem";
import {
  checkRectionUseful,
  useReaction,
} from "@/core/system/InitiativeSystem";
import { UnitSystem } from "@/core/system/UnitSystem";
import { WeaponSystem } from "@/core/system/WeaponSystem";
import type { Unit } from "@/core/units/Unit";
import type { Weapon } from "@/core/units/Weapon";

export class ShieldEdgeBlockEvent extends BasedAbstractEvent {
  static readonly type = "attackEvent";
  static readonly name = "ShieldEdgeBlockEvent";
  owner: Unit | null = null; // 持盾单位
  constructor(owner: Unit, uid?: string) {
    super(null, null, uid);
    this.owner = owner;
    this.eventData.ownerId = owner?.id;
  }

  // static getSerializer(): EventSerializer {
  //   return CombatChallengeUseSerializer.getInstance();
  // }
  hook = () => {
    BattleEvenetSystem.getInstance().hookEvent(this);
  };
  eventHandler = async (attacker: Unit, target: Unit): Promise<void> => {
    (
      attacker: Unit,
      target: Unit,
      attackCheckResult: {
        attackValue: number;
        targetDef: number;
        hit: boolean;
      }
    ) => {
      if (this.owner && this.owner === target) {
        if (
          attacker.party !== this.owner?.party &&
          checkRectionUseful(this.owner)
        ) {
          const attackerX = Math.floor(attacker.x / 64);
          const attackerY = Math.floor(attacker.y / 64);
          const unitX = Math.floor(this.owner.x / 64);
          const unitY = Math.floor(this.owner.y / 64);
          const dx = Math.abs(attackerX - unitX);
          const dy = Math.abs(attackerY - unitY);
          if (dx <= 1 && dy <= 1) {
            if (this.owner.party === "player") {
              let text;
              if (attackCheckResult.hit) {
                text = attacker.name + "的攻击命中，";
              }
              if (!attackCheckResult.hit) {
                text = attacker.name + "的攻击失手，";
              }
              const userChoice = confirm(
                text + `单位 ${this.owner.name} 可以使用盾缘反击对，是否执行？`
              );
              let chooseReolve: (value?: unknown) => void = () => {};
              const choosePromise = new Promise((resolve) => {
                chooseReolve = resolve;
              });
              if (userChoice) {
                attackCheckResult.attackValue -= 4;
                attackCheckResult.hit =
                  attackCheckResult.attackValue >= attackCheckResult.targetDef;
                useReaction(this.owner);

                attackMovementToUnit(
                  attacker,
                  this.owner as Unit,
                  getAttack(this.owner as Unit),
                  golbalSetting.map
                ).then(() => {
                  chooseReolve();
                });
              } else {
                chooseReolve({ cencel: true });
              }
              return choosePromise;
            }
          }
        }
        return Promise.resolve();
      }
      return Promise.resolve();
    };
  };
}
