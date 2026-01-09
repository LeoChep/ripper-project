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

import { getDamage } from "@/core/system/AttackSystem";
import { takeDamage } from "@/core/system/DamageSystem";
import { createDamageAnim } from "@/core/anim/DamageAnim";
import {
  InOutAreaMoveEvent,
  InOutAreaMoveEventSerializer,
} from "@/core/event/inOutArea/InOutAreaMoveEvent";
import type { AreaEffect } from "@/core/effect/areaEffect/AreaEffect";

export class WeaponOfDivineProtectionAreaMoveEvent extends InOutAreaMoveEvent {
  static readonly type = "UnitStartTurnEvent|moveToNewGridEvent";

  owner: Unit | null = null; // 释放单位
  area: Area | null = null; // 影响区域
  handledUnit: Unit[] = []; // 处理过的单位
  eventName = "WeaponOfDivineProtectionAreaMoveEvent";
  constructor(owner: Unit, area: Area | null, uid?: string) {
    super(owner, area, uid);

    this.eventName = "WeaponOfDivineProtectionAreaMoveEvent";
    this.eventType = WeaponOfDivineProtectionAreaMoveEvent.type;
    this.owner = owner;
    this.area = area;
    this.eventData.ownerId = owner?.id;
  }

  static getSerializer(): EventSerializer {
    return WeaponOfDivineProtectionAreaMoveEventSerializer.getInstance();
  }
  getSerializer(): EventSerializer {
    return WeaponOfDivineProtectionAreaMoveEvent.getSerializer();
  }
  hook = () => {
    BattleEvenetSystem.getInstance().hookEvent(this);
  };
  eventHandler = async (handlerUnit: Unit, oldGrids?: { x: number; y: number }[]) => {
    //判断是否已经伤害过
    if (this.handledUnit.includes(handlerUnit)) return Promise.resolve();
    const unitX = Math.floor(handlerUnit.x / tileSize);
    const unitY = Math.floor(handlerUnit.y / tileSize);
    console.log("神圣守护之武器触发:", unitX, unitY,oldGrids);
    (this.area?.effects[0] as AreaEffect).grids.forEach(async (grid) => {
      // 处理每个格子的逻辑
      if (grid.x === unitX && grid.y === unitY) {
        // 触发燃烧效果
        alert("神圣守护之武器触发保护效果，免疫伤害");
      }
    });
    return Promise.resolve();
  };
}

export class WeaponOfDivineProtectionAreaMoveEventSerializer extends InOutAreaMoveEventSerializer {
  static instance: WeaponOfDivineProtectionAreaMoveEventSerializer;
  static getInstance(): WeaponOfDivineProtectionAreaMoveEventSerializer {
    if (!this.instance) {
      this.instance = new WeaponOfDivineProtectionAreaMoveEventSerializer();
    }
    return this.instance;
  }

  deserialize(
    data: EventSerializeData
  ): WeaponOfDivineProtectionAreaMoveEvent | null {
    const ownerId = data.eventData.ownerId.toString();
    if (!ownerId) return null;
    const owner = UnitSystem.getInstance().getUnitById(ownerId);
    if (!owner) return null;

    const area = AreaSystem.getInstance().getArea(data.eventData.areaUid);

    if (!area) return null;
    const inOutEvent = super.deserialize(data);
    const event = new WeaponOfDivineProtectionAreaMoveEvent(
      inOutEvent?.owner! || owner,
      inOutEvent?.area! || area,
      data.eventId
    );
    console.log("反序列化的区域数据:", area, owner, event);
    //增加处理过的单位信息
    // if (data.eventData.handledUnitIds)
    //   event.handledUnit = data.eventData.handledUnitIds.map((id: string) =>
    //     UnitSystem.getInstance().getUnitById(id)
    //   );
    event.handledUnit = inOutEvent?.handledUnit || [];
    return event;
  }
}
