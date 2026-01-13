import type { EventSerializeData } from "@/core/event/EventSerializeData";
import { EventSerializer } from "@/core/event/EventSerializer";
import {
  BasedAbstractEvent,
  BasedEventSerializer,
} from "@/core/event/BasedAbstractEvent";

import { BattleEvenetSystem } from "@/core/system/BattleEventSystem";

import { UnitSystem } from "@/core/system/UnitSystem";

import type { Unit } from "@/core/units/Unit";

import type { CreatureAttack } from "@/core/units/Creature";
import { BuffSystem } from "@/core/system/BuffSystem";

export class SonnlinorsHammerDamageDownEvent extends BasedAbstractEvent {
  static readonly type = "damageBeforeRollEvent";
  static readonly name = "SonnlinorsHammerDamageDownEvent";
  owner: Unit | null = null; // 施法单位
  curesdUnit: Unit | null = null; // 受影响单位
  constructor(owner: Unit, uid?: string, curesdUnit: Unit | null = null) {
    super(uid);
    this.owner = owner;
    this.curesdUnit = curesdUnit;
    this.eventData.ownerId = owner?.id;
    this.eventData.curesdUnitId = curesdUnit?.id;
  }

  static getSerializer(): EventSerializer {
    return SonnlinorsHammerDamageDownEventSerializer.getInstance();
  }
  getSerializer(): EventSerializer {
    return SonnlinorsHammerDamageDownEvent.getSerializer();
  }
  hook = () => {
    BattleEvenetSystem.getInstance().hookEvent(this);
  };
  eventHandler = async (
    attacker: Unit,
    target: Unit,
    attack: CreatureAttack
  ) => {
    if (this.curesdUnit && this.curesdUnit === attacker) {
      console.log("桑利诺之锤伤害降低触发:", this.curesdUnit, attacker, target);
      // 伤害降低5点

      const buffs = BuffSystem.getInstance().findBuffByName(
        this.curesdUnit,
        "SonnlinorsHammerDamageDownBuff"
      );
      const buff = buffs?.find((buff) => {
        if (buff.giver?.id === this.owner?.id) {
          return true;
        }
      });
      if (buff) {
        attack.damage += "-5";
        BuffSystem.getInstance().removeBuff(buff, this.curesdUnit);
        BattleEvenetSystem.getInstance().removeEventById(this.eventId);
      }
      return Promise.resolve();
    }
  };
}

export class SonnlinorsHammerDamageDownEventSerializer extends BasedEventSerializer {
  static instance: SonnlinorsHammerDamageDownEventSerializer;
  static getInstance(): SonnlinorsHammerDamageDownEventSerializer {
    if (!this.instance) {
      this.instance = new SonnlinorsHammerDamageDownEventSerializer();
    }
    return this.instance;
  }
  serialize(event: SonnlinorsHammerDamageDownEvent): EventSerializeData {
    const data = super.serialize(event);
    data.eventName = "SonnlinorsHammerDamageDownEvent";
    return data;
  }
  deserialize(data: EventSerializeData): BasedAbstractEvent | null {
    const { ownerId, curesdUnitId } = data.eventData;
    if (!ownerId) return null;
    const owner = UnitSystem.getInstance().getUnitById(ownerId);
    if (!owner) return null;
    if (!curesdUnitId) return null;
    const curesdUnit = UnitSystem.getInstance().getUnitById(curesdUnitId);
    if (!curesdUnit) return null;

    const event = new SonnlinorsHammerDamageDownEvent(
      owner,
      data.eventId,
      curesdUnit
    );
    return event;
  }
}
