import type { GameEvent } from "./Event";
import type { EventSerializeData } from "./EventSerializeData";

export class EventSerializer {
  serialize(event: GameEvent): EventSerializeData {
    return {
      eventId: event.eventId,
      eventType: event.eventType,
      eventName: event.eventName,
      eventData: event.eventData
    };
  }

   deserialize(data: EventSerializeData): GameEvent|null {
    return  {} as GameEvent
  }
}
