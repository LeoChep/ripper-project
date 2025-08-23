
import { Power } from "../../Power";


export class MagicMissile extends Power {
  name = "MagicMissile";
  displayName = "魔法飞弹";
  description = "";
  icon = "shield-edge-block";
  type = "fighter";
  actionType = "standard";
  useType: string = "atwill";
  cost = 1;
  cooldown = 0;
  range = 1;
  targetType = "one";
  target = "一个";
  rangeText: string = "远程20";
  effectText: string='2 + 智力调整值的力场伤害。如果使用带有增强加值的法器施展此威能，则将此增强加值加到伤害上。另外，你可以将此威能作为远程基本攻击使用。';
  owner = null as any; // 反应的拥有者
  constructor() {
    super({});
  }

  hook = () => {
   
  };
}
