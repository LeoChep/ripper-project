
import { BattleEvenetSystem } from "@/core/system/BattleEventSystem";
import type { Unit } from "@/core/units/Unit";
import { Trait, TraitOptions } from "../../Trait";

import { CombatChallengeUseEvent } from "./CombatChallengeUseEvent";
import { CombatChallengeGiveEvent } from "./CombatChallengeGiveEvent";

export class CombatChallenge extends Trait {
  name = "CombatChallenge";
  displayName = "战斗挑战";
  description = "战斗挑战";
  icon = "challenge";
  type = "combat";
  owner: Unit | null = null; //
  hookTime = "Battle";

  constructor(traitOptions: TraitOptions) {
    super(traitOptions || {});
  }
  hook() {
    //使用标记
    if (!this.owner) return;
    const event1 = new CombatChallengeUseEvent(this.owner);
    BattleEvenetSystem.getInstance().hookEvent(event1);

    const event2 = new CombatChallengeGiveEvent(this.owner);
    BattleEvenetSystem.getInstance().hookEvent(event2);
  }
}
