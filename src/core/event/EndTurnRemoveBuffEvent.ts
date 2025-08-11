import type { BuffInterface } from "../buff/BuffInterface";
import { BattleEvenetSystem } from "../system/BattleEventSystem";
import { BuffSystem } from "../system/BuffSystem";
import type { Unit } from "../units/Unit";
import type { EventSerializeData } from "./EventSerializeData";
import { EventSerializer } from "./EventSerializer";
import type { GameEvent } from "./Event";
import { UuidUtil } from "../utils/UuidUtil";
import { UnitSystem } from "../system/UnitSystem";

export class EndTurnRemoveBuffEvent implements GameEvent {
  // 结束回合时移除增益效果事件
  static readonly type = "UnitEndTurnEvent";
  static readonly name = "EndTurnRemoveBuffEvent";
  endTurnUnit: Unit; // 结束回合的单位
  buff: BuffInterface; // 要移除的增益效果
  turnCount: number; // 回合数
  constructor(
    endTurnUnit: Unit,
    buff: BuffInterface,
    turnCount: number,
    uid?: string
  ) {
    this.endTurnUnit = endTurnUnit;
    this.buff = buff;
    this.turnCount = turnCount; // 记录回合数
    this.eventId = uid ? uid : UuidUtil.generate();

    this.eventData = {
      endTurnUnitId: this.endTurnUnit.id.toString(),
      buffId: this.buff.uid,
      turnCount: this.turnCount,
      buffOwnerId: this?.buff?.owner?.id.toString()
    };
  }
  eventId: string;
  eventData: any;
  eventType = "UnitEndTurnEvent";
  eventName = "EndTurnRemoveBuffEvent";
  eventHandler = async (endturnUnit: Unit) => {
    // 处理结束回合时移除增益效果
    if (this.endTurnUnit !== endturnUnit) {
      return;
    }
    const targetUnit = this.buff.owner;
    if (!targetUnit) {
      console.warn(`Buff owner is not defined for buff: ${this.buff.name}`);
      return;
    }
    const buffs = targetUnit.creature?.buffs;
    if (!buffs) {
      console.warn(`No buffs found for unit: ${this.endTurnUnit.name}`);
      return;
    }
    const buffToRemove = buffs.find((buff) => buff == this.buff);
    console.log(
      `EndTurnRemoveBuffEvent: Removing buff ${this.buff.name} from unit ${this.endTurnUnit.name}, turn count: ${this.turnCount}`
    );
    console.log("EndTurnRemoveBuffEvent", buffToRemove);
    if (buffToRemove) {
      this.turnCount--;
      if (this.turnCount <= 0) {
        BuffSystem.getInstance().removeBuff(buffToRemove, targetUnit);
      }
    }
  };

  getSerializer(): EventSerializer {
    return EndTurnRemoveBuffEventSerializer.getInstance();
  }
  hook = () => {
    BattleEvenetSystem.getInstance().hookEvent(this); // 将事件挂钩到战斗事件系统
  };
}
export class EndTurnRemoveBuffEventSerializer extends EventSerializer {
  static instance: EndTurnRemoveBuffEventSerializer;
  static getInstance(): EndTurnRemoveBuffEventSerializer {
    if (!this.instance) {
      this.instance = new EndTurnRemoveBuffEventSerializer();
    }
    return this.instance;
  }
  serialize(event: EndTurnRemoveBuffEvent): EventSerializeData {
    const data = super.serialize(event);
    data.eventName = "EndTurnRemoveBuffEvent";
    return data;
  }

  deserialize(data: EventSerializeData): EndTurnRemoveBuffEvent | null {
    const { endTurnUnitId, buffOwnerId, buffId, turnCount } = data.eventData as any;
    const endTurnUnit = UnitSystem.getInstance().getUnitById(endTurnUnitId);
    if (!endTurnUnit) return null;
    const buffOwner = UnitSystem.getInstance().getUnitById(buffOwnerId);
    if (!buffOwner) return null;
    const buff = BuffSystem.getInstance().findBuffInUnit(buffOwner, buffId);
    console.log("反序列化的增益效果:", buff);
    if (!buff) return null;
    const event = new EndTurnRemoveBuffEvent(endTurnUnit, buff, turnCount,data.eventId);
     console.log("反序列化的事件数据:", event);
    return event;
  }
}
