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
import { BuffSystem } from "@/core/system/BuffSystem";
import { WeaponOfDivineProtectionDefUp } from "./WeaponOfDivineProtectionDefUp";

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
  eventHandler = async (
    handlerUnit: Unit,
    oldGrids?: { x: number; y: number }[]
  ) => {
    //
    if (handlerUnit.id === this.owner?.id) {
      return Promise.resolve();
    }
    const effectGrids = (this.area?.effects[0] as AreaEffect).grids;
    const unitX = Math.floor(handlerUnit.x / tileSize);
    const unitY = Math.floor(handlerUnit.y / tileSize);
    console.log("神圣守护之武器触发:", unitX, unitY, oldGrids);
    //如果在生效单位里，则判断是否走出，否则判断是否进入
    let isEffectUnit = false;
    if (this.handledUnit.find((u) => u.id === handlerUnit.id)) {
      isEffectUnit = true;
    }
    const isStillIn = this.checkIn(handlerUnit, effectGrids);
    if (isEffectUnit && !isStillIn) {
      // 移除处理过的单位
      this.handledUnit = this.handledUnit.filter(
        (u) => u.id !== handlerUnit.id
      );
      //
      // alert("离开神圣武器范围");
       this.removeBuff(handlerUnit);
    }
    if (!isEffectUnit && isStillIn) {
      // 添加处理过的单位
      this.handledUnit.push(handlerUnit);
      // alert("进入神圣武器范围，获得保护");
      this.giveBuff(handlerUnit);
    }

    return Promise.resolve();
  };
  giveBuff = (target: Unit) => {
    const buffs = BuffSystem.getInstance().findBuffByName(
      target,
      WeaponOfDivineProtectionDefUp.name
    );
    const buff = buffs?.find((buff) => {
      return buff.giver?.id === this.owner?.id;
    });
    if (buff) {
      console.log(
        "目标已存在神圣守护之武器防御提升buff，跳过添加:",
        target,
        buff
      );
      return;
    }
    const newBuff = new WeaponOfDivineProtectionDefUp();
    newBuff.giver=this.owner;
    BuffSystem.getInstance().addTo(newBuff, target);
    console.log("给予神圣守护之武器防御提升buff:", target, newBuff);
  };
  removeBuff=(target: Unit) => {
    const buffs = BuffSystem.getInstance().findBuffByName(
      target,
      WeaponOfDivineProtectionDefUp.name
    );
    buffs?.forEach((buff) => {
      if (buff.giver?.id === this.owner?.id) {
        BuffSystem.getInstance().removeBuff(buff, target);
        console.log("移除神圣守护之武器防御提升buff:", target, buff);
      }
    });
  }
  checkIn = (
    handleUnit: Unit,
    effectGrids: Set<{ x: number; y: number; step: number }>
  ) => {
    const unitGrids = UnitSystem.getInstance().getUnitGrids(handleUnit);
    let isStillIn = false;
    for (const grid of effectGrids) {
      const isStillIGrid = unitGrids.find(
        (ug) => ug.x === grid.x && ug.y === grid.y
      );
      if (isStillIGrid) {
        //在一个格子里，说明在区域里
        isStillIn = true;
      }
    }
    return isStillIn;
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
