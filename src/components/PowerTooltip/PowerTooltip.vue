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

// 计算提示框位置
const tooltipStyle = computed(() => {
  if (!props.visible) return { display: 'none' }
  
  const offset = 10
  let left = props.mouseX + offset
  let top = props.mouseY + offset
  
  // 简单的边界检测，避免提示框超出屏幕
  if (left + 300 > window.innerWidth) {
    left = props.mouseX - 300 - offset
  }
  
  if (top + 200 > window.innerHeight) {
    top = props.mouseY - 200 - offset
  }
  
  return {
    position: 'fixed',
    left: `${left}px`,
    top: `${top}px`,
    zIndex: 9999
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
  max-width: 300px;
  min-width: 250px;
  pointer-events: none;
  backdrop-filter: blur(5px);
}

.tooltip-content {
  padding: 12px;
  color: #fff;
  font-size: 12px;
  line-height: 1.4;
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

/* 滚动条样式 */
.tooltip-content::-webkit-scrollbar {
  width: 4px;
}

.tooltip-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.tooltip-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.tooltip-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>
