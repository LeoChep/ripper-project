import { Item } from "../../Item";
import { ItemType, ItemRarity } from "../../ItemInterface";
import type { ItemOptions } from "../../ItemInterface";

/**
 * 圣水道具
 * 用于驱散不洁之物，对不死生物造成神圣伤害
 */
export class HolyWater extends Item {
  constructor(options?: Partial<ItemOptions>) {
    super({
      name: "圣水",
      description: "用于驱散不洁之物的圣水，对不死生物造成2d6点神圣伤害",
      type: ItemType.CONSUMABLE,
      rarity: ItemRarity.COMMON,
      maxStack: 10,
      stackCount: 1,
      canUse: true,
      canEquip: false,
      value: 50,
      weight: 0.5,
      properties: {
        damageType: "radiant",       // 神圣伤害类型
        damageDice: "2d6",            // 伤害骰子
        effectOnUndead: true,         // 对不死生物有效
        splashRange: 1,               // 溅射范围（格子数）
        ...options?.properties
      },
      ...options
    });
  }

  /**
   * 获取圣水的伤害
   * @returns 伤害值
   */
  getDamage(): number {
    // 2d6伤害
    const roll1 = Math.floor(Math.random() * 6) + 1;
    const roll2 = Math.floor(Math.random() * 6) + 1;
    return roll1 + roll2;
  }

  /**
   * 检查目标是否为不死生物
   * @param targetType 目标生物类型
   */
  isUndeadTarget(targetType?: string): boolean {
    if (!targetType) return false;
    const undeadTypes = ['undead', 'skeleton', 'zombie', 'ghost', 'vampire', 'lich'];
    return undeadTypes.some(type => targetType.toLowerCase().includes(type));
  }
}
