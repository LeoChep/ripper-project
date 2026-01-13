import { WeaponOfDivineProtectionAreaMoveEvent } from "../power/cleric/WeaponOfDivineProtection/WeaponOfDivineProtectionAreaMoveEvent";
import { WeaponOfDivineProtectionEvent } from "../power/cleric/WeaponOfDivineProtection/WeaponOfDivineProtectionEvent";
import { ShieldEdgeBlockEvent } from "../power/fighter/ShieldEdgeBlock/ShieldEdgeBlockEvent";
import { OrbmastersIncendiaryDetonationDamageEvent } from "../power/wizard/OrbmastersIncendiaryDetonation/OrbmastersIncendiaryDetonationDamageEvent";
import { OrbmastersIncendiaryDetonationEvent } from "../power/wizard/OrbmastersIncendiaryDetonation/OrbmastersIncendiaryDetonationEvent";
import { CombatChallengeGiveEvent } from "../trait/fighter/CombatChallenge/CombatChallengeGiveEvent";
import { CombatChallengeUseEvent } from "../trait/fighter/CombatChallenge/CombatChallengeUseEvent";
import { EndTurnRemoveBuffEvent } from "./EndTurnRemoveBuffEvent";
import type { EventSerializer } from "./EventSerializer";

export class EventSerializerSheet {
  private static _instance: EventSerializerSheet;
  private _eventSerializer: Map<string, EventSerializer>;

  private constructor() {
    this._eventSerializer = new Map();
  }
  public getSerializer(name: string) {
    return this._eventSerializer.get(name);
  }
  static getInstance(): EventSerializerSheet {
    if (!this._instance) {
      this._instance = new EventSerializerSheet();
      initEventSerializer();
    }
    return this._instance;
  }
  registerEventSerializer(name: string, serializer: EventSerializer): void {
    this._eventSerializer.set(name, serializer);
  }
}
interface EventClassWithSerializer {
  name: string;
  getSerializer: () => EventSerializer;
}

function registerEventSerializer(eventClass: EventClassWithSerializer) {
  EventSerializerSheet.getInstance().registerEventSerializer(
    eventClass.name,
    eventClass.getSerializer()
  );
}
function initEventSerializer(): void {
  registerEventSerializer(CombatChallengeUseEvent);
  registerEventSerializer(CombatChallengeGiveEvent);
  registerEventSerializer(EndTurnRemoveBuffEvent);
  registerEventSerializer(ShieldEdgeBlockEvent);
  registerEventSerializer(OrbmastersIncendiaryDetonationEvent);
  registerEventSerializer(OrbmastersIncendiaryDetonationDamageEvent);
  registerEventSerializer(WeaponOfDivineProtectionEvent);
  registerEventSerializer(WeaponOfDivineProtectionAreaMoveEvent)
}
