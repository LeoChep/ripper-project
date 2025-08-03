import type { Unit } from "@/core/units/Unit";
import { Power } from "../Power";
import {
  checkRectionUseful,
  useReaction,
} from "@/core/system/InitiativeSystem";
import { attackMovementToUnit } from "@/core/action/UnitAttack";
import type { Creature, CreatureAttack } from "@/core/units/Creature";
import { golbalSetting } from "@/core/golbalSetting";
import { BattleEvenetSystem } from "@/core/system/BattleEventSystem";

export class ShieldEdgeBlock extends Power {
  name = "ShieldEdgeBlock";
  displayName = "盾缘阻挡";
  description = "你以快速的盾缘猛击阻挡对手的攻势，并接着还以强力挥击。";
  icon = "shield-edge-block";
  type = "fighter";
  actionType = "reaction";
  cost = 1;
  cooldown = 0;
  range = 1;
  targetType = "self";
  hookTime = "Battle";
  owner = null as any; // 反应的拥有者
  constructor() {
    super({});
  }

  hook = () => {
    const eventHanlder1 = (
      attacker: Unit,
      target: Unit,
      attackCheckResult: { attackValue: number; targetDef: number; hit: boolean }
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
                const attack = {} as CreatureAttack;
                attack.name = "Shield Edge Block";
                attack.type = "melee";

                const creature = this.owner.creature as Creature;
                const modifier =
                  creature.abilities.find(
                    (ability) => ability.name === "Strength"
                  )?.modifier || 0;
                attack.attackBonus =
                  Math.floor(this.owner.creature.level / 2) + 2 + modifier;
                attack.damage = "2d6+" + modifier;
                attackMovementToUnit(
                  attacker,
                  this.owner as Unit,
                  attack,
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
    const event1 = { typeName: "hitCheckEvent", eventHandler: eventHanlder1 };
    BattleEvenetSystem.getInstance().hookEvent(event1);
  };
}
