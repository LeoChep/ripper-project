# 友军单位效果动画实现说明

## 概述
添加了友军单位的回合效果动画，使用绿色边框来区分友军和敌军。

## 实现文件

### 1. FriendlyTurnUnitAnimSprite.ts
新创建的友军动画精灵类，特点：
- 🟢 **绿色边框**：使用 `0x33ff33` 和 `0x55ff55` 的绿色系
- 🌊 **柔和呼吸效果**：alpha 在 0.7-1.0 之间变化
- 🎨 **友好装饰线**：内角有柔和的装饰线，区别于敌方的锐利对角线
- ⏱️ **动画速度**：0.06（比敌方的 0.08 更慢，更柔和）

### 2. TurnEffectAnim.ts
添加了两个新方法：
- `showFriendlyEffect(unit: Unit)` - 显示友军回合效果
- `removeFriendlyEffect(unit: Unit)` - 移除友军回合效果

### 3. InitiativeSystem.ts
更新了回合系统逻辑：
- 在 `startCombatTurn()` 中根据 `unit.friendly` 属性决定显示哪种效果
- 在 `endTurn()` 中正确移除对应的效果

## 使用方法

### 设置友军单位
```typescript
// 创建单位时设置 friendly 属性
const friendlyUnit = new Unit({
  id: 1,
  name: "友军战士",
  x: 5,
  y: 5,
  width: 1,
  height: 1,
  party: "npc", // 不是玩家方阵
  unitTypeName: "fighter",
  direction: 0,
  friendly: true  // ✅ 标记为友军
});
```

### 手动显示/移除效果
```typescript
// 显示友军效果
TurnEffectAnim.showFriendlyEffect(friendlyUnit);

// 移除友军效果
TurnEffectAnim.removeFriendlyEffect(friendlyUnit);
```

## 视觉对比

| 类型 | 颜色 | 呼吸范围 | 速度 | 装饰 |
|------|------|---------|------|------|
| 🟢 友军 | 绿色 | 0.7-1.0 | 0.06 | 圆润内角线 |
| 🔴 敌军 | 红色 | 0.6-1.0 | 0.08 | 锐利对角线 |
| 🟡 玩家 | 黄色 | 0.6-1.0 | 0.05 | 简单角线 |

## 自动触发时机
系统会在以下情况自动显示/移除效果：
1. **开始回合** - `startCombatTurn()` 时根据 `friendly` 属性显示对应效果
2. **结束回合** - `endTurn()` 时自动移除对应效果

## 注意事项
- 友军单位必须满足 `unit.party !== "player"` 且 `unit.friendly === true`
- 友军不会攻击玩家单位（在 AI 逻辑中已实现）
- 视觉效果会随单位尺寸自动调整
