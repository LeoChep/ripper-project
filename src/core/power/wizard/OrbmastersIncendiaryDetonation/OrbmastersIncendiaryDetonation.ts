
import { Power } from "../../Power";


export class OrbmastersIncendiaryDetonation extends Power {
  name = "OrbmastersIncendiaryDetonation";
  displayName = "法珠爆";
  description = "数团烈焰从你的法珠中冲出，并在敌人之间爆炸，形成燃烧的区域，烧灼尝试逃离的敌人。";
  icon = "shield-edge-block";
  type = "fighter";
  actionType = "standard";
  useType: string = "encounter";
  cost = 1;
  cooldown = 5;
  rangeText = "区域10 爆发1";
  target = "爆发范围内的每个生物";
  hitText: string = `命中：	1d6 + 智力调整值的力场伤害，且你击倒目标。`;
  effectText: string = `效果：此爆发创造一片烈焰的区域，此区域持续到你下回合结束。每个进入区域或在区域内开始其回合的敌人都受到2点火焰伤害。一个敌人每回合只能受到一次此伤害。`;
  // area=1;
  owner = null as any; // 反应的拥有者
  constructor() {
    super({});
  }

  hook = () => {
   
  };
}
