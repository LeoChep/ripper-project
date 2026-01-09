import type { Unit } from "@/core/units/Unit";
import { BasedAbstractEvent, BasedEventSerializer } from "../BasedAbstractEvent";
import type { Area } from "@/core/area/Area";
import type { EventSerializer } from "../EventSerializer";
import type { EventSerializeData } from "../EventSerializeData";
import { UnitSystem } from "@/core/system/UnitSystem";
import { AreaSystem } from "@/core/system/AreaSystem";
import { BattleEvenetSystem } from "@/core/system/BattleEventSystem";


export class InOutAreaMoveEvent extends BasedAbstractEvent {
  static readonly type = "UnitStartTurnEvent|moveToNewGridEvent";
  static readonly name = "InOutAreaMoveEvent";
  eventType =  "UnitStartTurnEvent|moveToNewGridEvent";
  eventName =  "InOutAreaMoveEvent";
  owner: Unit | null = null; // 释放单位
  area: Area | null = null; // 影响区域
  handledUnit: Unit[] = []; // 处理过的单位

  constructor(owner: Unit, area: Area | null, uid?: string) {
    super(uid);

    this.eventName = InOutAreaMoveEvent.name;
    this.eventType = InOutAreaMoveEvent.type;
    this.owner = owner;
    this.area = area;
    this.eventData.ownerId = owner?.id;
  }

  static getSerializer(): EventSerializer {
    return InOutAreaMoveEventSerializer.getInstance();
  }
  getSerializer(): EventSerializer {
    return InOutAreaMoveEvent.getSerializer();
  }
  hook = () => {
    BattleEvenetSystem.getInstance().hookEvent(this);
  };
  eventHandler = async (handlerUnit: Unit) => {
   
   
    return Promise.resolve();
  };
}

export class InOutAreaMoveEventSerializer extends BasedEventSerializer {
  static instance: InOutAreaMoveEventSerializer;
  static getInstance(): InOutAreaMoveEventSerializer {
    if (!this.instance) {
      this.instance = new InOutAreaMoveEventSerializer();
    }
    return this.instance;
  }
  serialize(
    event: InOutAreaMoveEvent
  ): EventSerializeData {
    const data = super.serialize(event);
    data.eventType = event.eventType;
    data.eventName = event.eventName;
    data.eventData.areaUid = event.area?.uid;
    //加入已经处理过的单位信息
    data.eventData.handledUnitIds = event.handledUnit.map((unit) => unit.id);
    return data;
  }
  deserialize(
    data: EventSerializeData
  ): InOutAreaMoveEvent | null {
    const ownerId = data.eventData.ownerId.toString();
    if (!ownerId) return null;
    const owner = UnitSystem.getInstance().getUnitById(ownerId);
    if (!owner) return null;

    const area = AreaSystem.getInstance().getArea(data.eventData.areaUid);

    if (!area) return null;
    const event = new InOutAreaMoveEvent(
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
