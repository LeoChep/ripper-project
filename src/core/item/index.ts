/**
 * 道具系统入口文件
 * 统一导出所有道具相关的类、接口和工具函数
 */

// 核心类和接口
export { Item } from './Item';
export { ItemType, ItemRarity } from './ItemInterface';
export type { ItemInterface, ItemOptions } from './ItemInterface';

// 控制器基类
export { ItemController } from './base/ItemController';

// 序列化器
export { ItemSerializer } from './ItemSerializer';
export type { SerializedItemData } from './ItemSerializer';

// 消耗品
export { HolyWater } from './consumables/HolyWater/HolyWater';
export { HolyWaterController } from './consumables/HolyWater/HolyWaterController';

// 系统
export { ItemSystem } from '../system/ItemSystem';

// 快速参考和工具函数
export {
  createWeaponExample,
  createConsumableExample,
  addItemToUnit,
  removeItemFromUnit,
  findItemInUnit,
  getInventoryStats,
  createItemFromTemplate,
  useHealingPotion,
  transferItem,
  filterItemsByType,
  getUsableItems,
  getEquipableItems,
  organizeInventory,
  ITEM_TEMPLATES
} from './ItemQuickReference';

// 测试函数（开发环境）
export { testItemSystem } from './ItemTest';
