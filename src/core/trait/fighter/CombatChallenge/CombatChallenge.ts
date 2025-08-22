
import { BattleEvenetSystem } from "@/core/system/BattleEventSystem";
import type { Unit } from "@/core/units/Unit";
import { Trait, TraitOptions } from "../../Trait";

import { CombatChallengeUseEvent } from "./CombatChallengeUseEvent";
import { CombatChallengeGiveEvent } from "./CombatChallengeGiveEvent";

export class CombatChallenge extends Trait {
  name = "CombatChallenge";
  displayName = "战斗挑战";
  description = `在战斗中，忽略一名战士是危险的。每次你攻击一个敌人，无论是命中或失手，你都可以选择标记该敌人。此标记持续到你下一回合结束。
  另外，当一个被你标记的敌人邻近你，且它快步或进行目标不包括你的攻击，你都能以一个即时中断对它进行一次近战基本攻击。`;
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
