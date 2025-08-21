<template>
  <div class="action-bar-container" v-if="character && character.initiative">
    <div class="fantasy-bar">
      <!-- 装饰性边框 -->
      <div class="bar-ornament left"></div>
      <div class="bar-ornament right"></div>

      <!-- 背景分段区域 -->
      <div class="background-segments">
        <div
          :class="[
            'bg-segment',
            'standard-bg',
            { disabled: remainingStandardActions === 0 },
          ]"
        ></div>
        <div
          :class="['bg-segment', 'move-bg', { disabled: remainingMoveActions <= 0 }]"
        ></div>
        <div
          :class="['bg-segment', 'minor-bg', { disabled: remainingMinorActions === 0 }]"
        ></div>
        <div
          :class="[
            'bg-segment',
            'reaction-bg',
            { disabled: remainingReactionActions === 0 },
          ]"
        ></div>
      </div>

      <!-- 动作指示器 - 横向排列 -->
      <div class="action-indicators">
        <!-- 标准动作 -->
        <div
          :class="[
            'action-indicator',
            'standard',
            { disabled: remainingStandardActions === 0 },
            { 'about-to-use': pendingAction === 'standard' },
          ]"
        >
          <div class="action-icon">⚔️</div>
          <div class="action-label">标准</div>
        </div>

        <!-- 分割线 -->
        <div class="action-separator"></div>

        <!-- 移动动作 -->
        <div
          :class="[
            'action-indicator',
            'move',
            { disabled: remainingMoveActions <= 0 },
            { 'about-to-use': pendingAction === 'move' },
          ]"
        >
          <!-- {{ currentMoveActions }} -->
          <div class="action-icon">🏃</div>
          <div class="action-label">移动</div>
        </div>

        <!-- 分割线 -->
        <div class="action-separator"></div>

        <!-- 次要动作 -->
        <div
          :class="[
            'action-indicator',
            'minor',
            { disabled: remainingMinorActions === 0 },
            { 'about-to-use': pendingAction === 'minor' },
          ]"
        >
          <div class="action-icon">🛡️</div>
          <div class="action-label">次要</div>
        </div>

        <!-- 分割线 -->
        <div class="action-separator"></div>

        <!-- 反应动作 -->
        <div
          :class="[
            'action-indicator',
            'reaction',
            { disabled: remainingReactionActions === 0 },
            { 'about-to-use': pendingAction === 'reaction' },
          ]"
        >
          <div class="action-icon">⚡</div>
          <div class="action-label">反应</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from "vue";

// Props
const props = defineProps({
  character: {
    type: Object,
    default: null,
  },
  pendingAction: {
    type: String,
    default: null,
    validator: (value) => {
      return !value || ["standard", "move", "minor", "reaction"].includes(value);
    },
  },
});

// 响应式数据，用于存储实时查询的动作数量
const currentStandardActions = ref(0);
const currentMoveActions = ref(0);
const currentMinorActions = ref(0);
const currentReactionActions = ref(0);

// 轮询定时器
let pollingTimer = null;

// 轮询函数，实时更新动作数量
const pollActionNumbers = () => {
  if (!props.character || !props.character.initiative) return;

  // 直接使用 initiative 中的已使用动作数量作为剩余动作数量
  currentStandardActions.value = props.character.initiative.standerActionNumber || 0;
  currentMoveActions.value = props.character.initiative.moveActionNumber || 0;
  currentMinorActions.value = props.character.initiative.minorActionNumber || 0;
  currentReactionActions.value = props.character.initiative.reactionNumber || 0;
};

// 组件挂载时启动轮询
onMounted(() => {
  // 立即执行一次
  pollActionNumbers();

  // 每100ms轮询一次
  pollingTimer = setInterval(pollActionNumbers, 100);
});

// 组件卸载时清理定时器
onUnmounted(() => {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
});

// 动作相关计算属性
const maxStandardActions = computed(() => 1);
const maxMoveActions = computed(() => 1);
const maxMinorActions = computed(() => 1);
const maxReactionActions = computed(() => 1);

// 剩余动作数量直接使用轮询获取的数值
const remainingStandardActions = computed(() => currentStandardActions.value);
const remainingMoveActions = computed(() => currentMoveActions.value);
const remainingMinorActions = computed(() => currentMinorActions.value);
const remainingReactionActions = computed(() => currentReactionActions.value);
</script>

<style scoped>
.action-bar-container {
  position: fixed;
  left: 400px;
  top: 700px;
  /* 让角色面板底部贴着游戏边界(730px - 50px - 10px = 670px) */
  width: 800px;
  z-index: 10;
}

/* 奇幻风格条状外框 - 中等温暖色调 */
.fantasy-bar {
  position: relative;
  height: 50px;
  background: linear-gradient(
    90deg,
    rgba(160, 100, 50, 0.95) 0%,
    /* 中等褐色 */ rgba(180, 120, 80, 0.95) 25%,
    /* 温暖中褐色 */ rgba(170, 110, 60, 0.95) 50%,
    /* 平衡褐色 */ rgba(180, 120, 80, 0.95) 75%,
    /* 温暖中褐色 */ rgba(160, 100, 50, 0.95) 100% /* 中等褐色 */
  );
  border: 2px solid #d4af37;
  border-radius: 25px;
  padding: 5px 20px 5px 5px;
  box-shadow: 0 0 15px rgba(212, 175, 55, 0.4), inset 0 0 15px rgba(0, 0, 0, 0.3),
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

/* 背景分段区域 */
.background-segments {
  position: absolute;
  top: 0px;
  left: 0px;
  right: 0px;
  bottom: 0px;
  border-radius: 23px;
  overflow: hidden;
  z-index: 1;
}

.bg-segment {
  position: absolute;
  top: 0;
  bottom: 0;
  background: transparent;
  transition: all 0.3s ease;
}

/* 标准动作背景 */
.bg-segment.standard-bg {
  /* 您可以在这里设置left和width或right */
  width: calc(40%);

  /* margin-left: -10px; */
}

/* 移动动作背景 */
.bg-segment.move-bg {
  /* 您可以在这里设置left和width或right */
  width: calc(30% + 14px);
  left: calc(40%);
}

/* 次要动作背景 */
.bg-segment.minor-bg {
  /* 您可以在这里设置left和width或right */
  width: calc(10% + 27px);
  left: calc(70% + 14px);
}

/* 反应动作背景 */
.bg-segment.reaction-bg {
  /* 您可以在这里设置left和width或right */
  width: calc(10% + 30px);
  left: calc(80% + 42px);
}

.bg-segment.disabled {
  background: linear-gradient(
    180deg,
    rgba(60, 20, 20, 0.95) 0%,
    /* 暗深红 */ rgba(80, 30, 30, 0.95) 20%,
    /* 稍亮深红 */ rgba(40, 15, 15, 0.95) 50%,
    /* 非常暗的深红 */ rgba(80, 30, 30, 0.95) 80%,
    /* 稍亮深红 */ rgba(60, 20, 20, 0.95) 100% /* 暗深红 */
  );
  /* 添加更明显的破损纹理 */
  background-image: repeating-linear-gradient(
      45deg,
      transparent 0px,
      rgba(139, 0, 0, 0.3) 1px,
      /* 更明显的深红色 */ rgba(139, 0, 0, 0.3) 2px,
      transparent 3px
    ),
    repeating-linear-gradient(
      -45deg,
      transparent 0px,
      rgba(160, 20, 20, 0.2) 2px,
      /* 更明显的红色 */ rgba(160, 20, 20, 0.2) 4px,
      transparent 6px
    );
  border: 1px solid #5a0000; /* 更深的红色边框 */
  border-style: dashed;
  animation: fadeInOut 3s infinite;
}

@keyframes fadeInOut {
  0%,
  100% {
    opacity: 0.8;
  }
  50% {
    opacity: 0.95;
  }
}

/* 动作指示器容器 - 横向排列 */
.action-indicators {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  height: 100%;
  gap: 0;
  position: relative;
  z-index: 3;
  padding: 0;
}

.action-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  position: relative;
  transition: all 0.3s ease;
  cursor: pointer;
  min-width: 60px;
  /* 为所有状态预设透明边框，避免禁用时尺寸变化 */
  border: 2px solid transparent;
  /* 为伪元素预留空间 */
  margin: 5px;
}

/* 标准动作占40% */
.action-indicator.standard {
  flex: 4;
  justify-content: center;
  padding-left: 0;
}

/* 移动动作占30% */
.action-indicator.move {
  flex: 3;
}

/* 次要动作占10% */
.action-indicator.minor {
  flex: 1;
}

/* 反应动作占10% */
.action-indicator.reaction {
  flex: 1;
  justify-content: center;
  padding-right: 0;
}

/* 将要被使用的状态 - 高亮提示效果 */
.action-indicator.about-to-use {
  background: linear-gradient(
    145deg,
    #ffd700 0%,
    /* 金黄色 */ #ffa500 20%,
    /* 橙色 */ #ffd700 40%,
    /* 金黄色 */ #ff8c00 60%,
    /* 深橙色 */ #ffd700 80%,
    /* 金黄色 */ #ffa500 100% /* 橙色 */
  );
  /* 使用相同尺寸的边框，只改变颜色和样式 */
  border-color: #ffd700;
  border-style: solid;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.8), inset 0 0 10px rgba(255, 255, 255, 0.3),
    0 0 30px rgba(255, 215, 0, 0.6);
  transform: scale(1.1);
  z-index: 5;
  animation: aboutToUseGlow 1.5s ease-in-out infinite alternate;
}

@keyframes aboutToUseGlow {
  0% {
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.8), inset 0 0 10px rgba(255, 255, 255, 0.3),
      0 0 30px rgba(255, 215, 0, 0.6);
  }
  100% {
    box-shadow: 0 0 30px rgba(255, 215, 0, 1), inset 0 0 15px rgba(255, 255, 255, 0.5),
      0 0 40px rgba(255, 215, 0, 0.8);
  }
}

/* 将要被使用状态的图标效果 */
.action-indicator.about-to-use .action-icon {
  filter: drop-shadow(0 0 8px rgba(255, 215, 0, 1))
    drop-shadow(0 0 15px rgba(255, 140, 0, 0.8));
  transform: scale(1.2);
  animation: iconPulse 1s ease-in-out infinite alternate;
}

@keyframes iconPulse {
  0% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1.3);
  }
}

/* 将要被使用状态的标签效果 */
.action-indicator.about-to-use .action-label {
  color: #8b4513;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.8), 0 0 12px rgba(255, 140, 0, 0.6);
  font-weight: 900;
  animation: textGlow 1.2s ease-in-out infinite alternate;
}

@keyframes textGlow {
  0% {
    text-shadow: 0 0 8px rgba(255, 215, 0, 0.8), 0 0 12px rgba(255, 140, 0, 0.6);
  }
  100% {
    text-shadow: 0 0 12px rgba(255, 215, 0, 1), 0 0 18px rgba(255, 140, 0, 0.8),
      0 0 24px rgba(255, 215, 0, 0.6);
  }
}

/* 将要被使用状态的提示箭头 */
.action-indicator.about-to-use::after {
  content: "⬇️";
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 20px;
  color: #ffd700;
  filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.8));
  animation: arrowBounce 1s ease-in-out infinite;
  z-index: 6;
}

@keyframes arrowBounce {
  0%,
  100% {
    transform: translateX(-50%) translateY(0);
  }
  50% {
    transform: translateX(-50%) translateY(-5px);
  }
}

/* 禁用状态 - 暗淡深红的视觉效果 */
.action-indicator.disabled {
  opacity: 0.3;
  filter: brightness(0.2) contrast(0.8);
  cursor: not-allowed;
  position: relative;

  /* 深红破损木块效果 */
  background: linear-gradient(
    145deg,
    #4a1a1a 0%,
    /* 深红色 */ #3d1010 20%,
    /* 更深红色 */ #5a2020 40%,
    /* 中红色 */ #6a2a2a 60%,
    /* 稍亮红色 */ #3d1010 80%,
    /* 更深红色 */ #4a1a1a 100% /* 深红色 */
  );
  /* 使用相同尺寸的边框，深红色调 */
  border-color: #2a0808;
  border-style: dashed; /* 虚线边框暗示破损 */
  box-shadow: inset 0 0 10px rgba(80, 0, 0, 0.8), 0 1px 1px rgba(139, 69, 19, 0.1);

  /* 添加深红裂痕效果 */
  background-image: linear-gradient(
      45deg,
      transparent 40%,
      rgba(80, 20, 20, 0.5) 41%,
      rgba(80, 20, 20, 0.5) 43%,
      transparent 44%
    ),
    linear-gradient(
      135deg,
      transparent 60%,
      rgba(100, 30, 30, 0.4) 61%,
      rgba(100, 30, 30, 0.4) 62%,
      transparent 63%
    );
}

/* 添加禁用图标叠加效果 */
.action-indicator.disabled::before {
  content: "❌";
  position: absolute;
  top: -5px;
  right: -5px;
  font-size: 14px;
  color: #ff6b6b;
  filter: drop-shadow(0 0 3px rgba(255, 0, 0, 0.8));
  z-index: 4;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.6;
    transform: scale(0.9);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

.action-indicator.disabled .action-icon {
  filter: grayscale(100%) brightness(0.3) contrast(0.5)
    drop-shadow(0 0 2px rgba(0, 0, 0, 0.9));
  opacity: 0.5;
  /* 添加禁用标记 */
  position: relative;
}

/* 在图标上添加划掉的效果 */
.action-indicator.disabled .action-icon::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 120%;
  height: 2px;
  background: #ff4444;
  transform: translate(-50%, -50%) rotate(-45deg);
  box-shadow: 0 0 3px rgba(255, 68, 68, 0.8);
  z-index: 1;
}

.action-indicator.disabled .action-label {
  color: #666;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.9);
  opacity: 0.6;
  text-decoration: line-through;
  text-decoration-color: #ff4444;
  text-decoration-thickness: 2px;
}

/* 默认状态也应用轻微放大效果 */
.action-indicator:not(.disabled):not(.about-to-use) {
  transform: scale(1.05);
}

/* 悬停效果 - 在默认效果基础上适度增强 */
.action-indicator:not(.disabled):not(.about-to-use):hover {
  transform: scale(1.1);
}

.action-indicator:not(.disabled):not(.about-to-use):hover .action-icon {
  filter: drop-shadow(0 0 5px rgba(212, 175, 55, 0.6));
}

.action-indicator:not(.disabled):not(.about-to-use):hover .action-label {
  color: #fff;
  text-shadow: 1px 1px 3px rgba(212, 175, 55, 0.5);
}

/* 分割线 */
.action-separator {
  width: 2px;
  height: 30px;
  background: linear-gradient(
    180deg,
    transparent 0%,
    #d4af37 20%,
    #d4af37 80%,
    transparent 100%
  );
  border-radius: 1px;
  box-shadow: 0 0 4px rgba(212, 175, 55, 0.5);
  margin: 0 10px;
  flex-shrink: 0;
  position: relative;
  z-index: 2;
}

/* 动作图标 - 柔和的发光效果 */
.action-icon {
  font-size: 16px;
  filter: drop-shadow(0 0 3px rgba(212, 175, 55, 0.4));
  margin-right: 4px;
  transition: all 0.3s ease;
}

/* 动作标签 - 柔和的文字效果 */
.action-label {
  color: #d6d4d4;
  font-size: 11px;
  font-weight: bolder;
  /* text-shadow: 1px 1px 2px rgba(212, 175, 55, 0.3); */
  /* text-transform: uppercase; */
  letter-spacing: 0.5px;
  min-width: 28px;
  transition: all 0.3s ease;
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

  .action-separator {
    height: 25px;
  }
}
</style>
