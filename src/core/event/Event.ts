import type { EventSerializeData } from './EventSerializeData';
import type { EventSerializer } from "./EventSerializer";

export interface GameEvent {
  eventType: string;
  eventName: string;
  eventId:string;
  eventData: any;
  eventHandler: (...args: any[]) => Promise<any>;

  getSerializer(): EventSerializer;
}

