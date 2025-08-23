import { Power } from "../../Power";

export class FunnelingFlurry extends Power {
  name = "FunnelingFlurry";
  displayName = "流动疾风斩";
  description = "随着如同毒蛇般的攻击，你将两个敌人逼迫到你认为合适的位置。";
  icon = "shield-edge-block";
  type = "fighter";
  actionType = "standard";
  useType: string = "encounter";
  cost = 1;
  cooldown = 3;
  range = 1;
  target = "一个或两个";
  hitText: string = `1[W] + 力量调整值的伤害。并且你令目标滑动1格。`;
  attackText: string=`力量 vs. AC （主手武器和副手武器），每个目标一次攻击`;
  owner = null as any; // 反应的拥有者
  constructor() {
    super({});
  }

  hook = () => {};
}
