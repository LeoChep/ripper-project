# 对话选择功能使用示例

## 功能说明

对话选择功能允许玩家在对话过程中选择不同的选项，支持键盘和鼠标操作。

## 基本用法

### 1. 在剧情系统中使用

```typescript
import { DramaSystem } from '@/core/system/DramaSystem';
import { useTalkStateStore } from '@/stores/talkStateStore';

const dramaSystem = DramaSystem.getInstance();
const talkState = useTalkStateStore();

// 显示对话
await dramaSystem.speak("你想要做什么？");

// 显示选项并等待玩家选择
const choice = await new Promise((resolve) => {
  talkState.showOptions([
    { text: "探索周围", value: "explore" },
    { text: "与NPC对话", value: "talk" },
    { text: "查看背包", value: "inventory" },
    { text: "离开", value: "leave" }
  ], resolve);
});

// 根据选择执行不同的逻辑
switch(choice) {
  case "explore":
    await dramaSystem.speak("你开始探索周围...");
    break;
  case "talk":
    await dramaSystem.speak("你走向了NPC...");
    break;
  case "inventory":
    await dramaSystem.speak("你打开了背包...");
    break;
  case "leave":
    await dramaSystem.speak("你离开了这里...");
    break;
}
```

### 2. 在组件中直接使用

```typescript
import { ref } from 'vue';
import { useTalkStateStore } from '@/stores/talkStateStore';

const talkState = useTalkStateStore();
const talkPannel = ref(null); // TalkPannel组件的ref

// 显示选项
const showChoice = async () => {
  await talkPannel.value.speak("请做出你的选择：");
  
  const result = await new Promise((resolve) => {
    talkPannel.value.showOptions([
      { text: "是", value: true },
      { text: "否", value: false }
    ], resolve);
  });
  
  console.log("玩家选择了：", result);
};
```

### 3. 数值选项

```typescript
// 选择数量
const amount = await new Promise((resolve) => {
  talkState.showOptions([
    { text: "购买 1 个", value: 1 },
    { text: "购买 5 个", value: 5 },
    { text: "购买 10 个", value: 10 },
    { text: "取消", value: 0 }
  ], resolve);
});

if (amount > 0) {
  console.log(`购买了 ${amount} 个物品`);
}
```

### 4. 对象选项

```typescript
// 选择角色
const character = await new Promise((resolve) => {
  talkState.showOptions([
    { 
      text: "战士 - 高生命和防御", 
      value: { class: "warrior", hp: 100, def: 20 } 
    },
    { 
      text: "法师 - 强大的魔法", 
      value: { class: "mage", hp: 60, magic: 30 } 
    },
    { 
      text: "盗贼 - 敏捷和暴击", 
      value: { class: "rogue", hp: 80, agility: 25 } 
    }
  ], resolve);
});

console.log("选择的职业：", character.class);
```

## 操作方式

### 键盘操作
- **↑/↓方向键**：上下移动选择
- **Enter键**：确认当前选中的选项

### 鼠标操作
- **悬停（Hover）**：高亮显示选项
- **点击（Click）**：选择该选项

## 样式定制

选项的样式在 `TalkPannel.vue` 的 `<style>` 部分定义：

```css
.dialog-options {
  /* 调整选项容器的位置 */
  left: 450px;
  top: 550px;
}

.option-item {
  /* 调整选项项的样式 */
  background: linear-gradient(135deg, rgba(30, 30, 30, 0.9), rgba(50, 50, 50, 0.95));
}

.option-item:hover,
.option-item.selected {
  /* 调整选中/悬停时的样式 */
  background: linear-gradient(135deg, rgba(80, 120, 200, 0.9), rgba(100, 140, 220, 0.95));
}
```

## 注意事项

1. **选项清理**：选项会在选择后自动清除
2. **键盘优先**：当显示选项时，Enter键会优先用于选项确认而非对话推进
3. **默认选择**：默认选中第一个选项（索引0）
4. **回调函数**：选择完成后会调用传入的回调函数，并传入选项的value值

## unitChoose 方法

### 语法

```typescript
dramaSystem.unitChoose(
  unitName: string,
  options: { text: string; value: any }[],
  dialogText?: string  // 可选参数，控制是否在选项上方显示对话
): Promise<any>
```

### 参数说明

- `unitName`: 角色名称
- `options`: 选项数组
- `dialogText`: **可选**，如果提供，会在显示选项前先显示角色对话文本

### 使用示例

#### 1. 仅显示选项（不显示对话文本）

```typescript
const dramaSystem = DramaSystem.getInstance();

// 商人直接展示商品选项，不说话
const item = await dramaSystem.unitChoose("商人", [
  { text: "生命药水 (50金币)", value: { name: "生命药水", price: 50 } },
  { text: "魔法药水 (60金币)", value: { name: "魔法药水", price: 60 } },
  { text: "解毒剂 (30金币)", value: { name: "解毒剂", price: 30 } },
  { text: "不买了", value: null }
]);
```

#### 2. 显示对话文本后再显示选项

```typescript
const dramaSystem = DramaSystem.getInstance();

// 商人先说话，然后展示选项
const item = await dramaSystem.unitChoose(
  "商人", 
  [
    { text: "生命药水 (50金币)", value: { name: "生命药水", price: 50 } },
    { text: "魔法药水 (60金币)", value: { name: "魔法药水", price: 60 } },
    { text: "解毒剂 (30金币)", value: { name: "解毒剂", price: 30 } },
    { text: "不买了", value: null }
  ],
  "欢迎光临！你想买些什么？" // 可选的对话文本
);
```

## 完整示例

### 示例1：使用 unitChoose（带对话文本）

```typescript
import { DramaSystem } from '@/core/system/DramaSystem';

async function exampleDialog() {
  const dramaSystem = DramaSystem.getInstance();
  
  // 使用 unitChoose，先显示对话，再显示选项
  const item = await dramaSystem.unitChoose(
    "商人",
    [
      { text: "生命药水 (50金币)", value: { name: "生命药水", price: 50 } },
      { text: "魔法药水 (60金币)", value: { name: "魔法药水", price: 60 } },
      { text: "解毒剂 (30金币)", value: { name: "解毒剂", price: 30 } },
      { text: "不买了", value: null }
    ],
    "欢迎光临！你想买些什么？"
  );
  
  if (item) {
    // 确认购买，不显示对话文本，直接显示选项
    const confirm = await dramaSystem.unitChoose(
      "商人",
      [
        { text: "确认购买", value: true },
        { text: "我再想想", value: false }
      ]
    );
    
    if (confirm) {
      await dramaSystem.unitSpeak("商人", `好的，${item.name} ${item.price}金币，谢谢惠顾！`);
      // 执行购买逻辑...
    } else {
      await dramaSystem.unitSpeak("商人", "没关系，慢慢考虑。");
    }
  } else {
    await dramaSystem.unitSpeak("商人", "好的，有需要随时来找我。");
  }
}
```

### 示例2：对比 unitSpeak + choose 和 unitChoose

```typescript
// 方式1：使用 unitSpeak + choose（两步）
await dramaSystem.unitSpeak("向导", "你想去哪里？");
const destination = await dramaSystem.choose([
  { text: "森林", value: "forest" },
  { text: "城镇", value: "town" },
  { text: "山脉", value: "mountain" }
]);

// 方式2：使用 unitChoose（一步，带对话）
const destination = await dramaSystem.unitChoose(
  "向导",
  [
    { text: "森林", value: "forest" },
    { text: "城镇", value: "town" },
    { text: "山脉", value: "mountain" }
  ],
  "你想去哪里？"
);

// 方式3：使用 unitChoose（一步，不带对话）
const destination = await dramaSystem.unitChoose(
  "向导",
  [
    { text: "森林", value: "forest" },
    { text: "城镇", value: "town" },
    { text: "山脉", value: "mountain" }
  ]
);
```
