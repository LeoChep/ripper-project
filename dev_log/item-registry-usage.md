# 物品注册表 (ItemRegistry) 使用指南

## 概述

`ItemRegistry` 是物品类的中央注册表，管理物品标识（key）到物品类的映射关系。

通过 `basedItem` 字段，可以在创建物品时自动使用对应的基类。

---

## 基本用法

### 1. 使用 `Item.create()` 工厂方法

```typescript
import { Item } from '@/core/item';

// 使用 basedItem 指定基类，会自动使用 HolyWater 类创建
const holyWater = Item.create({
  name: "圣水",
  basedItem: "HolyWater",  // 指定基类
  stackCount: 5,
});

// 未指定 basedItem，使用默认 Item 类
const miscItem = Item.create({
  name: "石头",
  description: "普通的石头",
  type: ItemType.MISC,
  value: 1,
});
```

### 2. 使用 `Item.createFrom()` 直接创建

```typescript
import { Item } from '@/core/item';

// 创建 HolyWater 实例
const holyWater = Item.createFrom("HolyWater", {
  stackCount: 10,
});

// 如果找不到基类会抛出错误
try {
  const unknown = Item.createFrom("UnknownItem");
} catch (e) {
  console.error(e); // 未找到基类物品: UnknownItem
}
```

### 3. 使用 `Item.createFromSafe()` 安全创建

```typescript
import { Item } from '@/core/item';

// 创建 HolyWater 实例，找不到时返回 null
const holyWater = Item.createFromSafe("HolyWater");
if (holyWater) {
  console.log("创建成功:", holyWater.name);
}

const unknown = Item.createFromSafe("UnknownItem");
if (!unknown) {
  console.log("未找到该物品类型");
}
```

---

## 注册新物品类

### 方式一：使用 `ItemRegistry.register()`

```typescript
import { ItemRegistry } from '@/core/item';
import { HealingPotion } from '@/core/item/consumables/HealingPotion/HealingPotion';

// 注册单个物品类
ItemRegistry.getInstance().register("HealingPotion", HealingPotion);
```

### 方式二：批量注册

```typescript
import { ItemRegistry } from '@/core/item';
import { HealingPotion } from './consumables/HealingPotion/HealingPotion';
import { ManaPotion } from './consumables/ManaPotion/ManaPotion';
import { IronSword } from './weapons/IronSword/IronSword';

// 批量注册
ItemRegistry.getInstance().registerAll({
  HealingPotion,
  ManaPotion,
  IronSword,
});
```

### 方式三：在 `ItemRegistry` 构造函数中注册

编辑 `src/core/item/ItemRegistry.ts`，在 `registerDefaultItems()` 方法中添加：

```typescript
private registerDefaultItems(): void {
  this.register("HolyWater", HolyWater);
  this.register("HealingPotion", HealingPotion);  // 新增
  this.register("ManaPotion", ManaPotion);        // 新增
  this.register("IronSword", IronSword);          // 新增
}
```

---

## 创建自定义物品类

```typescript
import { Item } from '@/core/item/Item';
import { ItemType, ItemRarity, type ItemOptions } from '@/core/item/ItemInterface';

export class HealingPotion extends Item {
  constructor(options?: Partial<ItemOptions>) {
    super({
      name: "治疗药水",
      description: "恢复50点生命值",
      type: ItemType.CONSUMABLE,
      rarity: ItemRarity.COMMON,
      maxStack: 99,
      canUse: true,
      value: 25,
      weight: 0.5,
      properties: {
        healAmount: 50,
      },
      ...options,
    });
  }

  // 可以添加自定义方法
  getHealAmount(): number {
    return this.properties?.healAmount || 0;
  }
}
```

---

## ItemRegistry API

| 方法 | 说明 |
|------|------|
| `getInstance()` | 获取单例实例 |
| `register(key, ItemClass)` | 注册物品类 |
| `registerAll(items)` | 批量注册 |
| `getItemClass(key)` | 获取物品类构造函数 |
| `has(key)` | 检查是否已注册 |
| `createItem(key, options?)` | 根据key创建实例 |
| `createFromOptions(options)` | 根据 ItemOptions 创建（支持 basedItem） |
| `getRegisteredKeys()` | 获取所有已注册的 key |
| `clear()` | 清空注册表 |
| `reset()` | 重置为默认物品 |

---

## 完整示例

```typescript
import { Item, ItemRegistry, ItemType, ItemRarity, type ItemOptions } from '@/core/item';

// 1. 定义自定义物品类
class FireScroll extends Item {
  constructor(options?: Partial<ItemOptions>) {
    super({
      name: "火焰卷轴",
      description: "释放火焰魔法，造成3d6火焰伤害",
      type: ItemType.CONSUMABLE,
      rarity: ItemRarity.UNCOMMON,
      maxStack: 5,
      canUse: true,
      value: 100,
      ...options,
    });
  }
}

// 2. 注册到 ItemRegistry
ItemRegistry.getInstance().register("FireScroll", FireScroll);

// 3. 使用 basedItem 创建
const scroll1 = Item.create({
  basedItem: "FireScroll",
  stackCount: 3,
});

// 或者直接用 Item.createFrom
const scroll2 = Item.createFrom("FireScroll", { stackCount: 2 });

console.log(scroll1.name); // "火焰卷轴"
console.log(scroll2.stackCount); // 2
```
