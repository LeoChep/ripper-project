
import { Power } from "../../Power";


export class SonnlinorsHammer extends Power {
  name = "SonnlinorsHammer";
  displayName = "索离诺尔之锤";
  description = "Your weapon is guided by your faith to strike true and weaken your enemy's zeal.";
  icon = "shield-edge-block";
  type = "cleric";
  actionType = "standard";
  useType: string = "atwill";
  cost = 1;
  cooldown = 1;
  range = 1;
  rangeText: string=`近战武器`;
  targetType = "one";
  target: string=`一个`;
  hitText: string=`1[W] + 感知调整值的伤害。在你下一回合结束前，目标下一次攻击在伤害骰上受到等同于你魅力调整值的减值`;

  attackText: string=`感知 vs. AC`;
  owner = null as any; // 反应的拥有者
  constructor() {
    super({});
  }

  hook = () => {
   
  };
}
