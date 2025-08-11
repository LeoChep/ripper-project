import type { BuffInterface } from "../buff/BuffInterface";
import { BattleEvenetSystem } from "../system/BattleEventSystem";
import { BuffSystem } from "../system/BuffSystem";
import type { Unit } from "../units/Unit";
import type { EventSerializeData } from "./EventSerializeData";
import { EventSerializer } from "./EventSerializer";
import type { GameEvent } from "./Event";
import { UuidUtil } from "../utils/UuidUtil";
import { UnitSystem } from "../system/UnitSystem";

export abstract class UnitAttackEvent implements GameEvent {
  // 结束回合时移除增益效果事件
  static readonly type = "attackEvent";
  static name = "UnitAttackEvent";
  attacker: Unit | null; // 发起攻击的单位
  target: Unit | null; // 目标单位

  constructor(attacker: Unit | null, target: Unit | null, uid?: string) {
    this.attacker = attacker;
    this.target = target;
    this.eventId = uid ? uid : UuidUtil.generate();
    this.eventData = {
      attackerId: attacker?.id,
      targetId: target?.id,
    };
  }
  eventId: string;
  eventData: any;
  eventType = UnitAttackEvent.type;
  eventName = UnitAttackEvent.name;
  eventHandler = async (...args: any[]) => {
    return Promise.resolve({} as any);
  };

  getSerializer(): EventSerializer {
    return EventSerializer.getInstance();
  }
  hook = () => {
    BattleEvenetSystem.getInstance().hookEvent(this); // 将事件挂钩到战斗事件系统
  };
}

export abstract class UnitAttackSerializer extends EventSerializer {
  static instance: UnitAttackSerializer;
  //  abstract getInstance(): UnitAttackSerializer ;
  // static getInstance(): UnitAttackSerializer {
  //   if (!this.instance) {
  //     this.instance = new UnitAttackSerializer();
  //   }
  //   return this.instance;
  // }
  serialize(event: UnitAttackEvent): EventSerializeData {
    const data = super.serialize(event);
    data.eventName = "UnitAttackEvent";
    return data;
  }

  abstract deserialize(data: EventSerializeData): UnitAttackEvent | null;
}
