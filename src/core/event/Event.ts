import type { EventSerializeData } from "./EventSerializeData";
import { EventSerializer } from "./EventSerializer";

export abstract class GameEvent {
  abstract eventType: string;
  abstract eventName: string;
  abstract eventId: string;
  abstract eventData: any;
  abstract eventHandler: (...args: any[]) => Promise<any>;
  abstract hook: () => void;
  static serialize(gameEvent: GameEvent): EventSerializeData {
    return GameEvent.getSerializer().serialize(gameEvent);
  }
  static deserialize(data: EventSerializeData): GameEvent | null {
    return GameEvent.getSerializer().deserialize(data);
  }
  serialize(){
    return GameEvent.getSerializer().serialize(this);
  }
  deserialize(data: EventSerializeData): GameEvent | null {
    return GameEvent.getSerializer().deserialize(data);
  }
  static getSerializer(): EventSerializer {
    // throw new Error("Method not implemented.");
    return EventSerializer.getInstance();
  }
  getSerializer(): EventSerializer {
    return GameEvent.getSerializer();
  }
}
