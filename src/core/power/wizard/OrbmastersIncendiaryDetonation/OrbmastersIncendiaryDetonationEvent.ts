
import { attackMovementToUnit } from "@/core/action/UnitAttack";
import { Marked } from "@/core/buff/Marked";
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
import type { Area } from "@/core/area/Area";

export class OrbmastersIncendiaryDetonationEvent extends BasedAbstractEvent {
  static readonly type = "UnitEndTurnEvent";
  static readonly name = "OrbmastersIncendiaryDetonationEvent";
  owner: Unit | null = null; // 释放单位
  area:Area | null = null; // 影响区域
  turnCount: number = 0; // 回合数

  constructor(owner: Unit, area: Area | null, turnCount: number = 0, uid?: string) {
    super(uid);
    this.owner = owner;
    this.area = area;
    this.turnCount = turnCount;
    this.eventData.ownerId = owner?.id;
  }

  static getSerializer(): EventSerializer {
    return OrbmastersIncendiaryDetonationEventSerializer.getInstance();
  }
  getSerializer(): EventSerializer {
    return OrbmastersIncendiaryDetonationEvent.getSerializer();
  }
  hook = () => {
    BattleEvenetSystem.getInstance().hookEvent(this);
  };
  eventHandler = async (endturnUnit: Unit) => {
    if (this.owner===endturnUnit) {
      this.turnCount--;
    }
    if (this.turnCount <= 0) {
      //移除区域
      this.area?.effects.forEach((effect) => {
        effect.remove();

        
      })
    }
    return Promise.resolve();
  };
}

export class OrbmastersIncendiaryDetonationEventSerializer extends BasedEventSerializer{
  static instance: OrbmastersIncendiaryDetonationEventSerializer;
  static getInstance(): OrbmastersIncendiaryDetonationEventSerializer {
    if (!this.instance) {
      this.instance = new OrbmastersIncendiaryDetonationEventSerializer();
    }
    return this.instance;
  }
  serialize(event: OrbmastersIncendiaryDetonationEvent): EventSerializeData {
    const data = super.serialize(event);
    data.eventName = "OrbmastersIncendiaryDetonationEvent";
    return data;
  }
  deserialize(data: EventSerializeData): BasedAbstractEvent | null {
      const { ownerId} = data.eventData;
      if (!ownerId ) return null;
      const owner = UnitSystem.getInstance().getUnitById(ownerId);
      if (!owner) return null;
      // const event = new OrbmastersIncendiaryDetonationEvent(owner,data.eventId);
      // return event;
      return null
  }
}