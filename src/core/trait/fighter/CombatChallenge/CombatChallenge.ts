import { Marked } from "../../../buff/Marked";
import { attackMovementToUnit } from "@/core/action/UnitAttack";
import { golbalSetting } from "@/core/golbalSetting";
import { BattleEvenetSystem } from "@/core/system/BattleEventSystem";
import type { CreatureAttack } from "@/core/units/Creature";
import type { Unit } from "@/core/units/Unit";
import { Trait, TraitOptions } from "../../Trait";
import {
  checkRectionUseful,
  useReaction,
} from "@/core/system/InitiativeSystem";

import type { BuffInterface } from "@/core/buff/BuffInterface";
import { UnitSystem } from "@/core/system/UnitSystem";
import { WeaponSystem } from "@/core/system/WeaponSystem";
import type { Weapon } from "@/core/units/Weapon";
import { BuffSystem } from "@/core/system/BuffSystem";

export class CombatChallenge extends Trait {
  name = "CombatChallenge";
  displayName = "战斗挑战";
  description = "战斗挑战";
  icon = "challenge";
  type = "combat";
  owner: Unit | null = null; //
  hookTime = "Battle";

  constructor(traitOptions: TraitOptions) {
    super(traitOptions || {});
  }
  hook() {
    //使用标记
    const eventHanlder1 = (attacker: Unit, target: Unit) => {
      if (!target) return Promise.resolve();
      let happen = false;
      console.log("attacker", attacker, "target", target);
      if (attacker.creature?.buffs) {
              console.log("attacker.creature?", attacker.creature);
        attacker.creature.buffs.forEach((effect) => {
                  console.log("attacker.effect?", effect);
          if (effect instanceof Marked) {
            console.log("effect.giver", effect.giver, this.owner);
            // 如果是被标记的效果，并且是由当前单位施加的
            if (effect.giver === this.owner) {
              happen = true;
            }
          }
        });
      }
      console.log("happen", happen);
      if (!happen) {
        return Promise.resolve();
      }
      if (this.owner && checkRectionUseful(this.owner))
        if (
          attacker.party !== this.owner?.party &&
          this.owner?.party === target.party &&
          this.owner !== target
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
                useReaction(this.owner);
                const attack = WeaponSystem.getInstance().createWeaponAttack(
                  this.owner,
                  this.owner.creature?.weapons?.[0] as Weapon
                );
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
    };
    const event1 = { typeName: "attackEvent", eventHandler: eventHanlder1 };
    //BattleEvenetSystem.getInstance().hookEvent(event1);
    const eventHandler2 = (attacker: Unit, target: Unit) => {
      if (!target) return Promise.resolve();
      if (this.owner === attacker) {
        const beTargetedEffect = new Marked();
        beTargetedEffect.owner = target;
        beTargetedEffect.giver = this.owner;
        BuffSystem.getInstance().addTo(beTargetedEffect, target);
      }
      return Promise.resolve();
    };

    const event2 = { typeName: "attackEvent", eventHandler: eventHandler2 };
    //BattleEvenetSystem.getInstance().hookEvent(event2);
  }
}
