<template>
  <div v-if="visible && power" class="power-tooltip" :style="tooltipStyle">
    <div class="tooltip-content">
      <!-- 威能标题 -->
      <div class="power-header">
        <h3 class="power-title">{{ power.displayName || power.name }}</h3>
        <div class="power-type-info">
          <span class="action-type">{{ getActionTypeText(power.actionType) }}</span>
          <span class="power-type">{{ getPowerTypeText(power.useType) }}</span>
        </div>
      </div>

      <!-- 威能基本信息 -->
      <div class="power-basic-info">
        <div class="info-row" v-if="power.level">
          <span class="label">等级：</span>
          <span class="value">{{ power.level }}</span>
        </div>
        <!-- <div class="info-row" v-if="power.powersource">
          <span class="label">能量源：</span>
          <span class="value">{{ power.powersource }}</span>
        </div> -->
        <div class="info-row" v-if="power.keyWords && power.keyWords.length > 0 && power.keyWords[0]">
          <span class="label">关键词：</span>
          <span class="value">{{ power.keyWords.join(', ') }}</span>
        </div>
      </div>

      <!-- 威能使用信息 -->
      <div class="power-usage-info">
        <div class="info-row" v-if="power.rangeText || power.rangeType">
          <span class="label">射程：</span>
          <span class="value">{{ power.rangeText || power.rangeType }}</span>
        </div>
        <div class="info-row" v-if="power.target">
          <span class="label">目标：</span>
          <span class="value">{{ power.target }}</span>
        </div>
        <div class="info-row" v-if="power.area && power.area > 0">
          <span class="label">区域：</span>
          <span class="value">{{ power.area }}</span>
        </div>
        <div class="info-row" v-if="power.requirements">
          <span class="label">需求：</span>
          <span class="value">{{ power.requirements }}</span>
        </div>
      </div>

      <!-- 威能冷却信息 -->
      <div class="power-cooldown-info" v-if="showCooldownInfo">
        <div class="info-row" v-if="power.cooldown && power.cooldown > 0">
          <span class="label">冷却：</span>
          <span class="value">{{ power.cooldown }} 回合</span>
        </div>
        <div class="info-row" v-if="power.maxUses && power.maxUses > 0">
          <span class="label">使用次数：</span>
          <span class="value">{{ power.currentUses || 0 }}/{{ power.maxUses }}</span>
        </div>
        <div class="info-row" v-if="power.currentCooldown && power.currentCooldown > 0">
          <span class="label">剩余冷却：</span>
          <span class="value">{{ power.currentCooldown }} 回合</span>
        </div>
      </div>

      <!-- 命中效果 -->
      <div class="power-hit-info" v-if="power.hitText">
        <div class="effect-label">命中：</div>
        <div class="effect-text">{{ power.hitText }}</div>
      </div>

      <!-- 失手效果 -->
      <div class="power-miss-info" v-if="power.missText">
        <div class="effect-label">失手：</div>
        <div class="effect-text">{{ power.missText }}</div>
      </div>

      <!-- 威能描述 -->
      <div class="power-description" v-if="power.description">
        <div class="description-label">描述：</div>
        <div class="description-text">{{ power.description }}</div>
      </div>

      <!-- 威能状态 -->
      <div class="power-status">
        <div class="status-indicator" :class="{ 
          'available': canUsePower, 
          'unavailable': !canUsePower 
        }">
          <span v-if="canUsePower">✓ 可使用</span>
          <span v-else>✗ 不可用</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

// Props
const props = defineProps({
  power: {
    type: Object,
    default: null
  },
  visible: {
    type: Boolean,
    default: false
  },
  mouseX: {
    type: Number,
    default: 0
  },
  mouseY: {
    type: Number,
    default: 0
  },
  showCooldownInfo: {
    type: Boolean,
    default: true
  }
})

// 计算威能是否可用
const canUsePower = computed(() => {
  if (!props.power) return false
  
  // 如果威能有 canUse 方法，直接调用
  if (typeof props.power.canUse === 'function') {
    return props.power.canUse()
  }
  
  // 否则进行基本检查
  const power = props.power
  
  // 检查冷却时间
  if (power.currentCooldown && power.currentCooldown > 0) {
    return false
  }
  
  // 检查使用次数限制
  if (power.maxUses && power.maxUses > 0 && 
      power.currentUses && power.currentUses >= power.maxUses) {
    return false
  }
  
  // 检查是否已准备
  if (power.prepared === false) {
    return false
  }
  
  return true
})

// 计算威能详情的预估高度
const calculateTooltipHeight = (power) => {
  if (!power) return 100
  
  let height = 0
  
  // 威能标题区域 (标题 + 类型标签)
  height += 50
  
  // 基本信息区域
  let basicInfoRows = 0
  if (power.level) basicInfoRows++
  if (power.keyWords && power.keyWords.length > 0 && power.keyWords[0]) basicInfoRows++
  if (basicInfoRows > 0) {
    height += basicInfoRows * 18 + 15 // 每行18px + 区域边距
  }
  
  // 使用信息区域
  let usageInfoRows = 0
  if (power.rangeText || power.rangeType) usageInfoRows++
  if (power.target) usageInfoRows++
  if (power.area && power.area > 0) usageInfoRows++
  if (power.requirements) usageInfoRows++
  if (usageInfoRows > 0) {
    height += usageInfoRows * 18 + 15
  }
  
  // 冷却信息区域
  if (props.showCooldownInfo) {
    let cooldownRows = 0
    if (power.cooldown && power.cooldown > 0) cooldownRows++
    if (power.maxUses && power.maxUses > 0) cooldownRows++
    if (power.currentCooldown && power.currentCooldown > 0) cooldownRows++
    if (cooldownRows > 0) {
      height += cooldownRows * 18 + 15
    }
  }
  
  // 命中效果
  if (power.hitText) {
    const textLength = power.hitText.length
    const estimatedLines = Math.max(1, Math.ceil(textLength / 40)) // 每行约40个字符
    height += estimatedLines * 16 + 25 // 16px行高 + 标签和边距
  }
  
  // 失手效果
  if (power.missText) {
    const textLength = power.missText.length
    const estimatedLines = Math.max(1, Math.ceil(textLength / 40))
    height += estimatedLines * 16 + 25
  }
  
  // 描述文本
  if (power.description) {
    const textLength = power.description.length
    const estimatedLines = Math.max(1, Math.ceil(textLength / 40))
    height += estimatedLines * 18 + 30 // 稍大的行高和边距
  }
  
  // 状态指示器
  height += 40
  
  // 容器内边距
  height += 30
  
  // 确保最小高度，但不设置最大高度限制
  return Math.max(height, 120)
}

// 计算提示框位置
const tooltipStyle = computed(() => {
  if (!props.visible) return { display: 'none' }
  
  const offset = 15
  const tooltipWidth = 320
  const tooltipHeight = calculateTooltipHeight(props.power)
  const screenWidth = window.innerWidth
  const screenHeight = window.innerHeight
  
  let left = props.mouseX + offset
  let top = props.mouseY + offset
  
  // 水平位置调整
  if (left + tooltipWidth > screenWidth) {
    left = props.mouseX - tooltipWidth - offset
    if (left < 0) {
      left = screenWidth - tooltipWidth - 10
    }
  }
  
  // 垂直位置调整 - 根据实际计算的高度
  const bottomSpace = screenHeight - props.mouseY
  const topSpace = props.mouseY
  
  if (bottomSpace < tooltipHeight + offset && topSpace > tooltipHeight + offset) {
    // 底部空间不足且顶部有足够空间，显示在鼠标上方
    top = props.mouseY - tooltipHeight - offset
  } else if (top + tooltipHeight > screenHeight) {
    // 如果底部超出，尝试贴底显示
    top = screenHeight - tooltipHeight - 10
    
    // 如果贴底后顶部也超出，则居中显示在可见区域
    if (top < 10) {
      top = Math.max(10, (screenHeight - tooltipHeight) / 2)
    }
  }
  
  // 确保最小边距
  left = Math.max(10, Math.min(left, screenWidth - tooltipWidth - 10))
  top = Math.max(10, Math.min(top, screenHeight - tooltipHeight - 10))
  
  return {
    position: 'fixed',
    left: `${left}px`,
    top: `${top}px`,
    zIndex: 9999,
    width: `${tooltipWidth}px`
  }
})

// 获取动作类型文本
const getActionTypeText = (type) => {
  const typeMap = {
    'standard': '标准动作',
    'move': '移动动作',
    'minor': '次要动作',
    'reaction': '反应',
    'free': '自由动作'
  }
  return typeMap[type] || type
}

// 获取威能类型文本
const getPowerTypeText = (type) => {
  const typeMap = {
    'atwill': '随意威能',
    'encounter': '遭遇威能',
    'utility': '辅助威能',
    'daily': '每日威能',
    'item': '道具'
  }
  return typeMap[type] || type
}
</script>

<style scoped>
.power-tooltip {
  background: rgba(20, 20, 20, 0.95);
  border: 2px solid #444;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
  width: 320px;
  pointer-events: none;
  backdrop-filter: blur(5px);
  overflow: hidden;
}

.tooltip-content {
  padding: 12px;
  color: #fff;
  font-size: 12px;
  line-height: 1.4;
  overflow: hidden;
}

/* 威能标题 */
.power-header {
  border-bottom: 1px solid #555;
  padding-bottom: 8px;
  margin-bottom: 8px;
}

.power-title {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: bold;
  color: #f39c12;
}

.power-type-info {
  display: flex;
  gap: 8px;
  font-size: 11px;
}

.action-type {
  background: #4a90e2;
  color: #fff;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
}

.power-type {
  background: #666;
  color: #fff;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
}

/* 基本信息 */
.power-basic-info,
.power-usage-info,
.power-cooldown-info {
  margin-bottom: 8px;
}

.info-row {
  display: flex;
  margin-bottom: 3px;
}

.label {
  font-weight: bold;
  color: #ccc;
  min-width: 50px;
  flex-shrink: 0;
}

.value {
  color: #fff;
  flex: 1;
}

/* 命中/失手效果 */
.power-hit-info,
.power-miss-info {
  margin-bottom: 8px;
  padding: 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
}

.power-hit-info {
  border-left: 3px solid #2ecc71;
}

.power-miss-info {
  border-left: 3px solid #e74c3c;
}

.effect-label {
  font-weight: bold;
  font-size: 11px;
  margin-bottom: 2px;
}

.power-hit-info .effect-label {
  color: #2ecc71;
}

.power-miss-info .effect-label {
  color: #e74c3c;
}

.effect-text {
  color: #fff;
  font-size: 11px;
  line-height: 1.4;
}

/* 威能描述 */
.power-description {
  border-top: 1px solid #555;
  padding-top: 8px;
  margin-top: 8px;
}

.description-label {
  font-weight: bold;
  color: #ccc;
  margin-bottom: 4px;
}

.description-text {
  color: #fff;
  line-height: 1.5;
  font-style: italic;
}

/* 威能状态 */
.power-status {
  border-top: 1px solid #555;
  padding-top: 8px;
  margin-top: 8px;
  text-align: center;
}

.status-indicator {
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
}

.status-indicator.available {
  background: rgba(46, 204, 113, 0.3);
  color: #2ecc71;
  border: 1px solid #2ecc71;
}

.status-indicator.unavailable {
  background: rgba(231, 76, 60, 0.3);
  color: #e74c3c;
  border: 1px solid #e74c3c;
}
</style>
