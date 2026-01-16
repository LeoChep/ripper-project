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
import { BuffSystem } from "@/core/system/BuffSystem";
import type { HearteningStrikeAimEvent } from "./HearteningStrikeAimEvent";

export class HearteningStrikeTimerEvent extends EndTurnTimer {
  static readonly type = "UnitEndTurnEvent";

  owner: Unit | null = null; // 释放单位
  area: Area | null = null; // 影响区域
  turnCount: number = 0; // 回合数
  childEventId: string | undefined; // 关联的伤害事件ID
  eventName = "HearteningStrikeTimerEvent";
  static getSerializer(): EndTurnTimerSerializer {
    return HearteningStrikeTimerEventSerializer.getInstance();
  }
  static deserialize: (
    data: EventSerializeData
  ) => HearteningStrikeTimerEvent | null = (data: EventSerializeData) => {
    return HearteningStrikeTimerEventSerializer.getInstance().deserialize(data);
  };
  constructor(unit: Unit, turnCount: number = 0, uid?: string) {
    super(unit, turnCount);
    this.eventName = "HearteningStrikeTimerEvent";
    this.eventType = HearteningStrikeTimerEvent.type;
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

    // alert("神圣守护之武器效果结束");
    this.turnCount--;
    console.log("当前回合数:", this.turnCount);
    if (this.turnCount > 0) return;

    console.log("振奋打击之武器效果结束，移除增益");

    if (this.childEventId) {
      const childEvent = BattleEvenetSystem.getInstance().getEventById(
        this.childEventId
      ) as HearteningStrikeAimEvent;
      if (childEvent && childEvent.curesdUnit) {
        this.removeBuff(childEvent.curesdUnit);
      }
      BattleEvenetSystem.getInstance().removeEventById(this.childEventId);
    }
  };

  removeBuff = (curesdUnit: Unit) => {
    const buffs = BuffSystem.getInstance().findBuffByName(
      curesdUnit,
      "HearteningStrikeAimBuff"
    );
    const buff = buffs?.find((buff) => {
      if (buff.giver?.id === this.owner?.id) {
        return true;
      }
    });
    if (buff) BuffSystem.getInstance().removeBuff(buff, curesdUnit);
  };
}

class HearteningStrikeTimerEventSerializer extends EndTurnTimerSerializer {
  static instance: HearteningStrikeTimerEventSerializer;
  static getInstance(): HearteningStrikeTimerEventSerializer {
    if (!this.instance) {
      this.instance = new HearteningStrikeTimerEventSerializer();
    }
    return this.instance;
  }
  serialize(event: HearteningStrikeTimerEvent): EventSerializeData {
    const data = super.serialize(event);
    data.eventType = HearteningStrikeTimerEvent.type;
    data.eventName = "HearteningStrikeTimerEvent";
    data.eventData.areaUid = event.area?.uid;
    data.eventData.turnCount = event.turnCount;
    data.eventData.childEventId = event.childEventId;
    return data;
  }
  deserialize(data: EventSerializeData): HearteningStrikeTimerEvent | null {
    const endTurnTimer = super.deserialize(data);
    if (endTurnTimer) {
      const newEvent = new HearteningStrikeTimerEvent(
        endTurnTimer.endTurnUnit,
        endTurnTimer.turnCount,
        endTurnTimer.eventId
      );
      // newEvent.area = AreaSystem.getInstance().getArea(data.eventData.areaUid);;
      newEvent.childEventId = data.eventData.inOutEventId;
      return newEvent;
    }
    return null;
  }
}
