import { WeaponOfDivineProtectionEvent } from "../power/cleric/WeaponOfDivineProtection/WeaponOfDivineProtectionEvent";
import type { GameEvent } from "./Event";
import type { EventSerializeData } from "./EventSerializeData";


export class EventSheet {
  private static _instance: EventSheet;
  private _events: Map<string, EventClass>;

  private constructor() {
    this._events = new Map();
  }
  public getSerializer(name: string) {
    return this._events.get(name);
  }
  static getInstance(): EventSheet {
    if (!this._instance) {
      this._instance = new EventSheet();
      initEventSerializer();
    }
    console.log("EventSheet instance:", this._instance);
    return this._instance;
  }
  registerEventSerializer(name: string, gameEvent: EventClass): void {
    this._events.set(name, gameEvent);
  }
}
interface EventClass {
  name: string;
  deserialize: (data: any) => GameEvent | null;
  serialize: (event: any) => EventSerializeData;
}

function registerEventSerializer(eventClass: EventClass) {
  EventSheet.getInstance().registerEventSerializer(
    eventClass.name,
    eventClass  );
}
function initEventSerializer(): void {
  registerEventSerializer(WeaponOfDivineProtectionEvent);

}
