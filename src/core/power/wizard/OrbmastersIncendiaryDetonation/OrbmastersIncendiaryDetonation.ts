
import { Power } from "../../Power";


export class OrbmastersIncendiaryDetonation extends Power {
  name = "OrbmastersIncendiaryDetonation";
  displayName = "法珠爆";
  description = "";
  icon = "shield-edge-block";
  type = "fighter";
  actionType = "standard";
  useType: string = "encounter";
  cost = 1;
  cooldown = 5;
  range = 1;
  targetType = "two";

  owner = null as any; // 反应的拥有者
  constructor() {
    super({});
  }

  hook = () => {
   
  };
}
