import { Power } from "../../Power";

export class IceRays extends Power {
  name = "IceRays";
  displayName = "冰冻射线";
  description = `你射出两束明亮的蓝白能量。在两束能量经过之地，各留下了一道浅浅的霜痕。`;
  icon = "shield-edge-block";
  type = "fighter";
  actionType = "standard";
  useType: string = "encounter";
  cost = 1;
  cooldown = 5;
  range = 1;
  
  target = "一个或两个";
  rangeText: string = "远程10";
  attackText: string=`智力 vs. 反射`;
  hitText: string = `1d10 + 智力调整值的寒冰伤害，且目标定身直到你下回合结束。`;
  missText: string = `目标迟缓直到你下一回合结束。`;
  owner = null as any; // 反应的拥有者
  constructor() {
    super({});
  }

  hook = () => {};
}
