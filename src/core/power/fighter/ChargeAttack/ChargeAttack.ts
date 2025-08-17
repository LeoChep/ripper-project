
import { Power } from "../../Power";


export class ChargeAttack extends Power {
  name = "ChargeAttack";
  displayName = "冲锋击";
  description = "随着如同毒蛇般的攻击，你将两个敌人逼迫到你认为合适的位置。";
  icon = "shield-edge-block";
  type = "fighter";
  actionType = "standard";
  useType: string = "atwill";
  cost = 1;
  cooldown = 1;
  range = 1;
  targetType = "one";

  owner = null as any; // 反应的拥有者
  constructor() {
    super({});
  }

  hook = () => {
   
  };
}
