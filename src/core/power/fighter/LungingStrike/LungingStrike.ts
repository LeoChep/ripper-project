
import { Power } from "../../Power";


export class LungingStrike extends Power {
  name = "LungingStrike";
  displayName = "突刺击";
  description = "你一记突刺，击中了本来位于你攻击范围外的敌人。";
  icon = "shield-edge-block";
  type = "fighter";
  actionType = "standard";
  useType: string = "atwill";
  cost = 1;
  cooldown = 1;
  range = 1;
  rangeText: string=`近战武器+1`;
  targetType = "one";
  target: string=`一个`;
  hitText: string=`1[W] + 力量调整值的伤害。`;
  attackText: string=`力量 - 1 vs. AC`;
  owner = null as any; // 反应的拥有者
  constructor() {
    super({});
  }

  hook = () => {
   
  };
}
