
import { Power } from "../../Power";

export class HearteningStrike extends Power {
  name = "HearteningStrike";
  displayName = "振奋打击";
  description = "你的打击引导盟友攻击目标。";
  icon = "heartening-strike";
  type = "cleric";
  actionType = "standard";
  useType: string = "encounter";
  cost = 1;
  cooldown = 0;
  rangeText = "近战武器";
  target = "一个生物";
  attackText: string = `感知 vs. AC`;
  hitText: string = `2[W] + 感知调整值的伤害。`;
  effectText: string = `在你下回合结束前，当你或你的盟友攻击目标时，攻击者获得等同于你感知调整值的临时生命值。`;
  owner = null as any;
  constructor() {
    super({});
  }

  
}
