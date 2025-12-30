
import { Power } from "../../Power";


export class WeaponOfDivineProtection extends Power {
  name = "WeaponOfDivineProtection";
  displayName = "神圣守护武器";
  description = "武器在你的手中成为可以进行强大的攻击和保卫盟友的神圣工具。";
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
  hitText: string=`1[W] + 力量调整值的伤害。`;
  effectText: string = `直到你下一回合结束，你的盟友在邻近你时，在所有防御上获得+2威能加值`;
  attackText: string=`力量 vs. AC`;
  owner = null as any; // 反应的拥有者
  constructor() {
    super({});
  }

  hook = () => {
   
  };
}
