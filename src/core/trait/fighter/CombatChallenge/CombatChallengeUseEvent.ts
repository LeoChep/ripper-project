
import { attackMovementToUnit } from "@/core/action/UnitAttack";
import { Marked } from "@/core/buff/Marked";
import type { EventSerializeData } from "@/core/event/EventSerializeData";
import { EventSerializer } from "@/core/event/EventSerializer";
import { BasedAbstractEvent, BasedEventSerializer } from "@/core/event/BasedAbstractEvent";
import { MessageTipSystem } from "@/core/system/MessageTipSystem";
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

export class CombatChallengeUseEvent extends BasedAbstractEvent {
  static readonly type = "attackEvent";
  static readonly name = "CombatChallengeUseEvent";
  owner: Unit | null = null; // 挑战者单位
  constructor(owner:Unit, uid?: string) {
    super(uid);
    this.owner = owner;
    this.eventData.ownerId = owner?.id;
  }

  static getSerializer(): EventSerializer {
    return CombatChallengeUseSerializer.getInstance();
  }
  getSerializer(): EventSerializer {
      return CombatChallengeUseEvent.getSerializer();
  }
  hook = () => {
    BattleEvenetSystem.getInstance().hookEvent(this);
  };
  eventHandler = async (attacker: Unit, target: Unit): Promise<void> => {
    if (!target) return Promise.resolve();
    let happen = false;
    console.log("attacker", attacker, "target", target);
    if (attacker.creature?.buffs) {
      console.log("attacker.creature?", attacker.creature);
      attacker.creature.buffs.forEach((effect) => {
        console.log("attacker.effect?", effect);
        if (effect.name === "Marked") {
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
            const userChoice = await MessageTipSystem.getInstance().confirm(
              `单位 ${this.owner.name} 可以使用一个即时中断对它进行一次近战基本攻击，是否执行？`
            );
            let chooseReolve: (value?: void) => void = () => {};
            const choosePromise = new Promise<void>((resolve) => {
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
              chooseReolve();
              // chooseReolve({ cencel: true });
            }
            return choosePromise;
          }
        }
      }
    return Promise.resolve();
  };
}
export class CombatChallengeUseSerializer extends BasedEventSerializer{
  static instance: CombatChallengeUseSerializer;
  static getInstance(): CombatChallengeUseSerializer {
    if (!this.instance) {
      this.instance = new CombatChallengeUseSerializer();
    }
    return this.instance;
  }
  serialize(event: CombatChallengeUseEvent): EventSerializeData {
    const data = super.serialize(event);
    data.eventName = "CombatChallengeUseEvent";
    return data;
  }
  deserialize(data: EventSerializeData): BasedAbstractEvent | null {
      const { ownerId} = data.eventData;
      if (!ownerId ) return null;
      const owner = UnitSystem.getInstance().getUnitById(ownerId);
      if (!owner) return null;
      const event = new CombatChallengeUseEvent(owner,data.eventId);
      return event;
  }
}
