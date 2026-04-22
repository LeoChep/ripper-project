<template>
  <div class="action-panel">
    <!-- 双标签栏 -->
    <div class="tab-container">
      <div class="tab-row">
        <div class="tab-group">
          <button
            :class="['action-btn', { selected: attackSelected }]"
            @click="selectAttack"
          >
            攻击
          </button>
          <button
            :class="['action-btn', { selected: moveSelected }]"
            @click="selectMove"
          >
            移动
          </button>
          <button
            :class="['action-btn', { selected: stepSelected }]"
            @click="selectStep"
          >
            快步
          </button>
          <button
            v-if="proned"
            :class="['action-btn', { selected: standSelected }]"
            @click="selectStand"
          >
            起身
          </button>
          <button class="action-btn" @click="endTurn">结束回合</button>
        </div>
        <div class="tab-separator"></div>
        <div class="tab-group">
          <button
            :class="['tab-btn', { active: activePowerTab === 'atwill' }]"
            @click="selectPowerTab('atwill')"
          >
            随意
          </button>
          <button
            :class="['tab-btn', { active: activePowerTab === 'encounter' }]"
            @click="selectPowerTab('encounter')"
          >
            遭遇
          </button>
          <button
            :class="['tab-btn', { active: activePowerTab === 'utility' }]"
            @click="selectPowerTab('utility')"
          >
            辅助
          </button>
          <button
            :class="['tab-btn', { active: activePowerTab === 'daily' }]"
            @click="selectPowerTab('daily')"
          >
            每日
          </button>
          <button
            :class="['tab-btn', { active: activePowerTab === 'item' }]"
            @click="selectPowerTab('item')"
          >
            道具
          </button>
        </div>
      </div>
    </div>

    <!-- 动作按钮区域 -->
    <div class="action-buttons">
      <button
        v-for="action in filteredActions"
        :key="action.id"
        :class="['action-btn', { selected: selectedAction?.id === action.id }]"
        @click="selectAction(action)"
        @mouseenter="showTooltip(action, $event)"
        @mouseleave="hideTooltip"
        @mousemove="updateTooltipPosition($event)"
      >
        {{ action.displayName }}
      </button>
    </div>

    <!-- 威能详情悬浮窗 -->
    <PowerTooltip
      :power="tooltipPower"
      :visible="tooltipVisible"
      :mouseX="mouseX"
      :mouseY="mouseY"
    />

    <!-- 状态提示栏 -->
    <div class="status-bar">
      <div class="current-selection">
        <span v-if="selectedAction">
          当前选择：[{{ getActionTypeText(selectedAction.actionType) }}·{{
            getPowerTypeText(selectedAction.powerType)
          }}]
        </span>
        <span v-else>当前选择：无</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { shallowRef, computed } from 'vue'
import { CharacterCombatController } from '@/core/controller/CharacterCombatController'
import PowerTooltip from '@/components/PowerTooltip/PowerTooltip.vue'

// 使用 shallowRef 避免深度响应式
const activePowerTab = shallowRef('atwill')
const attackSelected = shallowRef(false)
const moveSelected = shallowRef(false)
const stepSelected = shallowRef(false)
const standSelected = shallowRef(false)
const proned = shallowRef(false)
const selectedAction = shallowRef(null)
const actionsData = shallowRef([])

// 悬浮窗相关数据
const tooltipVisible = shallowRef(false)
const tooltipPower = shallowRef(null)
const mouseX = shallowRef(0)
const mouseY = shallowRef(0)

// 存储威能数据（原始对象，非响应式）
let powersData = []
let selectedCharacterId = null

const emit = defineEmits(['actionSelected', 'openInventory'])

// 过滤动作 - 使用 computed 但基于 shallowRef
const filteredActions = computed(() => {
  return actionsData.value.filter(
    (action) => action.powerType === activePowerTab.value
  )
})

// 选择动作
const selectAction = (action) => {
  selectedAction.value = action
  console.log("选中威能:", action)
  CharacterCombatController.instance?.usePowerController(action.power)
  emit("actionSelected", action)
}

// 重置选择状态
const resetSelection = () => {
  selectedAction.value = null
  attackSelected.value = false
  moveSelected.value = false
  stepSelected.value = false
  standSelected.value = false
}

// 选择威能标签
const selectPowerTab = (tab) => {
  resetSelection()
  activePowerTab.value = tab

  if (tab === "item") {
    emit("openInventory")
  }
}

const selectAttack = () => {
  if (!CharacterCombatController.instance?.inUse) return
  if (CharacterCombatController.instance.selectedCharacter?.state !== "idle") {
    console.warn("当前角色状态不允许攻击")
    return
  }

  resetSelection()
  activePowerTab.value = null
  attackSelected.value = true
  CharacterCombatController.instance?.useAttackController()
}

const selectMove = () => {
  if (!CharacterCombatController.instance?.inUse) {
    console.warn("当前无法使用移动控制器")
    return
  }
  if (CharacterCombatController.instance.selectedCharacter?.state !== "idle") {
    console.warn("当前角色状态不允许移动")
    return
  }

  resetSelection()
  activePowerTab.value = null
  moveSelected.value = true
  CharacterCombatController.instance?.useMoveController()
}

const selectStep = () => {
  if (!CharacterCombatController.instance?.inUse) {
    console.warn("当前无法使用移动控制器")
    return
  }
  if (CharacterCombatController.instance.selectedCharacter?.state !== "idle") {
    console.warn("当前角色状态不允许移动")
    return
  }

  resetSelection()
  activePowerTab.value = null
  stepSelected.value = true
  CharacterCombatController.instance?.useStepController()
}

const selectStand = () => {
  if (!CharacterCombatController.instance?.inUse) {
    console.warn("当前无法使用起身控制器")
    return
  }
  if (CharacterCombatController.instance.selectedCharacter?.state !== "idle") {
    console.warn("当前角色状态不允许起身")
    return
  }

  resetSelection()
  activePowerTab.value = null
  standSelected.value = true
  CharacterCombatController.instance?.useStandController()
}

const endTurn = () => {
  console.log("尝试结束回合", CharacterCombatController.instance)
  if (CharacterCombatController.instance.selectedCharacter?.state !== "idle") {
    console.warn("当前角色状态不允许结束")
    return
  }
  if (!CharacterCombatController.instance?.inUse) {
    console.warn("当前无法结束回合")
    return
  }
  CharacterCombatController.instance?.endTurn()
}

// 悬浮窗方法
const showTooltip = (action, event) => {
  tooltipPower.value = action.power
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

// 获取动作类型文本
const getActionTypeText = (type) => {
  const typeMap = {
    standard: "标准动作",
    move: "移动动作",
    minor: "次要动作",
    free: "免费动作",
  }
  return typeMap[type] || type
}

// 获取威能类型文本
const getPowerTypeText = (type) => {
  const typeMap = {
    atwill: "随意威能",
    encounter: "遭遇威能",
    utility: "辅助威能",
    daily: "每日威能",
    item: "道具",
  }
  return typeMap[type] || type
}

// 更新数据 - 外部轮询调用
const updateData = (character) => {
  if (!character) {
    actionsData.value = []
    selectedCharacterId = null
    return
  }

  const newId = character.id
  const creature = character.creature

  // 角色切换，重新获取威能数据
  if (selectedCharacterId !== newId) {
    selectedCharacterId = newId
    const powers = creature?.powers || []
    actionsData.value = powers.map((power, index) => ({
      id: `power_${index}`,
      displayName: power.displayName || power.name,
      name: power.name,
      actionType: power.actionType,
      powerType: power.useType,
      power: power,
    }))
    resetSelection()
  }

  // 检查 Proned 状态
  const hasProned = creature?.buffs?.some(buff => buff.name === 'Proned')
  if (hasProned !== proned.value) {
    proned.value = hasProned
  }
}

const clear = () => {
  actionsData.value = []
  selectedCharacterId = null
  resetSelection()
  proned.value = false
  hideTooltip()
}

defineExpose({
  updateData,
  clear,
  resetSelection
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
  position: relative;
}

/* 标签栏容器 */
.tab-container {
  margin-bottom: 8px;
}

.tab-row {
  display: flex;
  align-items: center;
  gap: 15px;
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
</style>
