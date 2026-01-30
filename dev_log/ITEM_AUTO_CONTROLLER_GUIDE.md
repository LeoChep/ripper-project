# 道具自动调用控制器使用指南

## 📖 概述

现在道具系统已经集成了自动控制器调用机制。当你使用道具时，系统会自动查找并调用对应的控制器，无需手动管理。

## 🎯 核心组件

### 1. ItemSystem
负责管理所有道具控制器的系统，类似于 PowerSystem。

### 2. Item.use() 方法
道具类的便捷使用方法，会自动调用 ItemSystem。

## 💡 使用方式

### 方式一：直接调用 item.use()（推荐）

```typescript
// 获取道具和使用者
const holyWater = new HolyWater();
const player = UnitSystem.getInstance().getUnitByName("牧师");

// 直接使用，系统会自动查找并调用 HolyWaterController
await holyWater.use(player);

// 如果需要指定目标
const enemy = UnitSystem.getInstance().getUnitByName("skeleton");
await holyWater.use(player, enemy);
```

### 方式二：通过 ItemSystem 使用

```typescript
import { ItemSystem, HolyWater } from "@/core/item";

const itemSystem = ItemSystem.getInstance();
const holyWater = new HolyWater();
const player = UnitSystem.getInstance().getUnitByName("牧师");

// 通过系统使用道具
await itemSystem.useItem(holyWater, player);
```

## 🔧 工作原理

1. 调用 `item.use(user, target)`
2. Item 内部调用 `ItemSystem.useItem()`
3. ItemSystem 根据道具名称查找对应的控制器
4. 自动实例化控制器（如果还没有缓存）
5. 设置控制器的参数（item, user, target）
6. 调用 `controller.use()` 执行具体逻辑

## 📝 添加新道具

### 步骤 1：创建道具类

```typescript
// src/core/item/consumables/HealingPotion/HealingPotion.ts
import { Item } from "../../Item";
import { ItemType, ItemRarity } from "../../ItemInterface";

export class HealingPotion extends Item {
  constructor(options?: Partial<ItemOptions>) {
    super({
      name: "治疗药水",
      description: "恢复20点生命值",
      type: ItemType.CONSUMABLE,
      rarity: ItemRarity.COMMON,
      canUse: true,
      maxStack: 10,
      ...options
    });
  }
}
```

### 步骤 2：创建控制器

```typescript
// src/core/item/consumables/HealingPotion/HealingPotionController.ts
import { ItemController } from "../../base/ItemController";

export class HealingPotionController extends ItemController {
  canUse(): boolean {
    return this.user !== null && this.item !== null;
  }

  async use(): Promise<void> {
    if (!this.preFix()) return;
    
    // 实现治疗逻辑
    const creature = this.user!.creature;
    if (creature) {
      creature.hp = Math.min(creature.hp + 20, creature.maxHP);
      console.log(`${creature.name} 恢复了 20 点生命值`);
    }
    
    this.consume();
    this.cleanup();
  }
}
```

### 步骤 3：在 ItemSystem 中注册

```typescript
// src/core/system/ItemSystem.ts
private getItemControllerClass(itemName: string): Promise<typeof ItemController | null> {
  switch (itemName) {
    case "圣水":
      return import("../item/consumables/HolyWater/HolyWaterController").then(
        (module) => module.HolyWaterController
      );
    case "治疗药水":  // 添加新道具
      return import("../item/consumables/HealingPotion/HealingPotionController").then(
        (module) => module.HealingPotionController
      );
    default:
      return Promise.resolve(null);
  }
}
```

### 步骤 4：导出新道具

```typescript
// src/core/item/index.ts
export { HealingPotion } from './consumables/HealingPotion/HealingPotion';
export { HealingPotionController } from './consumables/HealingPotion/HealingPotionController';
```

## 🎮 实际应用示例

### 在战斗中使用道具

```typescript
import { ItemSystem } from "@/core/system/ItemSystem";

// 在战斗回合中
async function onPlayerTurn(player: Unit) {
  // 玩家选择使用道具
  const holyWater = player.inventory.find(item => item.name === "圣水");
  
  if (holyWater && holyWater.canUse) {
    // 自动调用控制器，显示范围选择，处理投掷逻辑
    await holyWater.use(player);
  }
}
```

### 在剧情中获得并使用道具

```typescript
// 在 Drama 中
import { HolyWater } from "@/core/item";

async cricleTalk() {
  // ...对话逻辑
  
  // 获得道具
  const holyWater = new HolyWater();
  const player = UnitSystem.getInstance().getUnitByName("牧师");
  player?.addItem(holyWater);
  
  await this.speak("你获得了圣水！");
  
  // 稍后使用
  await holyWater.use(player); // 自动调用控制器
}
```

## ✨ 优势

1. **自动化**：无需手动创建和管理控制器实例
2. **一致性**：所有道具使用相同的调用方式
3. **解耦**：道具数据与控制逻辑分离
4. **缓存**：控制器实例被缓存，提高性能
5. **可扩展**：添加新道具只需三步（创建道具、创建控制器、注册）

## 🔍 调试

如果道具使用失败，检查：
1. 道具的 `canUse` 是否为 `true`
2. 道具名称是否在 ItemSystem 中正确注册
3. 控制器的 `canUse()` 方法返回值
4. 控制台的警告信息

## 🚀 下一步

- 添加更多消耗品（治疗药水、魔法卷轴等）
- 实现装备类道具的控制器
- 添加道具使用动画和特效
- 集成到UI系统中
