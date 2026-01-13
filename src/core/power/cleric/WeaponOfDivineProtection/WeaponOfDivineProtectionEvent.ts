import { BattleEvenetSystem } from "@/core/system/BattleEventSystem";

import type { Area } from "@/core/area/Area";

import {
  EndTurnTimer,
  EndTurnTimerSerializer,
} from "@/core/event/timer/EndTurnTimer";
import type { Unit } from "@/core/units/Unit";
import type { EventSerializeData } from "@/core/event/EventSerializeData";
import type { GameEvent } from "@/core/event/Event";
import type { EventSerializer } from "@/core/event/EventSerializer";
import { AreaSystem } from "@/core/system/AreaSystem";
import { UnitSystem } from "@/core/system/UnitSystem";
import type { WeaponOfDivineProtectionAreaMoveEvent } from "./WeaponOfDivineProtectionAreaMoveEvent";

export class WeaponOfDivineProtectionEvent extends EndTurnTimer {
  static readonly type = "UnitEndTurnEvent";

  owner: Unit | null = null; // 释放单位
  area: Area | null = null; // 影响区域
  turnCount: number = 0; // 回合数
  inOutEventId: string | undefined; // 关联的伤害事件ID
  eventName = "WeaponOfDivineProtectionEvent";
  static getSerializer(): EndTurnTimerSerializer {
    return WeaponOfDivineProtectionEventSerializer.getInstance();
  }
  static deserialize: (
    data: EventSerializeData
  ) => WeaponOfDivineProtectionEvent | null = (data: EventSerializeData) => {
    return WeaponOfDivineProtectionEventSerializer.getInstance().deserialize(data);
  };
  constructor(unit: Unit, turnCount: number = 0, uid?: string) {
    super(unit, turnCount);
    this.eventName = "WeaponOfDivineProtectionEvent";
    this.eventType = WeaponOfDivineProtectionEvent.type;
    this.owner = unit;
    this.turnCount = turnCount;
    this.eventData = {};
    this.eventData.endTurnUnitId = unit?.id;
  }

  hook = () => {
    BattleEvenetSystem.getInstance().hookEvent(this);
  };
  eventHandler = async (endturnUnit: Unit) => {
    // 处理结束回合时移除增益效果
    if (this.endTurnUnit !== endturnUnit) {
      return;
    }

    if (endturnUnit) {
      // alert("神圣守护之武器效果结束");
      this.turnCount--;
      console.log("当前回合数:", this.turnCount);
      if (this.turnCount <= 0) {
        console.log("神圣守护之武器效果结束，移除增益");
        if (this.area) AreaSystem.getInstance().removeArea(this.area);
        if (this.inOutEventId) {
          const inoutEvent = BattleEvenetSystem.getInstance().getEventById(
            this.inOutEventId
          ) as WeaponOfDivineProtectionAreaMoveEvent;
          inoutEvent.handledUnit.forEach((unit) => {
            // 移除增益
            inoutEvent.removeBuff(unit);
          });
        }
      }
    }
  };
}
class WeaponOfDivineProtectionEventSerializer extends EndTurnTimerSerializer {
  static instance: WeaponOfDivineProtectionEventSerializer;
  static getInstance(): WeaponOfDivineProtectionEventSerializer {
    if (!this.instance) {
      this.instance = new WeaponOfDivineProtectionEventSerializer();
    }
    return this.instance;
  }
  serialize(event: WeaponOfDivineProtectionEvent): EventSerializeData {
    const data = super.serialize(event);
    data.eventType = WeaponOfDivineProtectionEvent.type;
    data.eventName = "WeaponOfDivineProtectionEvent";
    data.eventData.areaUid = event.area?.uid;
    data.eventData.turnCount = event.turnCount;
    data.eventData.inOutEventId = event.inOutEventId;
    return data;
  }
  deserialize(data: EventSerializeData): WeaponOfDivineProtectionEvent | null {
    const endTurnTimer = super.deserialize(data);
    if (endTurnTimer) {
      const newEvent = new WeaponOfDivineProtectionEvent(
        endTurnTimer.endTurnUnit,
        endTurnTimer.turnCount,
        endTurnTimer.eventId
      );
      newEvent.area = AreaSystem.getInstance().getArea(data.eventData.areaUid);;
      newEvent.inOutEventId = data.eventData.inOutEventId;
      return newEvent;
    }
    return null;
  }
}
