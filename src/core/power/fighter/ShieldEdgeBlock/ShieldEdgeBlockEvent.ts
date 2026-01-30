
import { ShieldEdgeBlock } from "./ShieldEdgeBlock";

import { attackMovementToUnit } from "@/core/action/UnitAttack";
import { Marked } from "@/core/buff/Marked";
import { MessageTipSystem } from "@/core/system/MessageTipSystem";
import type { EventSerializeData } from "@/core/event/EventSerializeData";
import { EventSerializer } from "@/core/event/EventSerializer";
import {
  BasedAbstractEvent,
  BasedEventSerializer,
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
import type { CreatureAttack } from "@/core/units/Creature";
import { AbilityValueSystem } from "@/core/system/AbilitiyValueSystem";
import { checkPassiable } from "@/core/system/AttackSystem";

export class ShieldEdgeBlockEvent extends BasedAbstractEvent {
  static readonly type = "hitCheckEvent";
  static readonly name = "ShieldEdgeBlockEvent";
  owner: Unit | null = null; // 持盾单位
  constructor(owner: Unit, uid?: string) {
    super(uid);
    this.owner = owner;
    this.eventData.ownerId = owner?.id;
  }

  static getSerializer(): EventSerializer {
    return ShieldEdgeBlockEventSerializer.getInstance();
  }
  getSerializer(): EventSerializer {
    return ShieldEdgeBlockEvent.getSerializer();
  }
  hook = () => {
    BattleEvenetSystem.getInstance().hookEvent(this);
  };
  eventHandler = async (
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
        const grids=UnitSystem.getInstance().getGridsArround(this.owner);
        console.log('单位格子:', this.owner, grids);
        let canCounter=false;
        for (let {x,y} of grids){
          const isAttackerInGrid= UnitSystem.getInstance().checkUnitInGrid(attacker,x,y);
          if (!isAttackerInGrid) continue;
          console.log(isAttackerInGrid,'检查单位在格子内')
          let canCounterThePoint= checkPassiable(this.owner,x,y);
          
          if (canCounterThePoint ) canCounter=true
          break;
        }
        if (canCounter) {
          if (this.owner.party === "player") {
            let text;
            if (attackCheckResult.hit) {
              text = attacker.creature?.name + "的攻击命中，";
            }
            if (!attackCheckResult.hit) {
              text = attacker.creature?.name + "的攻击失手，";
            }
   
            const userChoice = await MessageTipSystem.getInstance().confirm(
              text + `单位 ${this.owner.name} 可以使用盾缘反击，是否执行？`
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
}
const getAttack = (unit: Unit) => {
  const attack = {} as CreatureAttack;
  const weapon = unit.creature?.weapons?.[0];
  const range = weapon?.range ?? 1; // 默认攻击范围为1
  const modifier = AbilityValueSystem.getInstance().getAbilityModifier(
    unit,
    "STR"
  );
  attack.attackBonus = AbilityValueSystem.getInstance().getLevelModifier(unit);
  attack.attackBonus += modifier;
  attack.attackBonus += weapon?.bonus ?? 0; // 添加武器加值
  attack.attackBonus += weapon?.proficiency ?? 0; // 添加武器熟练加值

  attack.name = weapon?.name ?? "攻击";
  attack.type = "melee";
  attack.range = range;
  attack.damage = "2d6+" + modifier;
  return attack;
};
export class ShieldEdgeBlockEventSerializer extends BasedEventSerializer{
  static instance: ShieldEdgeBlockEventSerializer;
  static getInstance(): ShieldEdgeBlockEventSerializer {
    if (!this.instance) {
      this.instance = new ShieldEdgeBlockEventSerializer();
    }
    return this.instance;
  }
  serialize(event: ShieldEdgeBlockEvent): EventSerializeData {
    const data = super.serialize(event);
    data.eventName = "ShieldEdgeBlockEvent";
    return data;
  }
  deserialize(data: EventSerializeData): BasedAbstractEvent | null {
      const { ownerId} = data.eventData;
      if (!ownerId ) return null;
      const owner = UnitSystem.getInstance().getUnitById(ownerId);
      if (!owner) return null;
      const event = new ShieldEdgeBlockEvent(owner,data.eventId);
      return event;
  }
}