import type { GameEvent } from "../event/Event";
import type { EventSerializeData } from "../event/EventSerializeData";

type EventHandler = (...args: any[]) => Promise<any>;
export class BattleEvenetSystem {
  static instance: BattleEvenetSystem | null = null;
  eventMap : Map<string,GameEvent[]>
  static getInstance() {
    if (!BattleEvenetSystem.instance) {
      BattleEvenetSystem.instance = new BattleEvenetSystem();
    }
    return BattleEvenetSystem.instance;
  }
  constructor() {
    this.eventMap = new Map<string,GameEvent[]>();
  }
  hookEvent(gameEvent: GameEvent) {
    const events=this.eventMap.get(gameEvent.eventType);
    if (!events){
      this.eventMap.set(gameEvent.eventType,[gameEvent]);
      return;
    }
    // 检查事件是否已存在
    if (events.some((event) => event === gameEvent)) {
      console.warn(`Event is already hooked.`);
      return;
    }
    events.push(gameEvent);
  }
  clearEvents() {
    //his.events = [];
  }
  // 添加事件处理方法
  async handleEvent(eventType: string, ...args: any[]) {
    // 这里可以添加事件处理逻辑
    const allPromise = [] as Promise<any>[];
    const events= this.eventMap.get(eventType);
    if (!events) {
      console.warn(`No events found for ${eventType}`);
      return;
    }
    const length = events.length;
    console.log(`Handling event: ${eventType}, args:`,[...args]);
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
    console.log(`Serializing events:`, this.eventMap);
    const allEvents = Array.from(this.eventMap.values()).flat();
    return allEvents.map((event) => event.getSerializer().serialize(event));
  }
}
