
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

  owner = null as any; // 反应的拥有者
  constructor() {
    super({});
  }

  hook = () => {
   
  };
}
