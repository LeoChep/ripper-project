/**
 * 背包页面测试工具
 * 用于快速向单位添加测试道具
 */

import { Item } from '@/core/item/Item';
import { ItemType, ItemRarity } from '@/core/item/ItemInterface';
import type { Unit } from '@/core/units/Unit';
import { golbalSetting } from '@/core/golbalSetting';

/**
 * 为指定单位添加测试道具
 */
export function addTestItemsToUnit(unit: Unit) {
  // 武器
  const ironSword = new Item({
    name: "铁剑",
    description: "一把普通的铁制长剑，适合初级冒险者使用",
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

  const magicStaff = new Item({
    name: "魔法法杖",
    description: "蕴含神秘力量的法杖，能增强施法者的能力",
    type: ItemType.WEAPON,
    rarity: ItemRarity.RARE,
    maxStack: 1,
    weight: 2.0,
    value: 350,
    canEquip: true,
    properties: {
      damage: "1d6",
      magicBonus: 2,
      spellPower: 10
    }
  });

  // 护甲
  const leatherArmor = new Item({
    name: "皮甲",
    description: "轻便的皮革护甲，提供基础防护",
    type: ItemType.ARMOR,
    rarity: ItemRarity.COMMON,
    maxStack: 1,
    weight: 10,
    value: 100,
    canEquip: true,
    properties: {
      armorClass: 2,
      defense: 5
    }
  });

  const dragonScaleMail = new Item({
    name: "龙鳞甲",
    description: "由真龙鳞片打造的传说护甲，防御力惊人",
    type: ItemType.ARMOR,
    rarity: ItemRarity.LEGENDARY,
    maxStack: 1,
    weight: 20,
    value: 5000,
    canEquip: true,
    properties: {
      armorClass: 5,
      defense: 20,
      fireResistance: 50
    }
  });

  // 消耗品
  const healthPotion = new Item({
    name: "生命药水",
    description: "恢复50点生命值的治疗药水",
    type: ItemType.CONSUMABLE,
    rarity: ItemRarity.COMMON,
    maxStack: 99,
    stackCount: 15,
    weight: 0.5,
    value: 25,
    canUse: true,
    properties: {
      healAmount: 50
    }
  });

  const manaPotion = new Item({
    name: "魔力药水",
    description: "恢复30点魔法值",
    type: ItemType.CONSUMABLE,
    rarity: ItemRarity.UNCOMMON,
    maxStack: 99,
    stackCount: 8,
    weight: 0.5,
    value: 40,
    canUse: true,
    properties: {
      manaAmount: 30
    }
  });

  const elixir = new Item({
    name: "终极灵药",
    description: "完全恢复生命值和魔法值的珍贵药剂",
    type: ItemType.CONSUMABLE,
    rarity: ItemRarity.EPIC,
    maxStack: 20,
    stackCount: 3,
    weight: 0.3,
    value: 500,
    canUse: true,
    properties: {
      healAmount: 999,
      manaAmount: 999
    }
  });

  // 任务物品
  const ancientKey = new Item({
    name: "古老的钥匙",
    description: "一把布满铭文的古老钥匙，似乎能打开某个神秘的地方",
    type: ItemType.QUEST,
    rarity: ItemRarity.RARE,
    maxStack: 1,
    weight: 0.1,
    value: 0,
    properties: {
      questId: "main_quest_001",
      questName: "寻找失落的神殿"
    }
  });

  const dragonEgg = new Item({
    name: "龙蛋",
    description: "一颗巨大的龙蛋，表面散发着微弱的光芒",
    type: ItemType.QUEST,
    rarity: ItemRarity.LEGENDARY,
    maxStack: 1,
    weight: 50,
    value: 0,
    properties: {
      questId: "dragon_quest",
      questName: "龙之传承"
    }
  });

  // 材料
  const ironOre = new Item({
    name: "铁矿石",
    description: "可用于锻造的铁矿石",
    type: ItemType.MATERIAL,
    rarity: ItemRarity.COMMON,
    maxStack: 99,
    stackCount: 45,
    weight: 1.0,
    value: 5,
  });

  const dragonScale = new Item({
    name: "龙鳞",
    description: "珍贵的龙族鳞片，可用于制作顶级装备",
    type: ItemType.MATERIAL,
    rarity: ItemRarity.EPIC,
    maxStack: 50,
    stackCount: 7,
    weight: 0.5,
    value: 200,
  });

  // 杂项
  const goldCoin = new Item({
    name: "金币袋",
    description: "装满金币的皮袋",
    type: ItemType.MISC,
    rarity: ItemRarity.COMMON,
    maxStack: 999,
    stackCount: 150,
    weight: 0.01,
    value: 1,
  });

  const magicScroll = new Item({
    name: "魔法卷轴",
    description: "记载着强大魔法的卷轴",
    type: ItemType.MISC,
    rarity: ItemRarity.UNCOMMON,
    maxStack: 20,
    stackCount: 5,
    weight: 0.2,
    value: 80,
    canUse: true,
  });

  // 添加所有道具到单位背包
  unit.addItem(ironSword);
  unit.addItem(magicStaff);
  unit.addItem(leatherArmor);
  unit.addItem(dragonScaleMail);
  unit.addItem(healthPotion);
  unit.addItem(manaPotion);
  unit.addItem(elixir);
  unit.addItem(ancientKey);
  unit.addItem(dragonEgg);
  unit.addItem(ironOre);
  unit.addItem(dragonScale);
  unit.addItem(goldCoin);
  unit.addItem(magicScroll);

  console.log(`已为单位 ${unit.name} 添加 ${unit.inventory.length} 种道具`);
  console.log(`总道具数量: ${unit.inventory.reduce((sum, item) => sum + item.stackCount, 0)}`);
  console.log(`背包总重量: ${unit.getInventoryWeight().toFixed(1)}`);
  console.log(`背包总价值: ${unit.getInventoryValue()}`);
}

/**
 * 为所有玩家单位添加测试道具
 */
export function addTestItemsToAllPlayers() {
  const map = golbalSetting.map;
  if (!map || !map.sprites) {
    console.error('地图或单位数据不存在');
    return;
  }

  const playerUnits = map.sprites.filter((unit: Unit) => unit.party === 'player');
  
  if (playerUnits.length === 0) {
    console.warn('没有找到玩家单位');
    return;
  }

  playerUnits.forEach((unit: Unit) => {
    addTestItemsToUnit(unit);
  });

  console.log(`已为 ${playerUnits.length} 个玩家单位添加测试道具`);
}

/**
 * 清空指定单位的背包
 */
export function clearInventory(unit: Unit) {
  const itemCount = unit.inventory.length;
  unit.clearInventory();
  console.log(`已清空单位 ${unit.name} 的背包，移除了 ${itemCount} 种道具`);
}

/**
 * 在控制台使用示例
 * 
 * 使用方法：
 * 1. 在浏览器控制台导入此工具：
 *    import { addTestItemsToAllPlayers } from '@/components/CharacterDetailPannel/pages/InventoryTestUtil'
 * 
 * 2. 为所有玩家添加测试道具：
 *    addTestItemsToAllPlayers()
 * 
 * 3. 为特定单位添加：
 *    import { golbalSetting } from '@/core/golbalSetting'
 *    const unit = golbalSetting.map.sprites[0]
 *    addTestItemsToUnit(unit)
 */
