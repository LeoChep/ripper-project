type EventHandler = (...args: any[]) => Promise<any>;
export class BattleEvenetSystem {
  static instance: BattleEvenetSystem | null = null;
  events = [] as {eventHandler:EventHandler,typeName:string}[];
  static getInstance() {
    if (!BattleEvenetSystem.instance) {
      BattleEvenetSystem.instance = new BattleEvenetSystem();
    }
    return BattleEvenetSystem.instance;
  }
  hookEvent(battleEvent:{eventHandler:EventHandler,typeName:string}) {
    // 检查事件是否已存在
    if (this.events.some((event) => event.eventHandler === battleEvent.eventHandler)) {
      console.warn(`Event is already hooked.`);
      return;
    }
    this.events.push(battleEvent);
  }
  clearEvents() {
    this.events = [];
  }
  // 添加事件处理方法
  async handleEvent(eventName: string, ...args: any[]) {
    // 这里可以添加事件处理逻辑
    const allPromise = [] as Promise<any>[];
    const length = this.events.length;
    console.log(`Handling event: ${eventName}, args:`,[...args]);
    for (let i = 0; i < length; i++) {
      const event = this.events[i];
      if (event&&event.typeName === eventName) {
        const promise = event.eventHandler(...args);
        allPromise.push(promise);
        await promise;
      }
    }
    await Promise.allSettled(allPromise);
  }
}
