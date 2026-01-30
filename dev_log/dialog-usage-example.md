# 选择弹窗使用示例

## 功能说明

MessageTipTool 组件现在支持两种类型的选择弹窗：

1. **确认对话框 (Confirm Dialog)** - 是/否选择
2. **选择对话框 (Select Dialog)** - 多选项选择

## 使用方法

### 1. 引入 messageStore

```typescript
import { useMessageStore } from '@/stores/message'

const messageStore = useMessageStore()
```

### 2. 确认对话框示例

```typescript
// 基础确认对话框
messageStore.showConfirmDialog({
  message: '你确定要执行这个操作吗？',
  onConfirm: () => {
    console.log('用户点击了确认')
    // 执行确认后的操作
  },
  onCancel: () => {
    console.log('用户点击了取消')
    // 执行取消后的操作
  }
})

// 自定义按钮文本
messageStore.showConfirmDialog({
  message: '是否消耗 50 金币购买这件物品？',
  confirmText: '购买',
  cancelText: '放弃',
  onConfirm: () => {
    // 扣除金币，添加物品
    console.log('购买成功')
  },
  onCancel: () => {
    console.log('取消购买')
  }
})
```

### 3. 选择对话框示例

```typescript
// 多选项选择
messageStore.showSelectDialog({
  message: '请选择你的行动：',
  options: [
    { label: '攻击', value: 'attack' },
    { label: '防御', value: 'defend' },
    { label: '使用技能', value: 'skill' },
    { label: '使用物品', value: 'item' }
  ],
  onSelect: (value) => {
    console.log('用户选择了:', value)
    switch (value) {
      case 'attack':
        // 执行攻击逻辑
        break
      case 'defend':
        // 执行防御逻辑
        break
      case 'skill':
        // 打开技能选择
        break
      case 'item':
        // 打开物品选择
        break
    }
  },
  onCancel: () => {
    console.log('用户取消了选择')
  }
})

// 使用数字作为值
messageStore.showSelectDialog({
  message: '选择要装备的武器：',
  options: [
    { label: '长剑 (+5 攻击)', value: 1 },
    { label: '战斧 (+7 攻击, -2 速度)', value: 2 },
    { label: '匕首 (+3 攻击, +3 速度)', value: 3 }
  ],
  onSelect: (value) => {
    console.log('选择的武器 ID:', value)
    // equipWeapon(value)
  }
})
```

### 4. 手动关闭对话框

```typescript
// 如果需要在某些情况下手动关闭对话框
messageStore.closeDialog()
```

## 实际应用场景

### 场景1：战斗中的行动选择

```typescript
function showBattleActionDialog(unit: Unit) {
  messageStore.showSelectDialog({
    message: `${unit.name} 的回合，请选择行动：`,
    options: [
      { label: '🗡️ 普通攻击', value: 'melee' },
      { label: '🏹 远程攻击', value: 'ranged' },
      { label: '✨ 施放法术', value: 'spell' },
      { label: '🛡️ 防御姿态', value: 'defend' },
      { label: '💊 使用物品', value: 'useItem' }
    ],
    onSelect: (action) => {
      executeAction(unit, action as string)
    }
  })
}
```

### 场景2：物品使用确认

```typescript
function confirmUseItem(item: Item) {
  messageStore.showConfirmDialog({
    message: `使用 ${item.name}？\n${item.description}`,
    confirmText: '使用',
    cancelText: '取消',
    onConfirm: () => {
      useItem(item)
      messageStore.setMessage(`使用了 ${item.name}`)
    }
  })
}
```

### 场景3：角色升级属性分配

```typescript
function showLevelUpDialog(character: Character) {
  messageStore.showSelectDialog({
    message: '角色升级！选择要提升的属性：',
    options: [
      { label: '力量 +1 (提升近战伤害)', value: 'strength' },
      { label: '敏捷 +1 (提升速度和闪避)', value: 'dexterity' },
      { label: '体质 +1 (提升生命值)', value: 'constitution' },
      { label: '智力 +1 (提升法术伤害)', value: 'intelligence' }
    ],
    onSelect: (attribute) => {
      character.increaseAttribute(attribute as string)
      messageStore.setMessage(`${attribute} +1`)
    }
  })
}
```

### 场景4：对话选择

```typescript
function showDialogOptions(npc: NPC) {
  messageStore.showSelectDialog({
    message: `${npc.name}：「你有什么事吗？」`,
    options: [
      { label: '询问任务', value: 'quest' },
      { label: '交易物品', value: 'trade' },
      { label: '闲聊', value: 'chat' },
      { label: '告辞', value: 'leave' }
    ],
    onSelect: (choice) => {
      handleDialogChoice(npc, choice as string)
    }
  })
}
```

### 场景5：危险操作确认

```typescript
function confirmDeleteSave(saveSlot: number) {
  messageStore.showConfirmDialog({
    message: `确定要删除存档 ${saveSlot}？\n此操作无法撤销！`,
    confirmText: '删除',
    cancelText: '保留',
    onConfirm: () => {
      deleteSaveFile(saveSlot)
      messageStore.setMessage('存档已删除')
    }
  })
}
```

## 样式特点

- **半透明遮罩层**：显示对话框时会有暗色遮罩
- **居中显示**：对话框在游戏窗口中央显示
- **渐入动画**：对话框以缩放+淡入的方式出现
- **精美按钮**：带有渐变背景和悬停效果
- **响应式设计**：自动适配不同屏幕尺寸

## TypeScript 类型定义

```typescript
// 对话框选项
interface DialogOption {
  label: string;           // 显示的文本
  value: string | number;  // 选项的值
}

// 确认对话框配置
interface ConfirmDialog {
  type: 'confirm';
  message: string;                    // 显示的消息
  onConfirm?: () => void;             // 确认回调
  onCancel?: () => void;              // 取消回调
  confirmText?: string;               // 确认按钮文本（默认：确认）
  cancelText?: string;                // 取消按钮文本（默认：取消）
}

// 选择对话框配置
interface SelectDialog {
  type: 'select';
  message: string;                           // 显示的消息
  options: DialogOption[];                   // 选项列表
  onSelect?: (value: string | number) => void;  // 选择回调
  onCancel?: () => void;                     // 取消回调
}
```

## 注意事项

1. 同一时间只能显示一个对话框
2. 如果需要连续显示多个对话框，请在回调函数中调用下一个对话框
3. 对话框会阻止游戏输入，适合需要用户决策的场景
4. 建议不要在对话框回调中执行过长的操作，保持界面响应
5. 遮罩层点击默认不会关闭对话框，可以在 `handleOverlayClick` 函数中修改此行为
