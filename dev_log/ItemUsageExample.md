# 道具系统使用示例

## 基本使用

### 1. 创建道具

```typescript
import { Item } from '@/core/item/Item';
import { ItemType, ItemRarity } from '@/core/item/ItemInterface';

// 创建一个武器道具
const sword = new Item({
  name: "铁剑",
  description: "一把普通的铁制长剑",
  type: ItemType.WEAPON,
  rarity: ItemRarity.COMMON,
  icon: "assets/items/sword.png",
  maxStack: 1,
  weight: 3.5,
  value: 50,
  canEquip: true,
  properties: {
    damage: "1d8",
    attackBonus: 1
  }
});

// 创建一个消耗品道具
const healthPotion = new Item({
  name: "生命药水",
  description: "恢复50点生命值",
  type: ItemType.CONSUMABLE,
  rarity: ItemRarity.COMMON,
  icon: "assets/items/health_potion.png",
  maxStack: 99,
  stackCount: 5,
  weight: 0.5,
  value: 25,
  canUse: true,
  properties: {
    healAmount: 50
  }
});

// 创建一个任务道具
const questItem = new Item({
  name: "神秘钥匙",
  description: "一把古老的钥匙，似乎能打开某处的门",
  type: ItemType.QUEST,
  rarity: ItemRarity.RARE,
  icon: "assets/items/key.png",
  maxStack: 1,
  weight: 0.1,
  value: 0,
  properties: {
    questId: "main_quest_001"
  }
});
```

### 2. 单位背包操作

```typescript
import { golbalSetting } from '@/core/golbalSetting';
import type { Unit } from '@/core/units/Unit';

// 获取一个单位
const unit: Unit = golbalSetting.map.sprites[0];

// 添加道具到背包
unit.addItem(sword);
unit.addItem(healthPotion);
unit.addItem(questItem);

// 查找道具
const foundPotion = unit.findItemsByName("生命药水");
console.log("找到药水:", foundPotion);

// 根据uid获取道具
const item = unit.getItem(sword.uid);
console.log("获取到的道具:", item?.name);

// 移除道具
const removedItem = unit.removeItem(sword.uid);
console.log("移除的道具:", removedItem?.name);

// 移除部分堆叠道具
const partialRemove = unit.removeItem(healthPotion.uid, 2);
console.log("移除了2个药水，剩余:", unit.getItem(healthPotion.uid)?.stackCount);

// 获取背包统计信息
const totalWeight = unit.getInventoryWeight();
const totalValue = unit.getInventoryValue();
console.log(`背包总重量: ${totalWeight}, 总价值: ${totalValue}`);

// 清空背包
unit.clearInventory();
```

### 3. 道具堆叠

```typescript
// 创建两组相同的道具
const potion1 = new Item({
  name: "生命药水",
  description: "恢复50点生命值",
  type: ItemType.CONSUMABLE,
  maxStack: 99,
  stackCount: 30,
  weight: 0.5,
  value: 25,
  canUse: true,
});

const potion2 = new Item({
  name: "生命药水",
  description: "恢复50点生命值",
  type: ItemType.CONSUMABLE,
  maxStack: 99,
  stackCount: 40,
  weight: 0.5,
  value: 25,
  canUse: true,
});

// 检查是否可以堆叠
if (potion1.canStackWith(potion2)) {
  console.log("这两个道具可以堆叠");
}

// 添加道具时自动堆叠
unit.addItem(potion1);
unit.addItem(potion2); // 会自动堆叠到potion1上
```

### 4. 道具使用

```typescript
// 使用道具（基础版本）
if (healthPotion.canUse) {
  const success = healthPotion.use();
  if (success) {
    // 执行道具效果
    const healAmount = healthPotion.properties?.healAmount || 0;
    if (unit.creature) {
      unit.creature.hp = Math.min(
        unit.creature.hp + healAmount,
        unit.creature.maxHp
      );
    }
    // 使用后减少数量
    healthPotion.removeStack(1);
    if (healthPotion.stackCount === 0) {
      unit.removeItem(healthPotion.uid);
    }
  }
}
```

### 5. 序列化和反序列化

道具的序列化已经集成到存档系统中，会自动保存和恢复：

```typescript
import { ItemSerializer } from '@/core/item/ItemSerializer';

// 手动序列化单个道具
const serializer = ItemSerializer.serialize(sword);
const jsonString = serializer.toJSONString();
console.log("序列化的道具:", jsonString);

// 手动反序列化
const deserializedSerializer = ItemSerializer.fromJSONString(jsonString);
const deserializedItem = deserializedSerializer.deserialize();
console.log("反序列化的道具:", deserializedItem.name);

// 批量序列化
const items = [sword, healthPotion, questItem];
const serializers = ItemSerializer.serializeArray(items);

// 批量反序列化
const deserializedItems = ItemSerializer.deserializeArray(serializers);
console.log("反序列化的道具数组:", deserializedItems);
```

## 扩展示例

### 创建自定义道具类

```typescript
import { Item } from '@/core/item/Item';
import { ItemType, ItemRarity } from '@/core/item/ItemInterface';
import type { Unit } from '@/core/units/Unit';

/**
 * 装备道具类
 */
export class EquipmentItem extends Item {
  equipSlot: string; // 装备槽位：weapon, armor, accessory 等

  constructor(options: any) {
    super(options);
    this.equipSlot = options.equipSlot || "weapon";
  }

  /**
   * 装备到单位
   */
  equipTo(unit: Unit): boolean {
    if (!this.canEquip) {
      console.warn(`${this.name} 不能装备`);
      return false;
    }
    
    // 实现装备逻辑
    console.log(`${unit.name} 装备了 ${this.name}`);
    
    // 应用装备属性
    if (this.properties?.attackBonus && unit.creature) {
      // 添加攻击加成等逻辑
    }
    
    return true;
  }
}

/**
 * 消耗品道具类
 */
export class ConsumableItem extends Item {
  constructor(options: any) {
    super({ ...options, type: ItemType.CONSUMABLE, canUse: true });
  }

  /**
   * 使用消耗品
   */
  override use(): boolean {
    if (!super.use()) {
      return false;
    }
    
    // 实现消耗品效果
    console.log(`使用了 ${this.name}`);
    this.removeStack(1);
    
    return true;
  }

  /**
   * 应用治疗效果
   */
  applyHeal(unit: Unit): void {
    if (unit.creature && this.properties?.healAmount) {
      const healAmount = this.properties.healAmount;
      unit.creature.hp = Math.min(
        unit.creature.hp + healAmount,
        unit.creature.maxHp
      );
      console.log(`${unit.name} 恢复了 ${healAmount} 点生命值`);
    }
  }
}
```

### 道具生成工厂

```typescript
import { Item } from '@/core/item/Item';
import { ItemType, ItemRarity } from '@/core/item/ItemInterface';

export class ItemFactory {
  /**
   * 生成随机道具
   */
  static generateRandomItem(): Item {
    const types = Object.values(ItemType);
    const rarities = Object.values(ItemRarity);
    
    const randomType = types[Math.floor(Math.random() * types.length)];
    const randomRarity = rarities[Math.floor(Math.random() * rarities.length)];
    
    return new Item({
      name: `随机${randomType}`,
      description: "一个随机生成的道具",
      type: randomType,
      rarity: randomRarity,
      maxStack: randomType === ItemType.CONSUMABLE ? 99 : 1,
      weight: Math.random() * 10,
      value: Math.floor(Math.random() * 1000),
      canUse: randomType === ItemType.CONSUMABLE,
      canEquip: randomType === ItemType.WEAPON || randomType === ItemType.ARMOR,
    });
  }

  /**
   * 根据模板创建道具
   */
  static createFromTemplate(template: string): Item | null {
    const templates: Record<string, any> = {
      health_potion: {
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
      iron_sword: {
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
      // 添加更多模板...
    };

    const itemTemplate = templates[template];
    if (!itemTemplate) {
      console.error(`未找到道具模板: ${template}`);
      return null;
    }

    return new Item(itemTemplate);
  }
}

// 使用工厂
const randomItem = ItemFactory.generateRandomItem();
const healthPotion = ItemFactory.createFromTemplate("health_potion");
const ironSword = ItemFactory.createFromTemplate("iron_sword");
```

### 道具管理系统

```typescript
import type { Item } from '@/core/item/Item';
import type { Unit } from '@/core/units/Unit';
import { ItemType } from '@/core/item/ItemInterface';

export class InventoryManager {
  /**
   * 整理背包（合并堆叠、排序等）
   */
  static organizeInventory(unit: Unit): void {
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

  /**
   * 转移道具到另一个单位
   */
  static transferItem(from: Unit, to: Unit, itemUid: string, amount?: number): boolean {
    const item = from.removeItem(itemUid, amount);
    if (!item) {
      return false;
    }
    
    return to.addItem(item);
  }

  /**
   * 根据类型筛选道具
   */
  static filterByType(unit: Unit, type: ItemType): Item[] {
    return unit.inventory.filter(item => item.type === type);
  }

  /**
   * 查找最有价值的道具
   */
  static getMostValuableItem(unit: Unit): Item | null {
    if (unit.inventory.length === 0) {
      return null;
    }
    
    return unit.inventory.reduce((prev, current) => 
      current.getTotalValue() > prev.getTotalValue() ? current : prev
    );
  }
}

// 使用示例
const unit1 = golbalSetting.map.sprites[0];
const unit2 = golbalSetting.map.sprites[1];

// 整理背包
InventoryManager.organizeInventory(unit1);

// 转移道具
const item = unit1.inventory[0];
InventoryManager.transferItem(unit1, unit2, item.uid, 1);

// 筛选武器
const weapons = InventoryManager.filterByType(unit1, ItemType.WEAPON);
console.log("单位的所有武器:", weapons);

// 查找最贵的道具
const mostValuable = InventoryManager.getMostValuableItem(unit1);
console.log("最有价值的道具:", mostValuable?.name);
```

## 存档系统集成

道具系统已经完全集成到存档系统中：

- 保存游戏时，所有单位的背包道具会被自动序列化
- 读取存档时，道具会被自动反序列化并恢复到单位背包中
- 支持道具的所有属性和自定义属性的保存和恢复

无需额外操作，使用现有的保存和读取功能即可。
