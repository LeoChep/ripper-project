# 替换原生 confirm 为 MessageTipSystem.confirm

## 修改日期
2026年1月30日

## 修改目标
将项目中所有使用原生浏览器 `confirm()` 函数的地方替换为 `MessageTipSystem.getInstance().confirm()`，以提供更好的用户体验和统一的界面风格。

## 修改的文件

### 1. CreatureInventory.vue
**位置:** `src/components/CharacterDetailPannel/pages/CreatureInventory.vue`

**修改内容:**
- 添加了 MessageTipSystem 的导入
- 将 `dropItem` 函数改为异步函数
- 替换了丢弃物品确认的 confirm 调用

```typescript
// 修改前
const dropItem = (item: Item) => {
  const confirmed = confirm(`确定要丢弃 ${item.name} (x${item.stackCount}) 吗？`);
  if (confirmed) {
    props.unit.removeItem(item.uid);
  }
};

// 修改后
const dropItem = async (item: Item) => {
  const confirmed = await MessageTipSystem.getInstance().confirm(`确定要丢弃 ${item.name} (x${item.stackCount}) 吗？`);
  if (confirmed) {
    props.unit.removeItem(item.uid);
  }
};
```

### 2. CombatChallengeUseEvent.ts
**位置:** `src/core/trait/fighter/CombatChallenge/CombatChallengeUseEvent.ts`

**修改内容:**
- 添加了 MessageTipSystem 的导入
- 替换了战斗挑战确认的 confirm 调用
- eventHandler 已经是异步函数，直接使用 await

```typescript
// 修改前
const userChoice = confirm(`单位 ${this.owner.name} 可以使用一个即时中断对它进行一次近战基本攻击，是否执行？`);

// 修改后
const userChoice = await MessageTipSystem.getInstance().confirm(`单位 ${this.owner.name} 可以使用一个即时中断对它进行一次近战基本攻击，是否执行？`);
```

### 3. OpportunitySystem.ts
**位置:** `src/core/system/OpportunitySystem.ts`

**修改内容:**
- 添加了 MessageTipSystem 的导入
- 将 Promise 回调函数改为 async
- 替换了借机攻击确认的 confirm 调用

```typescript
// 修改前
return new Promise<void>((resolve) => {
  const userChoice = confirm(`单位 ${opportunityUnit.name} 可以触发借机攻击，是否执行？`);
  
// 修改后
return new Promise<void>(async (resolve) => {
  const userChoice = await MessageTipSystem.getInstance().confirm(`单位 ${opportunityUnit.name} 可以触发借机攻击，是否执行？`);
```

### 4. ShieldEdgeBlockEvent.ts
**位置:** `src/core/power/fighter/ShieldEdgeBlock/ShieldEdgeBlockEvent.ts`

**修改内容:**
- 添加了 MessageTipSystem 的导入
- 替换了盾缘反击确认的 confirm 调用
- eventHandler 已经是异步函数，直接使用 await

```typescript
// 修改前
const userChoice = confirm(text + `单位 ${this.owner.name} 可以使用盾缘反击对，是否执行？`);

// 修改后
const userChoice = await MessageTipSystem.getInstance().confirm(text + `单位 ${this.owner.name} 可以使用盾缘反击对，是否执行？`);
```

### 5. CharacterCombatMoveController.ts
**位置:** `src/core/controller/CharacterCombatMoveController.ts`

**修改内容:**
- 添加了 MessageTipSystem 的导入
- 替换了结束回合确认的 confirm 调用
- moveSelect 已经是异步函数，直接使用 await

```typescript
// 修改前
const useConfirm = confirm("是否结束回合？");

// 修改后
const useConfirm = await MessageTipSystem.getInstance().confirm("是否结束回合？");
```

### 6. SaveLoadDialog.vue
**位置:** `src/components/SaveLoadDialog/SaveLoadDialog.vue`

**修改内容:**
- 添加了 MessageTipSystem 的导入
- 将 `selectSlot` 函数改为异步函数
- 将 `deleteSlot` 函数改为异步函数
- 替换了三处 confirm 调用：
  1. 保存覆盖确认
  2. 导入覆盖确认
  3. 删除存档确认

```typescript
// 修改前
const selectSlot = (slotId: number) => {
  if (confirm(`栏位 ${slotId} 已有存档，是否覆盖？`)) {
    emit('select', slotId);
  }
};

const deleteSlot = (slotId: number) => {
  if (confirm(`确定要删除栏位 ${slotId} 的存档吗？此操作不可恢复！`)) {
    localStorage.removeItem(`gameState_slot_${slotId}`);
  }
};

// 修改后
const selectSlot = async (slotId: number) => {
  if (await MessageTipSystem.getInstance().confirm(`栏位 ${slotId} 已有存档，是否覆盖？`)) {
    emit('select', slotId);
  }
};

const deleteSlot = async (slotId: number) => {
  if (await MessageTipSystem.getInstance().confirm(`确定要删除栏位 ${slotId} 的存档吗？此操作不可恢复！`)) {
    localStorage.removeItem(`gameState_slot_${slotId}`);
  }
};
```

### 7. GamePannel.vue
**位置:** `src/components/GamePannel/GamePannel.vue`

**修改内容:**
- 添加了 MessageTipSystem 的导入
- 将 `handleSlotSelect` 函数改为异步函数并添加 await
- 替换了读取存档确认的 confirm 调用

```typescript
// 修改前
const confirmLoad = confirm(`是否要读取栏位 ${slotId} 的存档?\n保存时间: ${new Date(gameState.timestamp).toLocaleString()}`);

const handleSlotSelect = (slotId: number) => {
  if (dialogMode.value === 'save') {
    saveGameState(slotId);
  } else {
    loadGameState(slotId);
  }
  closeDialog();
};

// 修改后
const confirmLoad = await MessageTipSystem.getInstance().confirm(`是否要读取栏位 ${slotId} 的存档?\n保存时间: ${new Date(gameState.timestamp).toLocaleString()}`);

const handleSlotSelect = async (slotId: number) => {
  if (dialogMode.value === 'save') {
    saveGameState(slotId);
  } else {
    await loadGameState(slotId);
  }
  closeDialog();
};
```

## 修改统计

- **修改文件总数:** 7 个文件
- **替换 confirm 调用次数:** 9 处
- **新增异步函数:** 4 个函数改为异步

## 技术要点

1. **异步处理:** MessageTipSystem.confirm() 返回 Promise<boolean>，需要使用 async/await
2. **链式调用:** 所有调用 confirm 的函数都需要改为异步函数
3. **Promise 回调:** 在 Promise 构造函数中使用时，需要将回调函数改为 async

## 优势

1. **统一的 UI:** 所有确认对话框现在使用统一的样式和动画
2. **更好的用户体验:** 游戏内对话框代替了浏览器原生对话框
3. **可扩展性:** 未来可以轻松添加更多自定义功能（如声音、特效等）
4. **样式定制:** 对话框样式可以自由定制，与游戏整体风格保持一致

## 测试建议

建议测试以下场景：
1. ✅ 丢弃物品确认
2. ✅ 战斗挑战确认
3. ✅ 借机攻击确认
4. ✅ 盾缘反击确认
5. ✅ 结束回合确认
6. ✅ 保存覆盖确认
7. ✅ 导入覆盖确认
8. ✅ 删除存档确认
9. ✅ 读取存档确认

## 注意事项

- MessageTipSystem 使用的是自定义的确认对话框组件（在 MessageTipTool.vue 中定义）
- 确认对话框会在屏幕中央显示，带有半透明背景遮罩
- 对话框显示期间会阻止其他游戏输入
- 所有 confirm 调用现在都是异步的，需要注意调用链中的异步处理
