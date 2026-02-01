<template>
  <div class="creature-info-overlay" v-if="creature" @click="$emit('close')">
    <div class="creature-info-panel" @click.stop>
      <!-- 装饰性边框 -->
      <div class="panel-ornament top-left"></div>
      <div class="panel-ornament top-right"></div>
      <div class="panel-ornament bottom-left"></div>
      <div class="panel-ornament bottom-right"></div>

      <!-- 关闭按钮 -->
      <div class="close-btn" @click="$emit('close')">✕</div>

      <!-- Header 区域 -->
      <div class="creature-header">
        <!-- 左侧头像区域 -->
        <div class="creature-avatar">
          <div class="avatar-wrapper">
            <img
              v-if="avatarUrl"
              :src="avatarUrl"
              @error="handleImageError"
              class="creature-avatar-image"
              alt="生物头像"
            />
          </div>
        </div>

        <!-- 右侧信息区域 -->
        <div class="creature-title-section">
          <div class="title-row">
            <div class="creature-title-wrapper">
              <h2 class="creature-name">{{ creature.name }}</h2>
              <div class="creature-subtitle">{{ creatureTypeText }}</div>
            </div>

            <!-- 等级和机动性信息同行，底部对齐 -->
            <div class="level-and-mobility">
              <div class="creature-level">{{ creature.level }} 级</div>

              <!-- 机动性信息内联 -->
              <div class="mobility-info-inline">
                <!-- AC -->
                <div class="info-item-inline">
                  <span class="label">AC</span>
                  <span class="value">{{ creature.ac }}</span>
                </div>
                <!-- HP -->
                <div class="info-item-inline">
                  <span class="label">HP</span>
                  <span class="value">{{ creature.hp }}</span>
                </div>
                <div class="info-item-inline">
                  <span class="label">THP</span>
                  <span class="value">{{ creature.thp }}</span>
                </div>
                <!-- 速度 -->
                <div class="info-item-inline">
                  <span class="label">速度</span>
                  <span class="value">{{ creature.speed }}</span>
                </div>
                <!-- 倡议 -->
                <div class="info-item-inline">
                  <span class="label">先攻</span>
                  <span class="value">{{ creature.initiative }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 书签式分页导航 -->
        <div class="bookmark-navigation">
          <div
            v-for="(tab, index) in tabs"
            :key="tab.id"
            class="bookmark-tab"
            :class="{ active: currentPage === tab.id }"
            @click="currentPage = tab.id"
          >
            <div class="tab-label">{{ tab.label }}</div>
          </div>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="content-area">
        <!-- 使用子组件 -->
        <CreatureBasicInfo
          v-if="currentPage === 'basic'"
          :unit="unit"
          :creature="creature"
          :reflex="reflex"
          :will="will"
        />
        <CreaturePowers v-if="currentPage === 'powers'" :creature="creature" />
        <CreatureTraits v-if="currentPage === 'traits'" :creature="creature" />
        <CreatureEquipment v-if="currentPage === 'equipment'" :creature="creature" />
        <CreatureFeats v-if="currentPage === 'feats'" :creature="creature" />
        <CreatureInventory 
          v-if="currentPage === 'inventory'" 
          :unit="unit" 
          :creature="creature"
          @close="$emit('close')"
        />
        <CreatureOther v-if="currentPage === 'other'" :creature="creature" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ModifierSystem } from "@/core/system/ModifierSystem";
import type { Creature } from "@/core/units/Creature";
import type { Unit } from "@/core/units/Unit";
import { onMounted, onBeforeUnmount, ref, computed, provide } from "vue";
import { getUnitAvatar } from "@/utils/utils";
// 导入子组件
import CreatureBasicInfo from "./pages/CreatureBasicInfo.vue";
import CreaturePowers from "./pages/CreaturePowers.vue";
import CreatureTraits from "./pages/CreatureTraits.vue";
import CreatureEquipment from "./pages/CreatureEquipment.vue";
import CreatureFeats from "./pages/CreatureFeats.vue";
import CreatureOther from "./pages/CreatureOther.vue";
import CreatureInventory from "./pages/CreatureInventory.vue";

defineEmits(["close"]);

const props = defineProps<{
  creature: Creature | null;
  unit: Unit | null;
}>();

// 当前页面状态
const currentPage = ref<string>("basic");

// 豁免值
const will = ref("");
const reflex = ref("");

// 分页配置
const tabs = ref([
  { id: "basic", label: "基础" },
  { id: "powers", label: "能力" },
  { id: "traits", label: "特性" },
  { id: "equipment", label: "装备" },
  { id: "feats", label: "专长" },
  { id: "inventory", label: "背包" },
  { id: "other", label: "其他" },
]);

// 获取头像的计算属性
const avatarUrl = computed(() => {
  if (props.unit?.unitTypeName) {
    return getUnitAvatar(props.unit.unitTypeName);
  }
  return null;
});

// 生物类型文本计算属性
const creatureTypeText = computed(() => {
  if (!props.creature) return "";
  return `${props.creature.size || ""} ${props.creature.type || ""} ${
    props.creature.role || ""
  }`.trim();
});

// 图片加载错误处理
const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement;
  if (target) {
    target.style.display = "none";
  }
};

// 初始化豁免值
onMounted(() => {
  const getValue = (valuePath: string) => {
    if (!props.unit) return "";
    let valueStack = ModifierSystem.getInstance().getValueStack(props.unit, valuePath);
    let result;
    result = valueStack.finalValue.toString();
    if (valueStack.modifiers.length > 0) {
      result += ` (${valueStack.modifiers
        .map((m) => m.value + " " + m.type)
        .join(", ")})`;
    }
    return result;
  };
  const getUnit = () => {
    return props.unit;
  };

  setInterval(() => {
    if (props.unit) {
      will.value = getValue("will");
      reflex.value = getValue("reflex");
    }
  }, 100);
  
  // 监听切换到背包页的事件
  const handleSwitchToInventory = () => {
    currentPage.value = 'inventory';
  };
  
  window.addEventListener('switchToInventoryPage', handleSwitchToInventory);
  
  // 清理事件监听器在组件卸载时
  const cleanup = () => {
    window.removeEventListener('switchToInventoryPage', handleSwitchToInventory);
  };
  
  // Vue3中使用onBeforeUnmount替代return cleanup
});
</script>

<style scoped>
/* 奇幻风格覆盖层 */
.creature-info-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(2px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: overlayFadeIn 0.3s ease-out;
}

@keyframes overlayFadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

/* 奇幻面板主容器 */
.creature-info-panel {
  position: relative;
  background: linear-gradient(
    135deg,
    #2c1810 0%,
    #3d2415 25%,
    #4a2c1a 50%,
    #3d2415 75%,
    #2c1810 100%
  );
  border: 3px solid #8b4513;
  border-radius: 12px;
  box-shadow: 0 0 30px rgba(139, 69, 19, 0.6), inset 0 2px 4px rgba(255, 215, 0, 0.1),
    inset 0 -2px 4px rgba(0, 0, 0, 0.3);
  width: 800px;
  height: 85vh;
  overflow: hidden;
  animation: panelSlideIn 0.4s ease-out;
}

@keyframes panelSlideIn {
  from {
    transform: translateY(-50px) scale(0.9);
    opacity: 0;
  }

  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

/* 装饰性边框角饰 */
.panel-ornament {
  position: absolute;
  width: 30px;
  height: 30px;
  background: linear-gradient(45deg, #ffd700, #ff8c00, #ffd700);
  border: 2px solid #8b4513;
  transform: rotate(45deg);
  z-index: 1;
}

.panel-ornament.top-left {
  top: -15px;
  left: -15px;
}

.panel-ornament.top-right {
  top: -15px;
  right: -15px;
}

.panel-ornament.bottom-left {
  bottom: -15px;
  left: -15px;
}

.panel-ornament.bottom-right {
  bottom: -15px;
  right: -15px;
}

/* 关闭按钮 */
.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #dc143c, #8b0000);
  color: white;
  border: 2px solid #8b4513;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  z-index: 2;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

.close-btn:hover {
  background: linear-gradient(135deg, #ff1744, #dc143c);
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(220, 20, 60, 0.6);
}

/* Header 区域 */
.creature-header {
  position: relative;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 140, 0, 0.1));
  border-bottom: 2px solid #8b4513;
  padding: 20px 20px 30px 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 头像区域 */
.creature-avatar {
  position: absolute;
  left: 20px;
  top: 20px;
  width: 120px;
  height: 120px;
}

.avatar-wrapper {
  width: 100%;
  height: 100%;
  border: 3px solid #8b4513;
  border-radius: 12px;
  background: linear-gradient(
    135deg,
    rgba(139, 69, 19, 0.3),
    rgba(61, 36, 21, 0.5),
    rgba(139, 69, 19, 0.3)
  );
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 215, 0, 0.1),
    inset 0 -2px 4px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  position: relative;
}

.creature-avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

/* 标题区域 */
.creature-title-section {
  margin-left: 140px;
}

.title-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.creature-title-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* 等级和机动性信息的容器 */
.level-and-mobility {
  display: flex;
  align-items: flex-end;
  gap: 24px;
  flex-wrap: wrap;
}

.creature-name {
  font-size: 28px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8), 0 0 10px rgba(255, 215, 0, 0.5);
  margin: 0;
}

.creature-subtitle {
  font-size: 16px;
  color: #daa520;
  font-style: italic;
  line-height: 1;
}

.creature-level {
  font-size: 18px;
  color: #ffd700;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  align-self: flex-end;
  /* 底部对齐 */
}

/* 机动性信息 */
.mobility-info-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
  /* 改为底部对齐 */
}

.info-item-inline {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 80px;
  justify-content: flex-end;
  /* 确保内容底部对齐 */
}

.info-item-inline .label {
  font-size: 11px;
  color: #daa520;
  margin-bottom: 2px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1;
}

.info-item-inline .value {
  font-size: 16px;
  color: #ffd700;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.6);
  line-height: 1;
}

/* 书签式分页导航 */
.bookmark-navigation {
  display: flex;
  justify-content: center;
  gap: 0;
  margin-top: 10px;
  flex-wrap: wrap;
  position: absolute;
  bottom: 0px;
  right: 40px;
}

.bookmark-tab {
  background: linear-gradient(135deg, rgba(61, 36, 21, 0.9), rgba(44, 24, 16, 0.9));
  border: 2px solid rgba(139, 69, 19, 0.8);
  border-bottom: none;
  border-radius: 12px 12px 0 0;
  color: #daa520;
  font-weight: bold;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 215, 0, 0.1);
  min-width: 90px;
  position: relative;
  margin-right: -2px;
  z-index: 1;
  transform: translateY(0);
}

.bookmark-tab::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: inherit;
  border-radius: inherit;
  /* transform: perspective(20px) rotateX(-2deg); */
  z-index: -1;
}

.bookmark-tab:hover {
  background: linear-gradient(135deg, rgba(139, 69, 19, 0.9), rgba(218, 165, 32, 0.8));
  color: #ffd700;
  /* transform: translateY(-3px); */
  z-index: 2;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 215, 0, 0.2),
    0 0 10px rgba(218, 165, 32, 0.3);
}

.bookmark-tab.active {
  background: linear-gradient(135deg, #daa520, #ffd700, #daa520);
  color: #2c1810;
  border-color: #ffd700;
  /* transform: translateY(-6px); */
  z-index: 3;
  box-shadow: 0 -6px 16px rgba(0, 0, 0, 0.5), inset 0 1px 4px rgba(255, 215, 0, 0.4),
    0 0 20px rgba(255, 215, 0, 0.6);
}

.tab-label {
  text-align: center;
}

/* 内容区域 */
.content-area {
  height: calc(85vh - 200px);
  overflow-y: auto;
  padding: 20px 30px;
  scrollbar-width: thin;
  scrollbar-color: #8b4513 #2c1810;
}

.content-area::-webkit-scrollbar {
  width: 8px;
}

.content-area::-webkit-scrollbar-track {
  background: #2c1810;
  border-radius: 4px;
}

.content-area::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #8b4513, #daa520);
  border-radius: 4px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .creature-info-panel {
    width: 95vw;
    height: 90vh;
  }

  .creature-header {
    padding: 15px 0px 0px 15px;
    flex-direction: column;
    align-items: center;
    gap: 15px;
  }

  .creature-avatar {
    position: static;
    width: 80px;
    height: 80px;
  }

  .creature-title-section {
    margin-left: 0;
    text-align: center;
  }

  .title-row {
    align-items: center;
  }

  .mobility-info-inline {
    justify-content: center;
  }

  .bookmark-navigation {
    gap: -1px;
  }

  .bookmark-tab {
    min-width: 70px;
    font-size: 11px;
    /* padding: 10px 16px 14px; */
  }

  .content-area {
    padding: 15px 20px;
    height: calc(90vh - 180px);
  }
}
</style>
