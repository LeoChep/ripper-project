type EventHandler = (...args: any[]) => Promise<any>;
export class BattleEvenetSystem {
  static instance: BattleEvenetSystem | null = null;
  eventMap : Map<string,EventHandler[]> 
  static getInstance() {
    if (!BattleEvenetSystem.instance) {
      BattleEvenetSystem.instance = new BattleEvenetSystem();
    }
    return BattleEvenetSystem.instance;
  }
  constructor() {
    this.eventMap = new Map<string,EventHandler[]>();
  }
  hookEvent(battleEvent:{eventHandler:EventHandler,typeName:string}) {
    const events=this.eventMap.get(battleEvent.typeName);
    if (!events){
      this.eventMap.set(battleEvent.typeName,[battleEvent.eventHandler]);
      return;
    }
    // 检查事件是否已存在
    if (events.some((event) => event === battleEvent.eventHandler)) {
      console.warn(`Event is already hooked.`);
      return;
    }
    events.push(battleEvent.eventHandler);
  }
  clearEvents() {
    //his.events = [];
  }
  // 添加事件处理方法
  async handleEvent(eventName: string, ...args: any[]) {
    // 这里可以添加事件处理逻辑
    const allPromise = [] as Promise<any>[];
    const events= this.eventMap.get(eventName);
    if (!events) {
      console.warn(`No events found for ${eventName}`);
      return;
    }
    const length = events.length;
    console.log(`Handling event: ${eventName}, args:`,[...args]);
    for (let i = 0; i < length; i++) {
      const event = events[i];
      if (event) {
        const promise = event(...args);
        allPromise.push(promise);
        await promise;
      }
    }
    await Promise.allSettled(allPromise);
  }
}
