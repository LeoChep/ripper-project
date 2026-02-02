# 角色详情页背包功能说明

## 更新内容

已在角色详情页（CreatureInfo.vue）中添加了新的**背包**标签页，用于查看和管理角色的道具。

## 新增文件

1. **CreatureInventory.vue** - 背包页面组件
   - 位置: `src/components/CharacterDetailPannel/pages/CreatureInventory.vue`
   - 功能: 显示和管理角色背包中的道具

2. **InventoryTestUtil.ts** - 背包测试工具
   - 位置: `src/components/CharacterDetailPannel/pages/InventoryTestUtil.ts`
   - 功能: 快速添加测试道具用于开发测试

## 修改文件

- **CreatureInfo.vue** - 角色详情页主组件
  - 新增"背包"标签页
  - 导入并集成 CreatureInventory 组件

## 功能特性

### 1. 道具显示
- ✅ 道具列表展示（图标、名称、描述、堆叠数量）
- ✅ 道具稀有度颜色标识（普通、罕见、稀有、史诗、传说）
- ✅ 道具类型图标（武器、护甲、消耗品、任务物品、材料、杂项）
- ✅ 重量和价值显示
- ✅ 背包统计（总道具数、总重量、总价值）

### 2. 道具操作
- ✅ 使用道具（消耗品）
- ✅ 装备道具（武器、护甲）
- ✅ 给予道具（转移到其他角色）**[新增 2026-2-3]**
- ✅ 丢弃道具
- ✅ 查看道具详情

### 3. 道具详情
- ✅ 完整道具信息展示
- ✅ 自定义属性显示
- ✅ 弹窗模式查看

### 4. UI/UX
- ✅ 奇幻风格设计（与现有界面一致）
- ✅ 悬停效果和过渡动画
- ✅ 稀有度渐变边框
- ✅ 响应式布局
- ✅ 空背包提示

## 使用方法

### 查看背包
1. 打开角色详情页
2. 点击**"背包"**标签页
3. 查看角色的所有道具

### 使用道具
1. 找到可使用的道具（有"使用"按钮）
2. 点击"使用"按钮
3. 道具效果会立即生效（如治疗药水恢复生命值）
4. 使用后堆叠数量-1，用完自动从背包移除

### 装备道具
1. 找到可装备的道具（有"装备"按钮）
2. 点击"装备"按钮
3. 显示装备提示（实际装备逻辑待实现）

### 给予道具 **[新增 2026-2-3]**
1. 点击道具的"给予"按钮
2. 在弹窗中选择目标角色（队伍中的其他玩家角色）
3. 如果是堆叠道具，可以调整给予数量
4. 点击目标角色完成转移
5. 道具会从当前角色转移到目标角色的背包
6. 详细说明见: [2026-2-3-inventory-give-feature.md](./2026-2-3-inventory-give-feature.md)

### 丢弃道具
1. 点击任意道具的"丢弃"按钮
2. 确认丢弃操作
3. 道具从背包中移除

### 查看详情
1. 点击道具卡片
2. 弹出详情窗口
3. 查看完整道具信息和属性

## 开发测试

### 快速添加测试道具

在浏览器控制台执行：

```javascript
// 方法1: 在游戏中直接调用
import { addTestItemsToAllPlayers } from '@/components/CharacterDetailPannel/pages/InventoryTestUtil'
addTestItemsToAllPlayers()

// 方法2: 为特定单位添加
import { addTestItemsToUnit } from '@/components/CharacterDetailPannel/pages/InventoryTestUtil'
import { golbalSetting } from '@/core/golbalSetting'
const unit = golbalSetting.map.sprites[0] // 第一个单位
addTestItemsToUnit(unit)
```

### 测试道具包含
- 武器: 铁剑（普通）、魔法法杖（稀有）
- 护甲: 皮甲（普通）、龙鳞甲（传说）
- 消耗品: 生命药水x15、魔力药水x8、终极灵药x3
- 任务物品: 古老的钥匙、龙蛋
- 材料: 铁矿石x45、龙鳞x7
- 杂项: 金币袋x150、魔法卷轴x5

### 清空背包

```javascript
import { clearInventory } from '@/components/CharacterDetailPannel/pages/InventoryTestUtil'
import { golbalSetting } from '@/core/golbalSetting'
const unit = golbalSetting.map.sprites[0]
clearInventory(unit)
```

## 道具颜色编码

| 稀有度 | 颜色 | 十六进制 |
|--------|------|----------|
| 普通 | 灰色 | #9d9d9d |
| 罕见 | 绿色 | #1eff00 |
| 稀有 | 蓝色 | #0070dd |
| 史诗 | 紫色 | #a335ee |
| 传说 | 橙色 | #ff8000 |

## 道具类型图标

| 类型 | 图标 |
|------|------|
| 武器 | ⚔️ |
| 护甲 | 🛡️ |
| 消耗品 | 🧪 |
| 任务物品 | 📜 |
| 材料 | 🔨 |
| 杂项 | 📦 |

## 未来扩展

以下功能可以进一步实现：

1. **装备系统**
   - 实际装备槽位
   - 装备效果加成
   - 装备更换

2. **道具排序**
   - 按类型排序
   - 按稀有度排序
   - 按价值排序
   - 按重量排序

3. **道具筛选**
   - 类型筛选
   - 稀有度筛选
   - 可使用/可装备筛选

4. **道具拖拽**
   - 拖拽排序
   - 拖拽丢弃
   - 拖拽装备

5. **批量操作**
   - 批量使用
   - 批量丢弃
   - 批量分解

6. **道具比较**
   - 装备对比
   - 属性对比

7. **道具分享**
   - 队友间交易
   - 道具赠送

## 注意事项

1. 背包数据自动保存到游戏存档中
2. 使用道具会立即生效并减少数量
3. 丢弃道具需要确认，避免误操作
4. 装备道具目前只有提示，实际装备系统需要进一步实现
5. 道具图标路径需要确保资源文件存在

## 样式说明

- 使用了与现有界面一致的奇幻风格
- 采用深紫色渐变背景
- 金色装饰和边框
- 平滑的过渡动画
- 响应式设计，适配不同屏幕尺寸

## 技术细节

- 使用 Vue 3 Composition API
- TypeScript 类型安全
- 响应式数据绑定
- 计算属性优化性能
- 事件冒泡控制
- 自定义滚动条样式
