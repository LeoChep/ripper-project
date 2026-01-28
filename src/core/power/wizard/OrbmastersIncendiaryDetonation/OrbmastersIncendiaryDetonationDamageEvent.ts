import type { EventSerializeData } from "@/core/event/EventSerializeData";
import { EventSerializer } from "@/core/event/EventSerializer";
import {
  BasedAbstractEvent,
  BasedEventSerializer,
} from "@/core/event/BasedAbstractEvent";
import { BattleEvenetSystem } from "@/core/system/BattleEventSystem";

import { UnitSystem } from "@/core/system/UnitSystem";

import type { Unit } from "@/core/units/Unit";

import type { Area } from "@/core/area/Area";
import { AreaSystem } from "@/core/system/AreaSystem";
import { tileSize } from "@/core/envSetting";
import type { BurnAreaEffect } from "./BurnAreaEffect";
import { getDamage } from "@/core/system/AttackSystem";
import { takeDamage } from "@/core/system/DamageSystem";
import { createDamageAnim } from "@/core/anim/DamageAnim";

export class OrbmastersIncendiaryDetonationDamageEvent extends BasedAbstractEvent {
  static readonly type = "UnitStartTurnEvent|moveToNewGridEvent";
  static readonly name = "OrbmastersIncendiaryDetonationDamageEvent";
  owner: Unit | null = null; // 释放单位
  area: Area | null = null; // 影响区域
  handledUnit: Unit[] = []; // 处理过的单位

  constructor(owner: Unit, area: Area | null, uid?: string) {
    super(uid);

    this.eventName = OrbmastersIncendiaryDetonationDamageEvent.name;
    this.eventType = OrbmastersIncendiaryDetonationDamageEvent.type;
    this.owner = owner;
    this.area = area;
    this.eventData.ownerId = owner?.id;
  }

  static getSerializer(): EventSerializer {
    return OrbmastersIncendiaryDetonationDamageEventSerializer.getInstance();
  }
  getSerializer(): EventSerializer {
    return OrbmastersIncendiaryDetonationDamageEvent.getSerializer();
  }
  hook = () => {
    BattleEvenetSystem.getInstance().hookEvent(this);
  };
  eventHandler = async (handlerUnit: Unit) => {
    //判断是否已经伤害过
    if (this.handledUnit.includes(handlerUnit)) return Promise.resolve();
    const unitX = Math.floor(handlerUnit.x / tileSize);
    const unitY = Math.floor(handlerUnit.y / tileSize);
    console.log("燃烧伤害触发:", this.area, handlerUnit);
    (this.area?.effects[0] as BurnAreaEffect).grids.forEach(async (grid) => {
      // 处理每个格子的逻辑
      if (grid.x === unitX && grid.y === unitY) {
        // 触发燃烧效果
        const damage = 2;
          console.log("造成燃烧伤害触发:", this.area, handlerUnit);
        takeDamage(damage, handlerUnit);
        createDamageAnim(damage.toString(), handlerUnit);
        this.handledUnit.push(handlerUnit);
      }
    });
    return Promise.resolve();
  };
}

export class OrbmastersIncendiaryDetonationDamageEventSerializer extends BasedEventSerializer {
  static instance: OrbmastersIncendiaryDetonationDamageEventSerializer;
  static getInstance(): OrbmastersIncendiaryDetonationDamageEventSerializer {
    if (!this.instance) {
      this.instance = new OrbmastersIncendiaryDetonationDamageEventSerializer();
    }
    return this.instance;
  }
  serialize(
    event: OrbmastersIncendiaryDetonationDamageEvent
  ): EventSerializeData {
    const data = super.serialize(event);
    data.eventType = OrbmastersIncendiaryDetonationDamageEvent.type;
    data.eventName = "OrbmastersIncendiaryDetonationDamageEvent";
    data.eventData.areaUid = event.area?.uid;
    //加入已经处理过的单位信息
    data.eventData.handledUnitIds = event.handledUnit.map((unit) => unit.id);
    return data;
  }
  deserialize(
    data: EventSerializeData
  ): OrbmastersIncendiaryDetonationDamageEvent | null {
    const ownerId = data.eventData.ownerId.toString();
    if (!ownerId) return null;
    const owner = UnitSystem.getInstance().getUnitById(ownerId);
    if (!owner) return null;

    const area = AreaSystem.getInstance().getArea(data.eventData.areaUid);

    if (!area) return null;
    const event = new OrbmastersIncendiaryDetonationDamageEvent(
      owner,
      area,
      data.eventId
    );
    console.log("反序列化的区域数据:", area, owner, event);
    //增加处理过的单位信息
    if (data.eventData.handledUnitIds)
      event.handledUnit = data.eventData.handledUnitIds.map((id: string) =>
        UnitSystem.getInstance().getUnitById(id)
      );
    return event;
  }
}
