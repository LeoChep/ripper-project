<template>
  <div class="action-bar-container" v-if="character && character.initiative">
    <div class="fantasy-bar">
      <!-- 装饰性边框 -->
      <div class="bar-ornament left"></div>
      <div class="bar-ornament right"></div>
      
      <!-- 动作指示器 - 横向排列 -->
      <div class="action-indicators">
        <!-- 标准动作 -->
        <div class="action-indicator standard">
          <div class="action-icon">⚔️</div>
          <div class="action-label">标准</div>
          <div class="action-orbs">
            <div v-for="n in maxStandardActions" :key="'std-' + n" 
                 :class="['action-orb', { 
                   'available': n <= remainingStandardActions,
                   'used': n > remainingStandardActions 
                 }]">
              <div class="orb-inner"></div>
              <div class="orb-glow"></div>
            </div>
          </div>
        </div>
        
        <!-- 分割线 -->
        <div class="action-separator"></div>
        
        <!-- 移动动作 -->
        <div class="action-indicator move">
          <div class="action-icon">🏃</div>
          <div class="action-label">移动</div>
          <div class="action-orbs">
            <div v-for="n in maxMoveActions" :key="'move-' + n" 
                 :class="['action-orb', { 
                   'available': n <= remainingMoveActions,
                   'used': n > remainingMoveActions 
                 }]">
              <div class="orb-inner"></div>
              <div class="orb-glow"></div>
            </div>
          </div>
        </div>
        
        <!-- 分割线 -->
        <div class="action-separator"></div>
        
        <!-- 次要动作 -->
        <div class="action-indicator minor">
          <div class="action-icon">🛡️</div>
          <div class="action-label">次要</div>
          <div class="action-orbs">
            <div v-for="n in maxMinorActions" :key="'minor-' + n" 
                 :class="['action-orb', { 
                   'available': n <= remainingMinorActions,
                   'used': n > remainingMinorActions 
                 }]">
              <div class="orb-inner"></div>
              <div class="orb-glow"></div>
            </div>
          </div>
        </div>
        
        <!-- 分割线 -->
        <div class="action-separator"></div>
        
        <!-- 反应动作 -->
        <div class="action-indicator reaction">
          <div class="action-icon">⚡</div>
          <div class="action-label">反应</div>
          <div class="action-orbs">
            <div v-for="n in maxReactionActions" :key="'reaction-' + n" 
                 :class="['action-orb', { 
                   'available': n <= remainingReactionActions,
                   'used': n > remainingReactionActions 
                 }]">
              <div class="orb-inner"></div>
              <div class="orb-glow"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  character: {
    type: Object,
    default: null
  }
})

// 动作相关计算属性
const maxStandardActions = computed(() => 1)
const maxMoveActions = computed(() => 1)
const maxMinorActions = computed(() => 1)
const maxReactionActions = computed(() => 1)

// 剩余动作数量计算
const remainingStandardActions = computed(() => {
  if (!props.character || !props.character.initiative) return 0
  return Math.max(0, maxStandardActions.value - (props.character.initiative.standerActionNumber || 0))
})

const remainingMoveActions = computed(() => {
  if (!props.character || !props.character.initiative) return 0
  return Math.max(0, maxMoveActions.value - (props.character.initiative.moveActionNumber || 0))
})

const remainingMinorActions = computed(() => {
  if (!props.character || !props.character.initiative) return 0
  return Math.max(0, maxMinorActions.value - (props.character.initiative.minorActionNumber || 0))
})

const remainingReactionActions = computed(() => {
  if (!props.character || !props.character.initiative) return 0
  return Math.max(0, maxReactionActions.value - (props.character.initiative.reactionNumber || 0))
})
</script>

<style scoped>
.action-bar-container {
  position: fixed;
  left: 400px;
  top: 700px; /* 让角色面板底部贴着游戏边界(730px - 50px - 10px = 670px) */
  width: 800px;
  z-index: 10;
}

/* 奇幻风格条状外框 */
.fantasy-bar {
  position: relative;
  height: 50px;
  background: linear-gradient(90deg, 
    rgba(139, 69, 19, 0.95) 0%,
    rgba(101, 67, 33, 0.95) 25%,
    rgba(139, 69, 19, 0.95) 50%,
    rgba(101, 67, 33, 0.95) 75%,
    rgba(139, 69, 19, 0.95) 100%);
  border: 2px solid #d4af37;
  border-radius: 25px;
  padding: 5px 20px;
  box-shadow: 
    0 0 15px rgba(212, 175, 55, 0.4),
    inset 0 0 15px rgba(0, 0, 0, 0.3),
    inset 0 1px 3px rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 装饰性边框元素 */
.bar-ornament {
  position: absolute;
  width: 30px;
  height: 30px;
  background: radial-gradient(circle, #d4af37 40%, transparent 70%);
  border: 2px solid #d4af37;
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(212, 175, 55, 0.6);
  top: 50%;
  transform: translateY(-50%);
}

.bar-ornament.left {
  left: -15px;
}

.bar-ornament.right {
  right: -15px;
}

/* 动作指示器容器 - 横向排列 */
.action-indicators {
  display: flex;
  align-items: center;
  justify-content: space-around;
  width: 100%;
  height: 100%;
  gap: 15px;
}

.action-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: center;
  position: relative;
}

/* 分割线 */
.action-separator {
  width: 2px;
  height: 30px;
  background: linear-gradient(180deg, 
    transparent 0%,
    #d4af37 20%,
    #d4af37 80%,
    transparent 100%);
  border-radius: 1px;
  box-shadow: 0 0 4px rgba(212, 175, 55, 0.5);
}

/* 动作图标 */
.action-icon {
  font-size: 16px;
  filter: drop-shadow(0 0 3px rgba(212, 175, 55, 0.5));
  margin-right: 4px;
}

/* 动作标签 */
.action-label {
  color: #f4e4bc;
  font-size: 11px;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-right: 6px;
  min-width: 28px;
}

/* 动作球体容器 */
.action-orbs {
  display: flex;
  gap: 3px;
}

/* 动作球体 */
.action-orb {
  position: relative;
  width: 12px;
  height: 12px;
  cursor: pointer;
}

.orb-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, 
    rgba(139, 69, 19, 0.8) 0%,
    rgba(101, 67, 33, 0.8) 100%);
  border: 1px solid #8b4513;
  transition: all 0.3s ease;
  box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.2);
}

.orb-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120%;
  height: 120%;
  border-radius: 50%;
  opacity: 0;
  transition: all 0.3s ease;
}

/* 可用状态 */
.action-orb.available .orb-inner {
  background: linear-gradient(135deg, 
    #4a90e2 0%,
    #357abd 50%,
    #2868a8 100%);
  border-color: #4a90e2;
  box-shadow: 
    0 0 6px rgba(74, 144, 226, 0.6),
    inset 0 1px 2px rgba(255, 255, 255, 0.3);
  animation: orb-pulse 2s ease-in-out infinite;
}

.action-orb.available .orb-glow {
  opacity: 0.6;
  background: radial-gradient(circle, rgba(74, 144, 226, 0.4) 0%, transparent 70%);
  animation: glow-pulse 2s ease-in-out infinite;
}

/* 已用状态 */
.action-orb.used .orb-inner {
  background: linear-gradient(135deg, 
    rgba(139, 69, 19, 0.4) 0%,
    rgba(101, 67, 33, 0.4) 100%);
  border-color: rgba(139, 69, 19, 0.6);
  opacity: 0.5;
}

/* 悬停效果 */
.action-orb:hover .orb-inner {
  transform: scale(1.1);
}

.action-orb.available:hover .orb-glow {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.2);
}

/* 动画 */
@keyframes orb-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes glow-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}

/* 不同动作类型的颜色主题 */
.action-indicator.standard .action-orb.available .orb-inner {
  background: linear-gradient(135deg, #ff4757, #ff3838);
  border-color: #ff4757;
  box-shadow: 0 0 6px rgba(255, 71, 87, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.3);
}

.action-indicator.move .action-orb.available .orb-inner {
  background: linear-gradient(135deg, #2ed573, #20bf6b);
  border-color: #2ed573;
  box-shadow: 0 0 6px rgba(46, 213, 115, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.3);
}

.action-indicator.minor .action-orb.available .orb-inner {
  background: linear-gradient(135deg, #ffa502, #ff6348);
  border-color: #ffa502;
  box-shadow: 0 0 6px rgba(255, 165, 2, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.3);
}

.action-indicator.reaction .action-orb.available .orb-inner {
  background: linear-gradient(135deg, #a55eea, #8854d0);
  border-color: #a55eea;
  box-shadow: 0 0 6px rgba(165, 94, 234, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .action-bar-container {
    left: 20px;
    width: calc(100vw - 40px);
  }
  
  .fantasy-bar {
    height: 40px;
    padding: 5px 15px;
  }
  
  .action-indicators {
    gap: 8px;
  }
  
  .action-icon {
    font-size: 14px;
  }
  
  .action-label {
    font-size: 9px;
    min-width: 24px;
  }
  
  .orb-inner {
    width: 10px;
    height: 10px;
  }
  
  .action-separator {
    height: 25px;
  }
}
</style>
