<template>
    <div class="action-bar-container" v-if="character && character.initiative">
        <div class="fantasy-bar">
            <!-- 装饰性边框 -->
            <div class="bar-ornament left"></div>
            <div class="bar-ornament right"></div>

            <!-- 背景分段区域 -->
            <div class="background-segments">
                <div :class="['bg-segment', 'standard-bg', { 'disabled': remainingStandardActions === 0 }]"></div>
                <div :class="['bg-segment', 'move-bg', { 'disabled': remainingMoveActions <= 0 }]"></div>
                <div :class="['bg-segment', 'minor-bg', { 'disabled': remainingMinorActions === 0 }]"></div>
                <div :class="['bg-segment', 'reaction-bg', { 'disabled': remainingReactionActions === 0 }]"></div>
            </div>

            <!-- 动作指示器 - 横向排列 -->
            <div class="action-indicators">
                <!-- 标准动作 -->
                <div :class="['action-indicator', 'standard', { 'disabled': remainingStandardActions === 0 }]">
                    <div class="action-icon">⚔️</div>
                    <div class="action-label">标准</div>
                </div>

                <!-- 分割线 -->
                <div class="action-separator"></div>

                <!-- 移动动作 -->
                <div :class="['action-indicator', 'move', { 'disabled': remainingMoveActions <= 0 }]">
                    <!-- {{ currentMoveActions }} -->
                    <div class="action-icon">🏃</div>
                    <div class="action-label">移动</div>
                </div>

                <!-- 分割线 -->
                <div class="action-separator"></div>

                <!-- 次要动作 -->
                <div :class="['action-indicator', 'minor', { 'disabled': remainingMinorActions === 0 }]">
                    <div class="action-icon">🛡️</div>
                    <div class="action-label">次要</div>
                </div>

                <!-- 分割线 -->
                <div class="action-separator"></div>

                <!-- 反应动作 -->
                <div :class="['action-indicator', 'reaction', { 'disabled': remainingReactionActions === 0 }]">
                    <div class="action-icon">⚡</div>
                    <div class="action-label">反应</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'

// Props
const props = defineProps({
    character: {
        type: Object,
        default: null
    }
})

// 响应式数据，用于存储实时查询的动作数量
const currentStandardActions = ref(0)
const currentMoveActions = ref(0)
const currentMinorActions = ref(0)
const currentReactionActions = ref(0)

// 轮询定时器
let pollingTimer = null

// 轮询函数，实时更新动作数量
const pollActionNumbers = () => {
    if (!props.character || !props.character.initiative) return

    // 直接使用 initiative 中的已使用动作数量作为剩余动作数量
    currentStandardActions.value = props.character.initiative.standerActionNumber || 0
    currentMoveActions.value = props.character.initiative.moveActionNumber || 0
    currentMinorActions.value = props.character.initiative.minorActionNumber || 0
    currentReactionActions.value = props.character.initiative.reactionNumber || 0
}

// 组件挂载时启动轮询
onMounted(() => {
    // 立即执行一次
    pollActionNumbers()

    // 每100ms轮询一次
    pollingTimer = setInterval(pollActionNumbers, 100)
})

// 组件卸载时清理定时器
onUnmounted(() => {
    if (pollingTimer) {
        clearInterval(pollingTimer)
        pollingTimer = null
    }
})

// 动作相关计算属性
const maxStandardActions = computed(() => 1)
const maxMoveActions = computed(() => 1)
const maxMinorActions = computed(() => 1)
const maxReactionActions = computed(() => 1)

// 剩余动作数量直接使用轮询获取的数值
const remainingStandardActions = computed(() => currentStandardActions.value)
const remainingMoveActions = computed(() => currentMoveActions.value)
const remainingMinorActions = computed(() => currentMinorActions.value)
const remainingReactionActions = computed(() => currentReactionActions.value)
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
    padding: 5px 20px 5px 5px;
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
    width: calc(40% + 11px);
    
    /* margin-left: -10px; */

}

/* 移动动作背景 */
.bg-segment.move-bg {
    /* 您可以在这里设置left和width或right */
    width: calc(30% + 21px);
    left: calc(40% + 11px);
}

/* 次要动作背景 */
.bg-segment.minor-bg {
    /* 您可以在这里设置left和width或right */
    width: calc(10% + 21px);
    left: calc(70% + 32px);
}

/* 反应动作背景 */
.bg-segment.reaction-bg {
    /* 您可以在这里设置left和width或right */
        width: calc(10% + 30px);
    left: calc(80% + 52px);
}

.bg-segment.disabled {
    background: linear-gradient(180deg,
            rgba(0, 0, 0, 0.8) 0%,
            rgba(20, 20, 20, 0.9) 50%,
            rgba(0, 0, 0, 0.8) 100%);
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
}

/* 标准动作占40% */
.action-indicator.standard {
    flex: 4;
    justify-content: center;
    padding-left: 0;
}
.action-indicator.reaction {
    flex: 4;
    justify-content: center;
    padding-right: 0;
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
}

/* 禁用状态 - 移除单个指示器的背景 */
.action-indicator.disabled {
    opacity: 0.6;
    filter: grayscale(40%);
    cursor: not-allowed;
}

.action-indicator.disabled .action-icon {
    filter: grayscale(80%) brightness(0.7) drop-shadow(0 0 2px rgba(0, 0, 0, 0.5));
}

.action-indicator.disabled .action-label {
    color: #999;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

/* 悬停效果 - 只对可用状态生效 */
.action-indicator:not(.disabled):hover {
    transform: scale(1.05);
}

.action-indicator:not(.disabled):hover .action-icon {
    filter: drop-shadow(0 0 6px rgba(212, 175, 55, 0.8));
}

.action-indicator:not(.disabled):hover .action-label {
    color: #fff;
    text-shadow: 1px 1px 3px rgba(212, 175, 55, 0.5);
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
    margin: 0 10px;
    flex-shrink: 0;
    position: relative;
    z-index: 2;
}

/* 动作图标 */
.action-icon {
    font-size: 16px;
    filter: drop-shadow(0 0 3px rgba(212, 175, 55, 0.5));
    margin-right: 4px;
    transition: all 0.3s ease;
}

/* 动作标签 */
.action-label {
    color: #f4e4bc;
    font-size: 11px;
    font-weight: bold;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
    text-transform: uppercase;
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
