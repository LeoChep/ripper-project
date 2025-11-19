import { Power } from "../../Power";

export class FreezingBurst extends Power {
  name = "FreezingBurst";
  displayName = "爆裂冰雹";
  description = `你把一个冰雹扔向敌人，冰雹爆裂开，将地面临时变成冰面。`;
  icon = "shield-edge-block";
  type = "fighter";
  actionType = "standard";
  useType: string = "atwill";
  cost = 1;
  cooldown = 5;
  range = 1;
  
  target = "一个或两个";
  rangeText: string = "区域10爆发1";
  attackText: string=`智力 vs. 反射`;
  hitText: string = `1d6 + 智力调整值的寒冰伤害，且你滑动目标1格。`;

  owner = null as any; // 反应的拥有者
  constructor() {
    super({});
  }

  hook = () => {};
}
