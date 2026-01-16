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
import { getThp } from "@/core/system/DamageSystem";

export class HearteningStrikeAimEvent extends BasedAbstractEvent {
  static readonly type = "attackBeforeRollEvent";
  static readonly name = "HearteningStrikeAimEvent";
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
    return HearteningStrikeAimEventSerializer.getInstance();
  }
  getSerializer(): EventSerializer {
    return HearteningStrikeAimEvent .getSerializer();
  }
  hook = () => {
    BattleEvenetSystem.getInstance().hookEvent(this);
  };
  eventHandler = async (
    attacker: Unit,
    target: Unit,
    attack: CreatureAttack
  ) => {
    if (this.curesdUnit && this.curesdUnit === target) {
      console.log("振奋打击临时生命获得触发:", this.curesdUnit, attacker, target,this);
      // 

      const buffs = BuffSystem.getInstance().findBuffByName(
        this.curesdUnit,
        "HearteningStrikeAimBuff"
      );
      const buff = buffs?.find((buff) => {
        if (buff.giver?.id === this.owner?.id) {
          return true;
        }
      });
      if (buff) {
        if (attacker.party===this.owner?.party) {
          //获得5临时生命
          console.log(" 获得5临时生命")
          getThp(5,attacker)
        }
      }
      return Promise.resolve();
    }
  };
}

export class HearteningStrikeAimEventSerializer    extends BasedEventSerializer {
  static instance: HearteningStrikeAimEventSerializer;
  static getInstance(): HearteningStrikeAimEventSerializer {
    if (!this.instance) {
      this.instance = new HearteningStrikeAimEventSerializer();
    }
    return this.instance;
  }
  serialize(event: HearteningStrikeAimEvent): EventSerializeData {
    const data = super.serialize(event);
    data.eventName = "HearteningStrikeAimEvent";
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

    const event = new HearteningStrikeAimEvent(
      owner,
      data.eventId,
      curesdUnit
    );
    return event;
  }
}
