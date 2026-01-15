
import { Power } from "../../Power";

export class DivineGlow extends Power {
  name = "DivineGlow";
  displayName = "圣耀";
  description = "你向神祷告，圣徽闪耀出白色的亮光。烈光灼烧你的敌人，但鼓舞与引导你的同伴。";
  icon = "radiant-glow";
  type = "cleric";
  actionType = "standard";
  useType: string = "encounter";
  cost = 1;
  cooldown = 0;
  rangeText = "近程冲击3";
  target = "冲击范围内的所有敌人";
  attackText: string = `感知 vs. 反射`;
  hitText: string = `1d8 + 感知调整值的光耀伤害。`;
  effectText: string = `直到你下一回合结束，冲击范围内的所有盟友在攻击骰上获得+2威能加值。`;
  owner = null as any;
  constructor() {
    super({});
  }

  hook = () => {
    // 具体效果与控制器实现
  };
}
