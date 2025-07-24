import { attackMovementToUnit } from "@/core/action/UnitAttack";
import { golbalSetting } from "@/core/golbalSetting";
import { BattleEvenetSystem } from "@/core/system/BattleEventSystem";
import type { CreatureAttack } from "@/core/units/Creature";
import type { Unit } from "@/core/units/Unit";
import { Trait } from "../Trait";

export class CombatChallenge  extends Trait {
  name = "CombatChallenge";
  description = "战斗挑战";
  icon = "challenge";
  type = "combat";
  owner: Unit | null = null; //
  hookTime = "Battle";

  constructor() {
      super();
  }
  hook() {
    const eventHanlder = (attacker: Unit, target: Unit) => {
      if (
        attacker.party !== this.owner?.party &&
        this.owner?.party === target.party
      ) {
        const attackerX = Math.floor(attacker.x / 64);
        const attackerY = Math.floor(attacker.y / 64);
        const unitX = Math.floor(this.owner.x / 64);
        const unitT = Math.floor(this.owner.y / 64);
        const dx = Math.abs(attackerX - unitX);
        const dy = Math.abs(attackerY - unitT);
        if (dx <= 1 && dy <= 1) {
          if (this.owner.party === "player") {
            const userChoice = confirm(
              `单位 ${this.owner.name} 可以使用一个即时中断对它进行一次近战基本攻击，是否执行？`
            );
            let chooseReolve: (value?: unknown) => void = () => {};
            const choosePromise = new Promise((resolve) => {
              chooseReolve = resolve;
            });
            if (userChoice) {
              attackMovementToUnit(
                attacker,
                this.owner as Unit,
                this.owner.creature?.attacks[0] as CreatureAttack,
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
    };
    const event = { typeName: "attackEvent", eventHandler: eventHanlder };
    BattleEvenetSystem.getInstance().hookEvent(event);
  }
}
