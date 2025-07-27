import type { CreatureAttack } from "../units/Creature";
import type { Unit } from "../units/Unit";
import type { Weapon } from "../units/Weapon";

export class WeaponSystem {
  static instance: WeaponSystem | null = null;

  static getInstance() {
    if (!WeaponSystem.instance) {
      WeaponSystem.instance = new WeaponSystem();
    }
    return WeaponSystem.instance;
  }

  private constructor() {}

  createWeaponAttack(unit: Unit, weapon: Weapon): CreatureAttack {

    const attack = {} as CreatureAttack;
    const range = weapon?.range ?? 1; // 默认攻击范围为1
    const modifer =
      unit.creature?.abilities?.find((ability) => ability.name === "Strength")
        ?.modifier ?? 0; // 使用力量作为攻击加值
    attack.attackBonus = modifer;
    attack.attackBonus += weapon?.bonus ?? 0; // 添加武器加值
    attack.attackBonus += 1 + 3 + 1; // 武器大师、擅长加值、战斗专长
    attack.damage = weapon?.damage ?? "1d6"; // 默认伤害为1d6
    attack.damage += `+${weapon?.bonus ?? 0}+${modifer}+1`; // 添加攻击加值到伤害
    attack.name =weapon?.name ?? "攻击";
    attack.type = "melee";
    attack.range = range;
    return attack;
  }
}