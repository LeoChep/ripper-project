import { Item } from "../../Item";
import { ItemType, ItemRarity } from "../../ItemInterface";
import type { ItemOptions } from "../../ItemInterface";

/**
 * 治疗药水道具
 * 用于恢复生命值，可以对周围1格内的单位使用
 */
export class HealWater extends Item {
  constructor(options?: Partial<ItemOptions>) {
    super({
      name: "治疗药水",
      description: "恢复使用对象的生命值",
      type: ItemType.CONSUMABLE,
      rarity: ItemRarity.COMMON,
      maxStack: 99,
      stackCount: 1,
      canUse: true,
      canEquip: false,
      value: 25,
      weight: 0.5,
      properties: {
        healAmount: 50,              // 恢复生命值量
        range: 1,                    // 使用范围（周围1格）
        effectType: "heal",          // 效果类型：治疗
        canTargetSelf: true,         // 可以对自己使用
        canTargetAlly: true,         // 可以对盟友使用
        splashRange: 1,              // 溅射范围（格子数）
        ...options?.properties
      },
      ...options
    });
  }

  /**
   * 获取治疗量
   * @returns 治疗量
   */
  getHealAmount(): number {
    // 支持骰子表达式，如 "2d8+3"
    const healFormula = this.properties?.healAmount;
    if (typeof healFormula === 'string') {
      return this.evaluateDiceFormula(healFormula);
    }
    return healFormula || 50;
  }

  /**
   * 计算骰子表达式
   * @param formula 骰子表达式，如 "2d6+3"
   * @returns 计算结果
   */
  private evaluateDiceFormula(formula: string): number {
    // 简单解析 xdY+Z 格式
    const match = formula.match(/(\d+)d(\d+)([+-]\d+)?/i);
    if (!match) {
      return parseInt(formula) || 50;
    }

    const count = parseInt(match[1]);
    const sides = parseInt(match[2]);
    const modifier = match[3] ? parseInt(match[3]) : 0;

    let total = 0;
    for (let i = 0; i < count; i++) {
      total += Math.floor(Math.random() * sides) + 1;
    }
    return total + modifier;
  }

  /**
   * 获取使用范围
   * @returns 使用范围（格子数）
   */
  getRange(): number {
    return this.properties?.range || 1;
  }

  /**
   * 检查目标是否有效（必须是盟友或自己）
   * @param isAlly 是否为盟友
   * @param isSelf 是否为自己
   */
  isValidTarget(isAlly: boolean, isSelf: boolean): boolean {
    const canTargetSelf = this.properties?.canTargetSelf !== false;
    const canTargetAlly = this.properties?.canTargetAlly !== false;

    return (isSelf && canTargetSelf) || (isAlly && canTargetAlly);
  }
}
