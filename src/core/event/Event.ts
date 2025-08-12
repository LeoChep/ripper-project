import type { EventSerializeData } from "./EventSerializeData";
import type { EventSerializer } from "./EventSerializer";

export abstract class GameEvent {
  abstract eventType: string;
  abstract eventName: string;
  abstract eventId: string;
  abstract eventData: any;
  abstract eventHandler: (...args: any[]) => Promise<any>;
  abstract hook: () => void;
  static getSerializer(): EventSerializer {
    throw new Error("Method not implemented.");
  }
  getSerializer(): EventSerializer {
    return GameEvent.getSerializer();
  }
}
