/**
 * 道具系统快速参考
 * 
 * 这个文件提供了道具系统的快速参考和常用代码片段
 */

import { Item } from './Item';
import { ItemType, ItemRarity } from './ItemInterface';
import type { Unit } from '../units/Unit';

// ============================================
// 创建道具
// ============================================

/**
 * 创建武器道具
 */
export function createWeaponExample(): Item {
  return new Item({
    name: "铁剑",
    description: "一把普通的铁制长剑",
    type: ItemType.WEAPON,
    rarity: ItemRarity.COMMON,
    maxStack: 1,
    weight: 3.5,
    value: 50,
    canEquip: true,
    properties: {
      damage: "1d8",
      attackBonus: 1
    }
  });
}

/**
 * 创建消耗品道具
 */
export function createConsumableExample(): Item {
  return new Item({
    name: "生命药水",
    description: "恢复50点生命值",
    type: ItemType.CONSUMABLE,
    rarity: ItemRarity.COMMON,
    maxStack: 99,
    stackCount: 5,
    weight: 0.5,
    value: 25,
    canUse: true,
    properties: {
      healAmount: 50
    }
  });
}

// ============================================
// 背包操作
// ============================================

/**
 * 给单位添加道具
 */
export function addItemToUnit(unit: Unit, item: Item): boolean {
  return unit.addItem(item);
}

/**
 * 从单位移除道具
 */
export function removeItemFromUnit(unit: Unit, itemUid: string, amount?: number): Item | null {
  return unit.removeItem(itemUid, amount);
}

/**
 * 查找单位的道具
 */
export function findItemInUnit(unit: Unit, itemName: string): Item[] {
  return unit.findItemsByName(itemName);
}

/**
 * 获取背包统计信息
 */
export function getInventoryStats(unit: Unit) {
  return {
    itemCount: unit.inventory.length,
    totalWeight: unit.getInventoryWeight(),
    totalValue: unit.getInventoryValue()
  };
}

// ============================================
// 常用道具模板
// ============================================

export const ITEM_TEMPLATES = {
  // 武器
  IRON_SWORD: {
    name: "铁剑",
    description: "一把普通的铁制长剑",
    type: ItemType.WEAPON,
    rarity: ItemRarity.COMMON,
    maxStack: 1,
    weight: 3.5,
    value: 50,
    canEquip: true,
    properties: { damage: "1d8", attackBonus: 1 }
  },
  STEEL_SWORD: {
    name: "钢剑",
    description: "一把优质的钢制长剑",
    type: ItemType.WEAPON,
    rarity: ItemRarity.UNCOMMON,
    maxStack: 1,
    weight: 4.0,
    value: 150,
    canEquip: true,
    properties: { damage: "1d10", attackBonus: 2 }
  },

  // 消耗品
  HEALTH_POTION_SMALL: {
    name: "小型生命药水",
    description: "恢复25点生命值",
    type: ItemType.CONSUMABLE,
    rarity: ItemRarity.COMMON,
    maxStack: 99,
    weight: 0.3,
    value: 15,
    canUse: true,
    properties: { healAmount: 25 }
  },
  HEALTH_POTION_MEDIUM: {
    name: "生命药水",
    description: "恢复50点生命值",
    type: ItemType.CONSUMABLE,
    rarity: ItemRarity.COMMON,
    maxStack: 99,
    weight: 0.5,
    value: 25,
    canUse: true,
    properties: { healAmount: 50 }
  },
  HEALTH_POTION_LARGE: {
    name: "大型生命药水",
    description: "恢复100点生命值",
    type: ItemType.CONSUMABLE,
    rarity: ItemRarity.UNCOMMON,
    maxStack: 99,
    weight: 0.8,
    value: 50,
    canUse: true,
    properties: { healAmount: 100 }
  },

  // 材料
  IRON_ORE: {
    name: "铁矿石",
    description: "可用于锻造的铁矿石",
    type: ItemType.MATERIAL,
    rarity: ItemRarity.COMMON,
    maxStack: 99,
    weight: 1.0,
    value: 5,
  },
  MAGIC_CRYSTAL: {
    name: "魔法水晶",
    description: "蕴含魔法能量的水晶",
    type: ItemType.MATERIAL,
    rarity: ItemRarity.RARE,
    maxStack: 99,
    weight: 0.2,
    value: 100,
  },
};

/**
 * 根据模板创建道具
 */
export function createItemFromTemplate(templateKey: keyof typeof ITEM_TEMPLATES): Item {
  const template = ITEM_TEMPLATES[templateKey];
  return new Item(template);
}

// ============================================
// 实用函数
// ============================================

/**
 * 使用治疗药水
 */
export function useHealingPotion(unit: Unit, item: Item): boolean {
  if (!item.canUse || item.type !== ItemType.CONSUMABLE) {
    return false;
  }

  const healAmount = item.properties?.healAmount || 0;
  if (unit.creature && healAmount > 0) {
    const oldHp = unit.creature.hp;
    unit.creature.hp = Math.min(unit.creature.hp + healAmount, unit.creature.maxHp);
    const actualHeal = unit.creature.hp - oldHp;
    
    console.log(`${unit.name} 使用了 ${item.name}，恢复了 ${actualHeal} 点生命值`);
    
    // 减少道具数量
    item.removeStack(1);
    if (item.stackCount === 0) {
      unit.removeItem(item.uid);
    }
    
    return true;
  }

  return false;
}

/**
 * 转移道具到另一个单位
 */
export function transferItem(fromUnit: Unit, toUnit: Unit, itemUid: string, amount?: number): boolean {
  const item = fromUnit.removeItem(itemUid, amount);
  if (!item) {
    return false;
  }
  return toUnit.addItem(item);
}

/**
 * 筛选特定类型的道具
 */
export function filterItemsByType(unit: Unit, type: ItemType): Item[] {
  return unit.inventory.filter(item => item.type === type);
}

/**
 * 筛选可使用的道具
 */
export function getUsableItems(unit: Unit): Item[] {
  return unit.inventory.filter(item => item.canUse);
}

/**
 * 筛选可装备的道具
 */
export function getEquipableItems(unit: Unit): Item[] {
  return unit.inventory.filter(item => item.canEquip);
}

/**
 * 整理背包（合并堆叠）
 */
export function organizeInventory(unit: Unit): void {
  // 按类型和名称排序
  unit.inventory.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type.localeCompare(b.type);
    }
    return a.name.localeCompare(b.name);
  });

  // 合并相同道具
  for (let i = 0; i < unit.inventory.length - 1; i++) {
    for (let j = i + 1; j < unit.inventory.length; j++) {
      const item1 = unit.inventory[i];
      const item2 = unit.inventory[j];
      
      if (item1.canStackWith(item2)) {
        const transferAmount = Math.min(
          item2.stackCount,
          item1.maxStack - item1.stackCount
        );
        if (transferAmount > 0) {
          item1.addStack(transferAmount);
          item2.removeStack(transferAmount);
          
          if (item2.stackCount === 0) {
            unit.inventory.splice(j, 1);
            j--;
          }
        }
      }
    }
  }
}
