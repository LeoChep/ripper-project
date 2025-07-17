<template>
    <div class="action-panel">
        <!-- 双标签栏 -->
        <div class="tab-container">
            <div class="tab-row">
                <div class="tab-group">
                    <button :class="['tab-btn', { active: activeActionTab === 'standard' }]" 
                            @click="activeActionTab = 'standard'">标准动作</button>
                    <button :class="['tab-btn', { active: activeActionTab === 'move' }]" 
                            @click="activeActionTab = 'move'">移动动作</button>
                    <button :class="['tab-btn', { active: activeActionTab === 'minor' }]" 
                            @click="activeActionTab = 'minor'">次要动作</button>
                </div>
                <div class="tab-separator"></div>
                <div class="tab-group">
                    <button :class="['tab-btn', { active: activePowerTab === 'atwill' }]" 
                            @click="activePowerTab = 'atwill'">随意</button>
                    <button :class="['tab-btn', { active: activePowerTab === 'encounter' }]" 
                            @click="activePowerTab = 'encounter'">遭遇</button>
                    <button :class="['tab-btn', { active: activePowerTab === 'utility' }]" 
                            @click="activePowerTab = 'utility'">辅助</button>
                    <button :class="['tab-btn', { active: activePowerTab === 'daily' }]" 
                            @click="activePowerTab = 'daily'">每日</button>
                    <button :class="['tab-btn', { active: activePowerTab === 'item' }]" 
                            @click="activePowerTab = 'item'">道具</button>
                </div>
            </div>
        </div>
        
        <!-- 动作按钮区域 -->
        <div class="action-buttons">
            <button v-for="action in filteredActions" :key="action.id" 
                    :class="['action-btn', { selected: selectedAction?.id === action.id }]"
                    @click="selectAction(action)">
                {{ action.name }}
            </button>
        </div>
        
        <!-- 状态提示栏 -->
        <div class="status-bar">
            <div class="current-selection">
                <span v-if="selectedAction">
                    当前选择：[{{ getActionTypeText(selectedAction.type) }}·{{ getPowerTypeText(selectedAction.powerType) }}]
                </span>
                <span v-else>当前选择：无</span>
            </div>
            <div class="action-points">
                剩余行动点：
                <span v-for="n in 3" :key="n" 
                      :class="['action-point', { filled: n <= remainingActionPoints }]">
                    {{ n <= remainingActionPoints ? '●' : '○' }}
                </span>
            </div>
        </div>
    </div>
</template>
<script setup>
import { computed, ref } from 'vue'

// Props
const props = defineProps({
    character: {
        type: Object,
        default: null
    }
})

// Emits
const emit = defineEmits(['actionSelected'])

// 响应式数据
const activeActionTab = ref('standard')
const activePowerTab = ref('atwill')
const selectedAction = ref(null)
const remainingActionPoints = ref(3)

// 示例动作数据
const actions = ref([
    { id: 1, name: '冲锋', type: 'standard', powerType: 'atwill' },
    { id: 2, name: '斩击', type: 'standard', powerType: 'atwill' },
    { id: 3, name: '盾击', type: 'standard', powerType: 'encounter' },
    { id: 4, name: '治疗', type: 'minor', powerType: 'utility' },
    { id: 5, name: '火球', type: 'standard', powerType: 'encounter' },
    { id: 6, name: '药水', type: 'minor', powerType: 'item' },
    { id: 7, name: '移动', type: 'move', powerType: 'atwill' },
    { id: 8, name: '冲刺', type: 'move', powerType: 'atwill' },
    { id: 9, name: '神圣打击', type: 'standard', powerType: 'daily' },
])

// 过滤动作
const filteredActions = computed(() => {
    return actions.value.filter(action => 
        action.type === activeActionTab.value && action.powerType === activePowerTab.value
    )
})

// 获取动作类型文本
const getActionTypeText = (type) => {
    const typeMap = {
        'standard': '标准动作',
        'move': '移动动作',
        'minor': '次要动作'
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

// 选择动作
const selectAction = (action) => {
    selectedAction.value = action
    console.log('选中动作:', action)
    emit('actionSelected', action)
}

// 暴露给父组件的方法
defineExpose({
    resetSelection() {
        selectedAction.value = null
    },
    setActionPoints(points) {
        remainingActionPoints.value = points
    }
})
</script>

<style scoped>
/* 动作选择面板 */
.action-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 125px;
    background: rgba(0, 0, 0, 0.6);
    border-radius: 8px;
    padding: 10px;
    border: 2px solid #444;
}

/* 标签栏容器 */
.tab-container {
    margin-bottom: 8px;
}

.tab-row {
    display: flex;
    align-items: center;
    gap: 15px;
    /* margin-bottom: 8px; */
}

.tab-group {
    display: flex;
    gap: 4px;
}

.tab-separator {
    width: 1px;
    height: 20px;
    background: #666;
}

.tab-btn {
    padding: 4px 8px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid #666;
    border-radius: 4px;
    color: #ccc;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.2s;
}

.tab-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
}

.tab-btn.active {
    background: #4a90e2;
    color: #fff;
    border-color: #4a90e2;
}

/* 动作按钮区域 */
.action-buttons {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    overflow-y: auto;
    margin-bottom: 8px;
}

.action-btn {
    padding: 6px 12px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid #666;
    border-radius: 4px;
    color: #fff;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
}

.action-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
}

.action-btn.selected {
    background: #f39c12;
    border-color: #f39c12;
    color: #fff;
}

/* 状态提示栏 */
.status-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 8px;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 4px;
    border-top: 1px solid #444;
}

.current-selection {
    color: #fff;
    font-size: 10px;
    font-weight: bold;
}

.action-points {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #fff;
    font-size: 10px;
}

.action-point {
    font-size: 14px;
    color: #666;
}

.action-point.filled {
    color: #4a90e2;
}
</style>

