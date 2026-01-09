import type { BuffInterface } from "../../buff/BuffInterface";
import { BattleEvenetSystem } from "../../system/BattleEventSystem";
import { BuffSystem } from "../../system/BuffSystem";
import type { Unit } from "../../units/Unit";
import type { EventSerializeData } from "../EventSerializeData";
import { EventSerializer } from "../EventSerializer";
import { GameEvent } from "../Event";
import { UuidUtil } from "../../utils/UuidUtil";
import { UnitSystem } from "../../system/UnitSystem";

export class EndTurnTimer extends GameEvent {
  // 结束回合时事件
  static readonly type = "UnitEndTurnEvent";
  static readonly name = "EndTurnTimer";
  endTurnUnit: Unit; // 结束回合的单位
  turnCount: number; // 回合数
  constructor(
    endTurnUnit: Unit,
    turnCount: number,
    uid?: string
  ) {
    super();
    this.endTurnUnit = endTurnUnit;

    this.turnCount = turnCount; // 记录回合数
    this.eventId = uid ? uid : UuidUtil.generate();

  }
  eventId: string;
  eventData: any;
  eventType = "UnitEndTurnEvent";
  eventName = "EndTurnTimer";
  eventHandler = async (endturnUnit: Unit) => {
    // 处理结束回合时移除增益效果
    if (this.endTurnUnit !== endturnUnit) {
      return;
    }
  
    if (endturnUnit) {
      this.turnCount--;
      if (this.turnCount <= 0) {
        
      }
    }
  };

  static getSerializer(): EndTurnTimerSerializer {
    return EndTurnTimerSerializer.getInstance();
  }
  getSerializer(): EventSerializer {
    return EndTurnTimer.getSerializer();
  }
  static serialize(endTurnTimer:EndTurnTimer):EventSerializeData{
    return EndTurnTimer.getSerializer().serialize(endTurnTimer);
  }
 static deserialize(data: EventSerializeData): EndTurnTimer | null {
    return EndTurnTimer.getSerializer().deserialize(
      data
    );
  }
  serialize(): EventSerializeData {
    return EndTurnTimer.getSerializer().serialize(this);
  }
  hook = () => {
    BattleEvenetSystem.getInstance().hookEvent(this); // 将事件挂钩到战斗事件系统
  };
}
export class EndTurnTimerSerializer extends EventSerializer {
  static instance: EndTurnTimerSerializer;
  static getInstance(): EndTurnTimerSerializer {
    if (!this.instance) {
      this.instance = new EndTurnTimerSerializer();
    }
    return this.instance;
  }
  serialize(event: EndTurnTimer): EventSerializeData {
    const data = super.serialize(event);
    data.eventName = event.eventName;
    data.eventData = {
      endTurnUnitId: event.endTurnUnit.id.toString(),
      turnCount: event.turnCount,
    };
    return data;
  }

  deserialize(data: EventSerializeData): EndTurnTimer | null {
    const { endTurnUnitId, turnCount } =
      data.eventData as any;
    const endTurnUnit = UnitSystem.getInstance().getUnitById(endTurnUnitId);
    if (!endTurnUnit) return null;
   
    const event = new EndTurnTimer(
      endTurnUnit,
      turnCount,
      data.eventId
    );
    console.log("反序列化的事件数据:", event);
    return event;
  }
}
