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
import { AreaSystem } from "@/core/system/AreaSystem";

export class OrbmastersIncendiaryDetonationEvent extends BasedAbstractEvent {
  static readonly type = "UnitEndTurnEvent";
  static readonly name = "OrbmastersIncendiaryDetonationEvent";
  owner: Unit | null = null; // 释放单位
  area: Area | null = null; // 影响区域
  turnCount: number = 0; // 回合数

  constructor(
    owner: Unit,
    area: Area | null,
    turnCount: number = 0,
    uid?: string
  ) {
    super(uid);
    this.eventName = OrbmastersIncendiaryDetonationEvent.name;
    this.eventType = OrbmastersIncendiaryDetonationEvent.type;
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
    console.log("当前回合数:", this.owner, endturnUnit, this.turnCount);
    if (this.owner === endturnUnit) {
      this.turnCount--;
      console.log("当前回合数:", this.turnCount);
    }

    if (this.turnCount <= 0) {
      //移除区域
      this.area?.effects.forEach((effect) => {
        effect.remove();
      });
      if (this.area) AreaSystem.getInstance().removeArea(this.area);
    }

    return Promise.resolve();
  };
}

export class OrbmastersIncendiaryDetonationEventSerializer extends BasedEventSerializer {
  static instance: OrbmastersIncendiaryDetonationEventSerializer;
  static getInstance(): OrbmastersIncendiaryDetonationEventSerializer {
    if (!this.instance) {
      this.instance = new OrbmastersIncendiaryDetonationEventSerializer();
    }
    return this.instance;
  }
  serialize(event: OrbmastersIncendiaryDetonationEvent): EventSerializeData {
    const data = super.serialize(event);
    data.eventType = OrbmastersIncendiaryDetonationEvent.type;
    data.eventName = "OrbmastersIncendiaryDetonationEvent";
    data.eventData.areaUid = event.area?.uid;
    data.eventData.turnCount = event.turnCount;
    return data;
  }
  deserialize(
    data: EventSerializeData
  ): OrbmastersIncendiaryDetonationEvent | null {
    const ownerId = data.eventData.ownerId.toString();
    if (!ownerId) return null;
    const owner = UnitSystem.getInstance().getUnitById(ownerId);
    if (!owner) return null;

    const area = AreaSystem.getInstance().getArea(data.eventData.areaUid);

    if (!area) return null;
    const event = new OrbmastersIncendiaryDetonationEvent(
      owner,
      area,
      data.eventData.turnCount,
      data.eventId
    );
    console.log("反序列化的区域数据:", area, owner, event);
    return event;
  }
}
