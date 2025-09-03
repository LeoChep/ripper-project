import type { GameEvent } from "../event/Event";
import type { EventSerializeData } from "../event/EventSerializeData";

type EventHandler = (...args: any[]) => Promise<any>;
export class BattleEvenetSystem {
  static instance: BattleEvenetSystem | null = null;
  eventTypedMap: Map<string, GameEvent[]>;//一个分类map，key是事件类型，value是事件数组，用于加快查询
  eventIdMap: Map<string, GameEvent>;//一个ID映射表，key是事件ID，value是事件对象，用于快速查找关联event
  static getInstance() {
    if (!BattleEvenetSystem.instance) {
      BattleEvenetSystem.instance = new BattleEvenetSystem();
    }
    return BattleEvenetSystem.instance;
  }
  constructor() {
    this.eventTypedMap = new Map<string, GameEvent[]>();
    this.eventIdMap=new Map<string, GameEvent>();
  }
  hookEvent(gameEvent: GameEvent) {
    //放入分类map
    const eventTypeStr = gameEvent.eventType;
    const eventTypes = eventTypeStr.split("|");
    console.log(`Hooking event:`, eventTypes, gameEvent);
    for (let eventType of eventTypes) {
      const events = this.eventTypedMap.get(eventType);
      console.log(`Current events for ${eventType}:`, events);
      if (!events) {
        this.eventTypedMap.set(eventType, [gameEvent]);
        continue;
      }
      // 检查事件是否已存在
      if (events.some((event) => event === gameEvent)) {
        console.warn(`Event is already hooked.`);
        continue;
      }
      events.push(gameEvent);
    }
    //放入idmap
    this.eventIdMap.set(gameEvent.eventId, gameEvent);
  }
  getEventById(eventId: string): GameEvent | undefined {
    return this.eventIdMap.get(eventId);
  }
  clearEvents() {
    this.eventTypedMap.clear();
    this.eventIdMap.clear();
  }
  // 添加事件处理方法
  async handleEvent(eventType: string, ...args: any[]) {
    // 这里可以添加事件处理逻辑
    const allPromise = [] as Promise<any>[];
    const events = this.eventTypedMap.get(eventType);
    if (!events) {
      console.warn(`No events found for ${eventType}`, this.eventTypedMap);
      return;
    }
    const length = events.length;
    console.log(`Handling event: ${eventType}, args:`, [...args]);
    for (let i = 0; i < length; i++) {
      const event = events[i];
      if (event) {
        const promise = event.eventHandler(...args);
        allPromise.push(promise);
        await promise;
      }
    }
    await Promise.allSettled(allPromise);
  }
  serializeEvents(): EventSerializeData[] {
    console.log(`Serializing events:`, this.eventTypedMap);
    const allEvents = Array.from(this.eventTypedMap.values()).flat();
    //去重
    const uniqueEvents = Array.from(new Set(allEvents));
    return uniqueEvents.map((event) => event.getSerializer().serialize(event));
  }
}
