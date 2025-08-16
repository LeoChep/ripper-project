import type { Unit } from "@/core/units/Unit";
import { Power } from "../../Power";
import {
  checkRectionUseful,
  useReaction,
} from "@/core/system/InitiativeSystem";
import { attackMovementToUnit } from "@/core/action/UnitAttack";
import type { Creature, CreatureAttack } from "@/core/units/Creature";
import { golbalSetting } from "@/core/golbalSetting";
import { BattleEvenetSystem } from "@/core/system/BattleEventSystem";
import { AbilityValueSystem } from "@/core/system/AbilitiyValueSystem";


export class FunnelingFlurry extends Power {
  name = "FunnelingFlurry";
  displayName = "流动疾风斩";
  description = "随着如同毒蛇般的攻击，你将两个敌人逼迫到你认为合适的位置。";
  icon = "shield-edge-block";
  type = "fighter";
  actionType = "standard";
  useType: string = "encounter";
  cost = 1;
  cooldown = 3;
  range = 1;
  targetType = "one";

  owner = null as any; // 反应的拥有者
  constructor() {
    super({});
  }

  hook = () => {
   
  };
}
