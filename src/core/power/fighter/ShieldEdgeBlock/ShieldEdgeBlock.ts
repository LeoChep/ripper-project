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
import { ShieldEdgeBlockEvent } from "./ShieldEdgeBlockEvent";

export class ShieldEdgeBlock extends Power {
  name = "ShieldEdgeBlock";
  displayName = "盾缘阻挡";
  description = "你以快速的盾缘猛击阻挡对手的攻势，并接着还以强力挥击。";
  icon = "shield-edge-block";
  type = "fighter";
  actionType = "reaction";
  useType: string = "encounter";
  cost = 1;
  cooldown = 3;
  trigger: string=`邻近你的一名敌人以近程或近战攻击对你命中或失手`;
  target: string=`触发的敌人`;
  hitText: string=`2d6 + 力量调整值的伤害。`;
  effectText: string=`目标的这次攻击检定受到-4减值。`;
  attackText: string=`力量 + 2 vs. 强韧`;
  range = 1;
  targetType = "self";
  hookTime = "Battle";
  
  owner = null as any; // 反应的拥有者
  constructor() {
    super({});
  }

  hook = () => {
    const event = new ShieldEdgeBlockEvent(this.owner);
    BattleEvenetSystem.getInstance().hookEvent(event);
  };
}
