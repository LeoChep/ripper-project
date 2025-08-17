# PowerTooltip 威能详情悬浮窗组件

一个用于显示威能详细信息的悬浮窗组件，当鼠标悬停在威能按钮上时显示。

## 功能特性

- 显示威能的基本信息（名称、类型、动作类型等）
- 显示威能的使用信息（范围、目标、区域等）
- 显示威能的冷却和使用次数信息
- 显示威能的描述
- 显示威能的可用状态
- 自动边界检测，避免悬浮窗超出屏幕

## 使用方式

### 基本使用

```vue
<template>
  <div>
    <button 
      @mouseenter="showTooltip(power, $event)"
      @mouseleave="hideTooltip"
      @mousemove="updateTooltipPosition($event)">
      威能名称
    </button>
    
    <PowerTooltip 
      :power="tooltipPower" 
      :visible="tooltipVisible" 
      :mouseX="mouseX" 
      :mouseY="mouseY" 
    />
  </div>
</template>

<script setup>
import PowerTooltip from '@/components/PowerTooltip/PowerTooltip.vue'
import { ref } from 'vue'

const tooltipVisible = ref(false)
const tooltipPower = ref(null)
const mouseX = ref(0)
const mouseY = ref(0)

const showTooltip = (power, event) => {
  tooltipPower.value = power
  tooltipVisible.value = true
  updateTooltipPosition(event)
}

const hideTooltip = () => {
  tooltipVisible.value = false
  tooltipPower.value = null
}

const updateTooltipPosition = (event) => {
  mouseX.value = event.clientX
  mouseY.value = event.clientY
}
</script>
```

## Props

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| power | Object | null | 威能对象，包含威能的所有信息 |
| visible | Boolean | false | 是否显示悬浮窗 |
| mouseX | Number | 0 | 鼠标X坐标 |
| mouseY | Number | 0 | 鼠标Y坐标 |
| showCooldownInfo | Boolean | true | 是否显示冷却信息 |

## 威能对象结构

威能对象应该包含以下属性：

```javascript
{
  name: "威能内部名称",
  displayName: "威能显示名称",
  description: "威能描述",
  actionType: "动作类型（standard/move/minor/reaction/free）",
  useType: "威能类型（atwill/encounter/daily/utility/item）",
  level: "威能等级",
  powersource: "能量源",
  keyWords: ["关键词数组"],
  rangeText: "范围描述",
  rangeType: "范围类型",
  target: "目标描述",
  area: "区域大小",
  requirements: "使用需求",
  cooldown: "基础冷却时间",
  currentCooldown: "当前剩余冷却时间",
  maxUses: "最大使用次数",
  currentUses: "当前已使用次数",
  prepared: "是否已准备",
  canUse: "检查是否可用的方法（可选）"
}
```

## 样式自定义

组件使用了scoped样式，如果需要自定义样式，可以：

1. 使用深度选择器修改样式
2. 通过CSS变量传递自定义颜色
3. 复制组件代码进行修改

## 在ActionPannel中的使用

该组件已经集成到 `ActionPannel.vue` 中，在威能按钮上悬停时会自动显示威能详情。

## 注意事项

1. 悬浮窗会自动进行边界检测，避免超出屏幕
2. 悬浮窗设置了 `pointer-events: none`，不会阻挡鼠标事件
3. 支持威能的 `canUse()` 方法来检查可用状态
4. 如果威能对象没有某些属性，对应的信息行不会显示
