import type { BuffInterface } from "../buff/BuffInterface";
import { BattleEvenetSystem } from "../system/BattleEventSystem";
import { BuffSystem } from "../system/BuffSystem";
import type { Unit } from "../units/Unit";
import type { EventSerializeData } from "./EventSerializeData";
import { EventSerializer } from "./EventSerializer";
import { GameEvent } from "./Event";
import { UuidUtil } from "../utils/UuidUtil";
import { UnitSystem } from "../system/UnitSystem";

export abstract class BasedAbstractEvent extends GameEvent {
  // 结束回合时移除增益效果事件
  static type = "attackEvent";
  static name = "UnitAttackEvent";
  eventId: string;
  eventData: any;
  eventType = BasedAbstractEvent.type;
  eventName = BasedAbstractEvent.name;
  constructor(uid?: string) {
    super();

    this.eventId = uid ? uid : UuidUtil.generate();
    this.eventData = {};
  }

  eventHandler = async (...args: any[]) => {
    return Promise.resolve({} as any);
  };

  static getSerializer(): EventSerializer {
    return BasedEventSerializer.getInstance();
  }
  getSerializer(): EventSerializer {
    return BasedAbstractEvent.getSerializer();
  }
  hook = () => {
    BattleEvenetSystem.getInstance().hookEvent(this); // 将事件挂钩到战斗事件系统
  };
}

export abstract class BasedEventSerializer extends EventSerializer {
  static instance: BasedEventSerializer;

  serialize(event: BasedAbstractEvent): EventSerializeData {
    const data = super.serialize(event);
    data.eventName = "UnitAttackEvent";
    return data;
  }

  abstract deserialize(data: EventSerializeData): BasedAbstractEvent | null;
}
