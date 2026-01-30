# 道具系统 (Item System)

道具系统为游戏提供了完整的物品管理功能，包括道具定义、背包管理、序列化保存等核心功能。

## 📁 文件结构

```
src/core/item/
├── ItemInterface.ts        # 道具接口和枚举定义
├── Item.ts                 # 道具类实现
├── ItemSerializer.ts       # 道具序列化器
├── ItemUsageExample.md     # 详细使用示例
└── README.md              # 本文档
```

## 🎯 核心功能

### 1. 道具类型

支持多种道具类型：
- **WEAPON** - 武器
- **ARMOR** - 护甲
- **CONSUMABLE** - 消耗品
- **QUEST** - 任务物品
- **MATERIAL** - 材料
- **MISC** - 杂项

### 2. 道具稀有度

- **COMMON** - 普通（白色）
- **UNCOMMON** - 罕见（绿色）
- **RARE** - 稀有（蓝色）
- **EPIC** - 史诗（紫色）
- **LEGENDARY** - 传说（橙色）

### 3. 道具属性

每个道具包含以下基础属性：
- `uid` - 唯一标识
- `name` - 名称
- `description` - 描述
- `type` - 类型
- `rarity` - 稀有度
- `icon` - 图标路径
- `maxStack` - 最大堆叠数
- `stackCount` - 当前堆叠数
- `weight` - 重量
- `value` - 价值
- `canUse` - 是否可使用
- `canEquip` - 是否可装备
- `properties` - 自定义属性（如攻击力、防御力等）

### 4. 背包系统

Unit 类已集成背包功能：
- `addItem(item)` - 添加道具（自动堆叠）
- `removeItem(uid, amount)` - 移除道具
- `getItem(uid)` - 获取道具
- `findItemsByName(name)` - 按名称查找
- `getInventoryWeight()` - 获取背包总重量
- `getInventoryValue()` - 获取背包总价值
- `clearInventory()` - 清空背包

### 5. 序列化系统

完全集成到游戏存档系统：
- 自动保存所有单位的背包道具
- 自动恢复道具数据
- 支持批量序列化/反序列化
- 数据验证和完整性检查

## 🚀 快速开始

### 创建道具

```typescript
import { Item } from '@/core/item/Item';
import { ItemType, ItemRarity } from '@/core/item/ItemInterface';

const sword = new Item({
  name: "铁剑",
  description: "一把普通的铁制长剑",
  type: ItemType.WEAPON,
  rarity: ItemRarity.COMMON,
  weight: 3.5,
  value: 50,
  canEquip: true,
  properties: {
    damage: "1d8",
    attackBonus: 1
  }
});
```

### 使用背包

```typescript
// 获取单位
const unit = golbalSetting.map.sprites[0];

// 添加道具
unit.addItem(sword);

// 查找道具
const foundItem = unit.getItem(sword.uid);

// 移除道具
const removed = unit.removeItem(sword.uid);

// 获取统计
const totalWeight = unit.getInventoryWeight();
const totalValue = unit.getInventoryValue();
```

## 📚 详细文档

查看 [ItemUsageExample.md](./ItemUsageExample.md) 获取更多使用示例，包括：
- 道具堆叠机制
- 自定义道具类
- 道具工厂模式
- 背包管理系统
- 高级用法示例

## 🔧 集成说明

道具系统已集成到以下模块：

### Unit 类
- 添加了 `inventory: Item[]` 属性
- 提供完整的背包操作方法

### Saver 类
- 在 `saveGameState()` 中序列化道具
- 在 `loadUnit()` 中恢复道具

无需额外配置，直接使用即可。

## 💡 扩展建议

可以根据游戏需求扩展：
1. 创建特定类型的道具子类（如 EquipmentItem、ConsumableItem）
2. 实现道具使用效果系统
3. 添加装备槽位系统
4. 实现道具掉落和拾取机制
5. 添加商店和交易系统

## 📝 注意事项

1. **自动堆叠**: 添加道具时会自动尝试与现有道具堆叠
2. **UID 唯一性**: 每个道具实例都有唯一的 UID
3. **重量系统**: 可用于实现负重限制
4. **自定义属性**: 使用 `properties` 存储特殊属性
5. **序列化兼容**: 确保自定义属性可以被 JSON 序列化

## 🐛 调试

启用道具相关的控制台日志：
```typescript
console.log("背包道具:", unit.inventory);
console.log("恢复单位背包:", sprite.inventory);
```

存档系统会在加载时输出道具恢复信息。
