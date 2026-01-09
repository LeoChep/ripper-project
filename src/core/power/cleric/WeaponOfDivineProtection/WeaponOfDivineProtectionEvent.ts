import { BattleEvenetSystem } from "@/core/system/BattleEventSystem";

import type { Area } from "@/core/area/Area";

import { EndTurnTimer, EndTurnTimerSerializer } from "@/core/event/timer/EndTurnTimer";
import type { Unit } from "@/core/units/Unit";
import type { EventSerializeData } from "@/core/event/EventSerializeData";
import type { GameEvent } from "@/core/event/Event";
import type { EventSerializer } from "@/core/event/EventSerializer";

export class WeaponOfDivineProtectionEvent extends EndTurnTimer {
  static readonly type = "UnitEndTurnEvent";

  owner: Unit | null = null; // 释放单位
  area: Area | null = null; // 影响区域
  turnCount: number = 0; // 回合数
  damageEventId: string | undefined; // 关联的伤害事件ID
  eventName = 'WeaponOfDivineProtectionEvent';
  static getSerializer(): EndTurnTimerSerializer {
    return WeaponOfDivineProtectionEventSerializer.getInstance();
  }
  static deserialize: (
    data: EventSerializeData
  ) => WeaponOfDivineProtectionEvent | null = (data: EventSerializeData) => {
    const endTurnTimer = EndTurnTimer.getSerializer().deserialize(data);
  
    console.log("反序列化WeaponOfDivineProtectionEvent:", endTurnTimer);
    if (endTurnTimer) {
      return new WeaponOfDivineProtectionEvent(
        endTurnTimer.endTurnUnit,
        endTurnTimer.turnCount,
        endTurnTimer.eventId
      );
    }
    return null;
  };
  constructor(unit: Unit, turnCount: number = 0, uid?: string) {
    super(unit, turnCount);
    this.eventName = 'WeaponOfDivineProtectionEvent';
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
      alert("神圣守护之武器效果结束");
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
  deserialize(data: EventSerializeData): WeaponOfDivineProtectionEvent | null {

    const endTurnTimer = super.deserialize(data);
    if (endTurnTimer) {
      return new WeaponOfDivineProtectionEvent(
        endTurnTimer.endTurnUnit,
        endTurnTimer.turnCount,
        endTurnTimer.eventId
      );
    }
    return null;
  }
}