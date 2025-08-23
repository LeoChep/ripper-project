
import { Power } from "../../Power";


export class ChargeAttack extends Power {
  name = "ChargeAttack";
  displayName = "冲锋击";
  description = "你如暴风般冲入敌阵中央，吸引对方的攻击往你身上招呼。";
  icon = "shield-edge-block";
  type = "fighter";
  actionType = "standard";
  useType: string = "atwill";
  cost = 1;
  cooldown = 1;
  range = 1;
  targetType = "one";
  attackText: string=`力量  vs. AC`;
  hitText: string=`1[W]+力量调整值的伤害`;
  effectText: string=`在攻击前，你向目标点直线行走`;
  owner = null as any; // 反应的拥有者
  constructor() {
    super({});
  }

  hook = () => {
   
  };
}
