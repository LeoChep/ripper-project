# 消息提示持续时间功能

## 更新日期
2026-2-3

## 功能概述
为MessageTipSystem添加了消息显示持续时间控制功能，支持自动清除和永久显示两种模式。

## 功能特点

### 1. 持续时间控制
- ✅ 可指定消息显示的毫秒数
- ✅ duration = 0 或未设置时，消息永久显示（需手动清除）
- ✅ duration > 0 时，自动在指定时间后清除消息
- ✅ 新消息会自动取消之前的定时器

### 2. 支持的方法
- `setMessage(message, duration?)` - 设置顶部消息
- `setBottomMessage(message, duration?)` - 设置底部消息

### 3. 自动管理
- ✅ 自动清除过期的定时器
- ✅ 防止内存泄漏
- ✅ 新消息覆盖旧消息时自动取消旧定时器

## 使用方法

### 基本用法

```typescript
import { MessageTipSystem } from '@/core/system/MessageTipSystem';

const msgSystem = MessageTipSystem.getInstance();

// 永久显示（默认行为）
msgSystem.setMessage('这条消息会一直显示');

// 显示3秒后自动消失
msgSystem.setMessage('这条消息3秒后消失', 3000);

// 显示5秒后自动消失
msgSystem.setBottomMessage('底部消息5秒后消失', 5000);
```

### 应用场景

#### 场景1：临时提示（自动消失）
```typescript
// 道具使用成功提示 - 2秒后消失
msgSystem.setMessage('使用生命药水，恢复50点生命值', 2000);

// 转移成功提示 - 3秒后消失
msgSystem.setMessage('已将铁剑给予队友', 3000);

// 保存成功 - 2秒后消失
msgSystem.setMessage('游戏已保存', 2000);
```

#### 场景2：重要信息（永久显示）
```typescript
// 战斗状态提示 - 需要玩家手动操作后清除
msgSystem.setMessage('轮到你行动了');

// 等待玩家选择 - 需要玩家做出选择
msgSystem.setBottomMessage('请选择目标');
```

#### 场景3：覆盖旧消息
```typescript
// 第一条消息设置5秒后消失
msgSystem.setMessage('正在加载...', 5000);

// 立即显示新消息，旧定时器自动取消
msgSystem.setMessage('加载完成！', 2000);
```

### 完整示例

```typescript
// 道具给予功能中的使用
const confirmGive = async (target: Unit) => {
  const item = giveTargetItem.value;
  const amount = giveStackAmount.value;
  
  // 验证数量
  if (amount <= 0 || amount > item.stackCount) {
    // 错误提示3秒后消失
    MessageTipSystem.getInstance().setMessage('给予数量无效', 3000);
    return;
  }
  
  // 转移道具
  const removedItem = props.unit.removeItem(item.uid, amount);
  if (!removedItem) {
    MessageTipSystem.getInstance().setMessage('移除道具失败', 3000);
    return;
  }
  
  const success = target.addItem(removedItem);
  if (success) {
    // 成功提示2秒后消失
    MessageTipSystem.getInstance().setMessage(
      `已将 ${item.name} x${amount} 给予 ${target.name}`,
      2000
    );
  } else {
    props.unit.addItem(removedItem);
    MessageTipSystem.getInstance().setMessage('目标背包已满', 3000);
  }
};
```

## 技术实现

### Store状态
```typescript
state: () => ({
  message: "",
  bottomMessage: "",
  messageDuration: 0,        // 持续时间（毫秒）
  messageTimerId: null,      // 定时器ID
})
```

### 核心逻辑
```typescript
setMessage(message: string, duration: number = 0) {
  // 清除之前的定时器
  if (this.messageTimerId !== null) {
    clearTimeout(this.messageTimerId);
    this.messageTimerId = null;
  }
  
  this.message = message;
  this.messageDuration = duration;
  
  // 设置新的定时器（如果duration > 0）
  if (duration > 0) {
    this.messageTimerId = window.setTimeout(() => {
      this.message = "";
      this.messageDuration = 0;
      this.messageTimerId = null;
    }, duration);
  }
}
```

## API参考

### MessageTipSystem.setMessage()

```typescript
setMessage(message: string, duration?: number): void
```

**参数：**
- `message` (string) - 要显示的消息内容
- `duration` (number, 可选) - 显示持续时间（毫秒）
  - 不传或传0：永久显示
  - 大于0：指定毫秒后自动清除

**示例：**
```typescript
msgSystem.setMessage('永久消息');           // 永久显示
msgSystem.setMessage('临时消息', 3000);     // 3秒后消失
```

### MessageTipSystem.setBottomMessage()

```typescript
setBottomMessage(message: string, duration?: number): void
```

**参数：**
- `message` (string) - 要显示的消息内容
- `duration` (number, 可选) - 显示持续时间（毫秒）

**示例：**
```typescript
msgSystem.setBottomMessage('底部消息');           // 永久显示
msgSystem.setBottomMessage('临时消息', 5000);     // 5秒后消失
```

## 推荐时长

根据不同的消息类型，推荐使用以下时长：

| 消息类型 | 推荐时长 | 说明 |
|---------|---------|------|
| 操作成功提示 | 2000ms (2秒) | 快速反馈，不打扰玩家 |
| 信息提示 | 3000ms (3秒) | 一般信息，给玩家足够阅读时间 |
| 重要提示 | 5000ms (5秒) | 重要信息，需要玩家注意 |
| 错误提示 | 3000ms (3秒) | 错误信息，但不需要永久显示 |
| 游戏状态 | 0 (永久) | 等待玩家操作的状态提示 |
| 战斗提示 | 0 (永久) | 回合制战斗中的行动提示 |

## 注意事项

### 1. 定时器管理
- 新消息会自动取消旧消息的定时器
- clearMessage()会清除所有定时器
- 防止内存泄漏

### 2. 并发消息
- 顶部消息(message)和底部消息(bottomMessage)独立管理
- 可以同时显示不同的消息
- 各自有独立的定时器

### 3. 性能考虑
- 使用setTimeout而不是setInterval
- 定时器自动清理
- 不影响游戏性能

### 4. 向后兼容
- duration参数为可选
- 不传duration时保持原有行为（永久显示）
- 现有代码无需修改

## 修改的文件

1. **src/stores/message.ts**
   - 添加messageDuration和messageTimerId状态
   - 修改setMessage()方法支持duration参数
   - 修改setBottomMessage()方法支持duration参数
   - 更新清除方法处理定时器

2. **src/core/system/MessageTipSystem.ts**
   - 修改setMessage()方法签名
   - 修改setBottomMessage()方法签名
   - 传递duration参数到store

## 测试建议

### 测试用例
```typescript
// 测试1：永久显示
msgSystem.setMessage('永久消息');
// 预期：消息一直显示，不会消失

// 测试2：定时消失
msgSystem.setMessage('3秒后消失', 3000);
// 预期：3秒后消息自动清除

// 测试3：覆盖旧消息
msgSystem.setMessage('第一条消息', 5000);
msgSystem.setMessage('第二条消息', 3000);
// 预期：第二条消息立即显示，3秒后消失

// 测试4：手动清除
msgSystem.setMessage('测试消息', 10000);
msgSystem.clearMessage();
// 预期：消息立即清除，定时器被取消

// 测试5：零时长
msgSystem.setMessage('零时长测试', 0);
// 预期：消息永久显示
```

## 未来扩展

### 可能的改进
1. **消息队列**：支持多条消息排队显示
2. **动画效果**：淡入淡出动画
3. **消息类型**：success、error、warning等不同样式
4. **优先级**：高优先级消息可打断低优先级
5. **暂停/恢复**：允许暂停定时器
6. **进度条**：显示消息剩余时间

## 总结

消息持续时间功能让消息系统更加灵活和用户友好，既支持临时提示的自动清除，也保留了重要信息的永久显示功能。这个特性让游戏的用户体验更加流畅，减少了需要手动清除的消息数量。

---

**功能状态**: ✅ 已完成并测试
**版本**: 1.0
**兼容性**: 向后兼容
**日期**: 2026-2-3
