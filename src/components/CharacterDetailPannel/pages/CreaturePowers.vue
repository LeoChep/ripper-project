<template>
  <div class="page-content">
    <!-- 威能卡片 -->
    <div v-if="creature.powers.length" class="info-card powers">
      <div class="card-title">⚡ 威能</div>
      <div class="powers-list">
        <div
          v-for="power in creature.powers"
          :key="power.name"
          class="power-item enhanced"
          :class="{ collapsed: isPowerCollapsed(power.name) }"
        >
          <div class="power-header" @click="togglePowerCollapse(power.name)">
            <div class="power-title-section">
              <div class="power-name">{{ power.displayName }}</div>
              <div v-if="power.subName" class="power-subname">({{ power.subName }})</div>
            </div>
            <div class="collapse-button">
              <span
                class="collapse-icon"
                :class="{ expanded: !isPowerCollapsed(power.name) }"
              >
                ▼
              </span>
            </div>
          </div>

          <!-- 威能基本信息 - 总是显示 -->
          <div class="power-meta">
            <div class="power-stat">
              <span class="stat-label">等级:</span>
              <span class="stat-value">{{ power.level }}</span>
            </div>
            <div class="power-stat">
              <span class="stat-label">类型:</span>
              <span class="stat-value">{{ getPowerTypeText(power.useType) }}</span>
            </div>
            <div class="power-stat">
              <span class="stat-label">动作:</span>
              <span class="stat-value">{{ getActionTypeText(power.actionType) }}</span>
            </div>
          </div>

          <!-- 详细信息 - 可折叠部分 -->
          <div class="power-collapsible-content" v-show="!isPowerCollapsed(power.name)">
            <div class="power-details">
              <div v-if="power.rangeText" class="power-detail">
                <span class="detail-label">范围:</span>
                <span class="detail-value">{{ power.rangeText }}</span>
              </div>
              <div v-if="power.target" class="power-detail">
                <span class="detail-label">目标:</span>
                <span class="detail-value">{{ power.target }}</span>
              </div>
              <div v-if="power.area" class="power-detail">
                <span class="detail-label">区域:</span>
                <span class="detail-value">{{ power.area }}</span>
              </div>
              <div v-if="power.requirements" class="power-detail">
                <span class="detail-label">需求:</span>
                <span class="detail-value">{{ power.requirements }}</span>
              </div>
              <div v-if="power.cooldown && power.cooldown > 0" class="power-detail">
                <span class="detail-label">冷却:</span>
                <span class="detail-value">{{ power.cooldown }} 回合</span>
              </div>
              <div v-if="power.maxUses && power.maxUses > 0" class="power-detail">
                <span class="detail-label">使用次数:</span>
                <span class="detail-value"
                  >{{ power.currentUses || 0 }}/{{ power.maxUses }}</span
                >
              </div>
            </div>

            <!-- 命中效果 -->
            <div v-if="power.hitText" class="power-hit-info">
              <div class="effect-label">命中：</div>
              <div class="effect-text">{{ power.hitText }}</div>
            </div>

            <!-- 失手效果 -->
            <div v-if="power.missText" class="power-miss-info">
              <div class="effect-label">失手：</div>
              <div class="effect-text">{{ power.missText }}</div>
            </div>

            <!-- 效果 -->
            <div v-if="power.effectText" class="power-effect-info">
              <div class="effect-label">效果：</div>
              <div class="effect-text">{{ power.effectText }}</div>
            </div>

            <div v-if="power.description" class="power-description">
              {{ power.description }}
            </div>
            <div
              v-if="power.keyWords && power.keyWords.length && power.keyWords[0]"
              class="power-keywords"
            >
              <span class="keywords-label">关键词:</span>
              <span class="keywords-list">{{ power.keyWords.join(", ") }}</span>
            </div>

            <!-- 威能状态 -->
            <div class="power-status" v-if="showPowerStatus(power)">
              <div
                class="status-indicator"
                :class="{
                  available: canUsePower(power),
                  unavailable: !canUsePower(power),
                }"
              >
                <span v-if="canUsePower(power)">✓ 可使用</span>
                <span v-else>✗ 不可用</span>
                <span
                  v-if="power.currentCooldown && power.currentCooldown > 0"
                  class="cooldown-text"
                >
                  (冷却剩余: {{ power.currentCooldown }} 回合)
                </span>
              </div>
            </div>
          </div>
          <!-- 结束 power-collapsible-content -->
        </div>
      </div>
    </div>
    <div v-else class="info-card empty-state">
      <div class="empty-message">该生物没有威能</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { Creature } from "@/core/units/Creature";

const props = defineProps<{
  creature: Creature;
}>();

// 折叠状态管理 - 默认所有威能都是折叠状态
const collapsedPowers = ref<Set<string>>(
  new Set(props.creature.powers.map((power) => power.name))
);

// 切换威能卡片折叠状态
const togglePowerCollapse = (powerName: string) => {
  if (collapsedPowers.value.has(powerName)) {
    collapsedPowers.value.delete(powerName);
  } else {
    collapsedPowers.value.add(powerName);
  }
};

// 检查威能是否折叠
const isPowerCollapsed = (powerName: string) => {
  return collapsedPowers.value.has(powerName);
};

// 获取威能类型文本
const getPowerTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    atwill: "随意",
    encounter: "遭遇",
    daily: "每日",
    utility: "辅助",
  };
  return typeMap[type] || type;
};

// 获取动作类型文本
const getActionTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    standard: "标准动作",
    move: "移动动作",
    minor: "次要动作",
    free: "自由动作",
    immediate: "立即动作",
    reaction: "反应",
  };
  return typeMap[type] || type;
};

// 计算威能是否可用
const canUsePower = (power: any) => {
  if (!power) return false;

  // 如果威能有 canUse 方法，直接调用
  if (typeof power.canUse === "function") {
    return power.canUse();
  }

  // 否则进行基本检查
  // 检查冷却时间
  if (power.currentCooldown && power.currentCooldown > 0) {
    return false;
  }

  // 检查使用次数限制
  if (
    power.maxUses &&
    power.maxUses > 0 &&
    power.currentUses &&
    power.currentUses >= power.maxUses
  ) {
    return false;
  }

  // 检查是否已准备
  if (power.prepared === false) {
    return false;
  }

  return true;
};

// 判断是否显示威能状态
const showPowerStatus = (power: any) => {
  if (!power) return false;

  // 如果有冷却时间、使用次数限制或者准备状态，则显示状态
  return (
    (power.currentCooldown && power.currentCooldown > 0) ||
    (power.maxUses && power.maxUses > 0) ||
    power.prepared === false ||
    typeof power.canUse === "function"
  );
};
</script>

<style scoped>
/* 页面内容容器 */
.page-content {
  animation: pageSlideIn 0.3s ease-out;
}

@keyframes pageSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 信息卡片通用样式 */
.info-card {
  background: linear-gradient(135deg, rgba(61, 36, 21, 0.8), rgba(44, 24, 16, 0.8));
  border: 2px solid rgba(139, 69, 19, 0.8);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 215, 0, 0.1);
}

.card-title {
  font-size: 18px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(139, 69, 19, 0.5);
}

/* 威能列表 */
.powers-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.power-item {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(139, 69, 19, 0.5);
  border-radius: 8px;
  padding: 16px;
}

.power-item.enhanced {
  background: linear-gradient(135deg, rgba(61, 36, 21, 0.6), rgba(44, 24, 16, 0.6));
  border: 2px solid rgba(139, 69, 19, 0.7);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.power-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.power-header:hover {
  background: rgba(255, 215, 0, 0.1);
}

.power-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.collapse-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background: rgba(139, 69, 19, 0.3);
  border: 1px solid rgba(139, 69, 19, 0.5);
  transition: all 0.3s ease;
}

.collapse-button:hover {
  background: rgba(139, 69, 19, 0.5);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.collapse-icon {
  color: #ffd700;
  font-size: 12px;
  transition: transform 0.3s ease;
  transform: rotate(-90deg); /* 默认折叠状态，箭头指向右边 */
}

.collapse-icon.expanded {
  transform: rotate(0deg); /* 展开状态，箭头指向下方 */
}

.power-item.collapsed .collapse-icon {
  transform: rotate(-90deg);
}

.power-collapsible-content {
  transition: all 0.3s ease;
  overflow: hidden;
}

.power-item.collapsed .power-meta {
  opacity: 0.7;
}

.power-name {
  color: #ffd700;
  font-weight: bold;
  font-size: 16px;
}

.power-subname {
  color: #daa520;
  font-style: italic;
  font-size: 14px;
}

.power-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  border: 1px solid rgba(139, 69, 19, 0.3);
}

.power-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.power-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.power-detail {
  display: flex;
  gap: 8px;
}

.detail-label {
  color: #daa520;
  font-weight: bold;
  min-width: 60px;
}

.detail-value {
  color: #e6d3b7;
}

.power-description {
  color: #e6d3b7;
  font-size: 14px;
  line-height: 1.5;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  border-left: 4px solid #8b4513;
  margin-bottom: 8px;
}

/* 命中/失手/效果样式 */
.power-hit-info,
.power-miss-info,
.power-effect-info {
  margin-bottom: 12px;
  padding: 10px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(139, 69, 19, 0.3);
}

.power-hit-info {
  border-left: 4px solid #2ecc71;
  background: linear-gradient(135deg, rgba(46, 204, 113, 0.1), rgba(46, 204, 113, 0.05));
}

.power-miss-info {
  border-left: 4px solid #e74c3c;
  background: linear-gradient(135deg, rgba(231, 76, 60, 0.1), rgba(231, 76, 60, 0.05));
}

.power-effect-info {
  border-left: 4px solid #3498db;
  background: linear-gradient(135deg, rgba(52, 152, 219, 0.1), rgba(52, 152, 219, 0.05));
}

.effect-label {
  font-weight: bold;
  font-size: 13px;
  margin-bottom: 4px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

.power-hit-info .effect-label {
  color: #2ecc71;
}

.power-miss-info .effect-label {
  color: #e74c3c;
}

.power-effect-info .effect-label {
  color: #3498db;
}

.effect-text {
  color: #e6d3b7;
  font-size: 14px;
  line-height: 1.5;
}

.power-keywords {
  display: flex;
  gap: 8px;
  align-items: center;
}

.keywords-label {
  color: #daa520;
  font-weight: bold;
  font-size: 13px;
}

.keywords-list {
  color: #ffd700;
  font-size: 13px;
  background: rgba(0, 0, 0, 0.3);
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid rgba(139, 69, 19, 0.5);
}

.stat-label {
  color: #daa520;
  font-size: 13px;
}

.stat-value {
  color: #e6d3b7;
  font-weight: bold;
}

/* 威能状态样式 */
.power-status {
  margin-top: 12px;
  padding: 8px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(139, 69, 19, 0.3);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: bold;
}

.status-indicator.available {
  color: #2ecc71;
}

.status-indicator.unavailable {
  color: #e74c3c;
}

.cooldown-text {
  font-size: 12px;
  color: #daa520;
  font-weight: normal;
}

/* 空状态样式 */
.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-message {
  color: #daa520;
  font-size: 16px;
  font-style: italic;
}
</style>
