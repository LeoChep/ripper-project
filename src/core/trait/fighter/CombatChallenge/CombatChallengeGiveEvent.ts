import { attackMovementToUnit } from "@/core/action/UnitAttack";
import { Marked } from "@/core/buff/Marked";
import { EndTurnRemoveBuffEvent } from "@/core/event/EndTurnRemoveBuffEvent";
import type { EventSerializeData } from "@/core/event/EventSerializeData";
import { EventSerializer } from "@/core/event/EventSerializer";
import {
  BasedAbstractEvent,
  BasedEventSerializer,
} from "@/core/event/BasedAbstractEvent";
import { golbalSetting } from "@/core/golbalSetting";
import { BattleEvenetSystem } from "@/core/system/BattleEventSystem";
import { BuffSystem } from "@/core/system/BuffSystem";
import {
  checkRectionUseful,
  useReaction,
} from "@/core/system/InitiativeSystem";
import { UnitSystem } from "@/core/system/UnitSystem";
import { WeaponSystem } from "@/core/system/WeaponSystem";
import type { Unit } from "@/core/units/Unit";
import type { Weapon } from "@/core/units/Weapon";
import * as InitiativeSystem from "@/core/system/InitiativeSystem";

export class CombatChallengeGiveEvent extends BasedAbstractEvent {
  static readonly type = "attackEvent";
  static readonly name = "CombatChallengeGiveEvent";
  owner: Unit | null = null; // 挑战者单位
  constructor(owner: Unit, uid?: string) {
    super(uid);
    this.owner = owner;
    this.eventData.ownerId = owner?.id;
  }

  static getSerializer(): EventSerializer {
    return CombatChallengeGiveSerializer.getInstance();
  }
  getSerializer(): EventSerializer {
    return CombatChallengeGiveEvent.getSerializer();
  }
  hook = () => {
    BattleEvenetSystem.getInstance().hookEvent(this);
  };
  eventHandler = async (attacker: Unit, target: Unit): Promise<void> => {
    if (!target) return Promise.resolve();
    if (this.owner === attacker) {
      const beTargetedEffect = new Marked();
      beTargetedEffect.owner = target;
      beTargetedEffect.giver = this.owner;
      BuffSystem.getInstance().addTo(beTargetedEffect, target);
      if (InitiativeSystem.checkIsTurn(this.owner)) {
        new EndTurnRemoveBuffEvent(this.owner, beTargetedEffect, 2).hook();
      } else {
        new EndTurnRemoveBuffEvent(this.owner, beTargetedEffect, 1).hook();
      }
    }
    return Promise.resolve();
  };
}
export class CombatChallengeGiveSerializer extends BasedEventSerializer {
  static instance: CombatChallengeGiveSerializer;
  static getInstance(): CombatChallengeGiveSerializer {
    if (!this.instance) {
      this.instance = new CombatChallengeGiveSerializer();
    }
    return this.instance;
  }
  serialize(event: CombatChallengeGiveEvent): EventSerializeData {
    const data = super.serialize(event);
    data.eventName = "CombatChallengeGiveEvent";
    return data;
  }
  deserialize(data: EventSerializeData): BasedAbstractEvent | null {
    const { ownerId } = data.eventData;
    if (!ownerId) return null;
    const owner = UnitSystem.getInstance().getUnitById(ownerId);
    if (!owner) return null;
    const event = new CombatChallengeGiveEvent(owner, data.eventId);
    return event;
  }
}
