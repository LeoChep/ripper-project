import type { GameEvent } from "./Event";
import type { EventSerializeData } from "./EventSerializeData";

export class EventSerializer {
  static instance: EventSerializer;
  static getInstance(): EventSerializer {
    if (!this.instance) {
      this.instance = new EventSerializer();
    }
    return this.instance;
  }
  serialize(event: GameEvent): EventSerializeData {
    return {
      eventId: event.eventId,
      eventType: event.eventType,
      eventName: event.eventName,
      eventData: event.eventData
    };
  }

   deserialize(data: EventSerializeData,eventClass?: new (...args: any[]) => GameEvent): GameEvent|null {
    return  {} as GameEvent
  }
}
