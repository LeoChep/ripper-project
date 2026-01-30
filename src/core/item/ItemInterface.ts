/**
 * 道具类型枚举
 */
export enum ItemType {
  WEAPON = "weapon",           // 武器
  ARMOR = "armor",             // 护甲
  CONSUMABLE = "consumable",   // 消耗品
  QUEST = "quest",             // 任务物品
  MATERIAL = "material",       // 材料
  MISC = "misc",               // 杂项
}

/**
 * 道具稀有度枚举
 */
export enum ItemRarity {
  COMMON = "common",           // 普通
  UNCOMMON = "uncommon",       // 罕见
  RARE = "rare",               // 稀有
  EPIC = "epic",               // 史诗
  LEGENDARY = "legendary",     // 传说
}

/**
 * 道具接口
 */
export interface ItemInterface {
  uid: string;                 // 唯一标识
  name: string;                // 名称
  description: string;         // 描述
  type: ItemType;              // 类型
  rarity: ItemRarity;          // 稀有度
  icon?: string;               // 图标路径
  maxStack: number;            // 最大堆叠数量
  stackCount: number;          // 当前堆叠数量
  weight: number;              // 重量
  value: number;               // 价值（金币）
  canUse: boolean;             // 是否可使用
  canEquip: boolean;           // 是否可装备
  properties?: Record<string, any>; // 自定义属性（如：攻击力、防御力等）
}

/**
 * 道具构造选项
 */
export interface ItemOptions {
  uid?: string;
  name: string;
  description: string;
  type: ItemType;
  rarity?: ItemRarity;
  icon?: string;
  maxStack?: number;
  stackCount?: number;
  weight?: number;
  value?: number;
  canUse?: boolean;
  canEquip?: boolean;
  properties?: Record<string, any>;
}
