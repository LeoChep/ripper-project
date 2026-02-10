<template>
  <div class="action-panel" id="action-panel">
    <!-- 双标签栏 -->
    <div class="tab-container">
      <div class="tab-row">
        <div class="tab-group">
          <button
            :class="['action-btn', { selected: attackSelected === true }]"
            @click="selectAttack()"
          >
            攻击
          </button>
          <button
            :class="['action-btn', { selected: moveSelected === true }]"
            @click="selectMove()"
          >
            移动
          </button>
          <button
            :class="['action-btn', { selected: stepSelected === true }]"
            @click="selectStep()"
          >
            快步
          </button>
          <button
            v-if="proned"
            :class="['action-btn', { selected: standSelected === true }]"
            @click="selectStand()"
          >
            起身
          </button>
          <button :class="['action-btn']" @click="endTurn()">结束回合</button>
          <!-- <button :class="['tab-btn', { active: activeActionTab === 'standard' }]" 
                            @click="activeActionTab = 'standard'">标准动作</button>
                    <button :class="['tab-btn', { active: activeActionTab === 'move' }]" 
                            @click="activeActionTab = 'move'">移动动作</button>
                    <button :class="['tab-btn', { active: activeActionTab === 'minor' }]" 
                            @click="activeActionTab = 'minor'">次要动作</button> -->
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
import { CharacterCombatController } from "@/core/controller/CharacterCombatController";
import { computed, onMounted, ref, watch } from "vue";
import PowerTooltip from "@/components/PowerTooltip/PowerTooltip.vue";


// Props
const props = defineProps({
  character: {
    type: Object,
    default: null,
  },
});

// Emits
const emit = defineEmits(["actionSelected", "openInventory"]);

// 响应式数据
const activeActionTab = ref("standard");
const activePowerTab = ref("atwill");
const selectedAction = ref(null);

// 悬浮窗相关数据
const tooltipVisible = ref(false);
const tooltipPower = ref(null);
const mouseX = ref(0);
const mouseY = ref(0);

// 从角色获取威能数据
const actions = computed(() => {
  const character = props.character.creature;
  if (!character || !character.powers) {
    return [];
  }

  // console.log('获取威能数据:', character.powers)
  const actions = character.powers.map((power, index) => ({
    id: `power_${index}`,
    displayName: power.displayName || power.name, // 使用威能的显示名称或默认名称
    name: power.name,
    actionType: power.actionType, // 'standard', 'move', 'minor'
    powerType: power.useType, // 'atwill', 'encounter', 'daily', 'utility'
    power: power, // 保存完整的威能对象以供后续使用
  }));
  // console.log('获取的动作:', actions)
  return actions;
});

// 监听角色变化，重置选择状态
// watch(() => props.character, (newCharacter) => {
//   selectedAction.value = null
//   attackSelected.value = false
//   moveSelected.value = false
// }, { deep: true })

// 过滤动作
const filteredActions = computed(() => {
  // console.log('过滤动作:', props.character)
  return actions.value.filter(
    (action) =>
      // action.type === activeActionTab.value &&
      action.powerType === activePowerTab.value
  );
});

// 获取动作类型文本
const getActionTypeText = (type) => {
  const typeMap = {
    standard: "标准动作",
    move: "移动动作",
    minor: "次要动作",
  };
  return typeMap[type] || type;
};

// 获取威能类型文本
const getPowerTypeText = (type) => {
  const typeMap = {
    atwill: "随意威能",
    encounter: "遭遇威能",
    utility: "辅助威能",
    daily: "每日威能",
    item: "道具",
  };
  return typeMap[type] || type;
};

// 选择动作
const selectAction = (action) => {
  selectedAction.value = action;
  console.log("选中威能:", action);
  CharacterCombatController.instance.usePowerController(action.power);
  emit("actionSelected", action);
};
//
const selectPowerTab = (tab) => {
  attackSelected.value = false;
  activePowerTab.value = tab;
  selectedAction.value = null; // 清除选中的动作

  // 如果选择道具标签，触发打开背包事件
  if (tab === "item") {
    emit("openInventory");
  }
};

const attackSelected = ref(false);
const selectAttack = () => {
  if (!CharacterCombatController.instance.inUse) {
    return;
  }
  if (CharacterCombatController.instance.selectedCharacter.state !== "idle") {
    console.warn("当前角色状态不允许攻击");
    return;
  }
  activePowerTab.value = null;
  attackSelected.value = false;
  moveSelected.value = false;
  stepSelected.value = false;
  selectedAction.value = null; // 清除选中的动作
  CharacterCombatController.instance.useAttackController();
};

const moveSelected = ref(false);
const selectMove = () => {
  if (!CharacterCombatController.instance.inUse) {
    console.warn("当前无法使用移动控制器");
    return;
  }
  if (CharacterCombatController.instance.selectedCharacter.state !== "idle") {
    console.warn("当前角色状态不允许移动");
    return;
  }
  CharacterCombatController.instance.useMoveController();
  activePowerTab.value = null;
  stepSelected.value = false;
  attackSelected.value = false;
  moveSelected.value = true;
  selectedAction.value = null; // 清除选中的动作
};
const proned = ref(false);
const checkProned = () => {
  let pronedBuff;
  props.character.creature?.buffs.forEach((buff) => {
    if (buff.name === "Proned") {
      pronedBuff = buff;
    }
  });
  if (pronedBuff) {
    proned.value = true;
  } else {
    proned.value = false;
  }
};
onMounted(() => {
  setInterval(() => {
    checkProned();
  }, 200);
});
const stepSelected = ref(false);
const selectStep = () => {
  if (!CharacterCombatController.instance.inUse) {
    console.warn("当前无法使用移动控制器");
    return;
  }
  if (CharacterCombatController.instance.selectedCharacter.state !== "idle") {
    console.warn("当前角色状态不允许移动");
    return;
  }
  CharacterCombatController.instance.useStepController();
  activePowerTab.value = null;
  attackSelected.value = false;
  moveSelected.value = false;
  stepSelected.value = true;
  selectedAction.value = null; // 清除选中的动作
};
const standSelected = ref(false);
const selectStand = () => {
  if (!CharacterCombatController.instance.inUse) {
    console.warn("当前无法使用起身控制器");
    return;
  }
  if (CharacterCombatController.instance.selectedCharacter.state !== "idle") {
    console.warn("当前角色状态不允许起身");
    return;
  }
  CharacterCombatController.instance.useStandController();
  activePowerTab.value = null;
  attackSelected.value = false;
  moveSelected.value = false;
  stepSelected.value = false;
  standSelected.value = true;
  selectedAction.value = null; // 清除选中的动作
};
const endTurn = () => {
  console.log("尝试结束回合", CharacterCombatController.instance);
  if (CharacterCombatController.instance.selectedCharacter.state !== "idle") {
    console.warn("当前角色状态不允许结束");
    return;
  }
  if (!CharacterCombatController.instance.inUse) {
    console.warn("当前无法结束回合");
    return;
  }
  CharacterCombatController.instance.endTurn();
};

// 悬浮窗方法
const showTooltip = (action, event) => {
  tooltipPower.value = action.power;
  tooltipVisible.value = true;
  updateTooltipPosition(event);
};

const hideTooltip = () => {
  tooltipVisible.value = false;
  tooltipPower.value = null;
};

const updateTooltipPosition = (event) => {
  mouseX.value = event.clientX;
  mouseY.value = event.clientY;
};

// 暴露给父组件的方法
defineExpose({
  resetSelection() {
    selectedAction.value = null;
  },
});
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
</style>
