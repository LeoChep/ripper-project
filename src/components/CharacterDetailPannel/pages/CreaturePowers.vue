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
        >
          <div class="power-header">
            <div class="power-name">{{ power.displayName }}</div>
            <div v-if="power.subName" class="power-subname">
              ({{ power.subName }})
            </div>
          </div>
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
              <span class="stat-value">{{
                getActionTypeText(power.actionType)
              }}</span>
            </div>
            <div v-if="power.powersource" class="power-stat">
              <span class="stat-label">能量源:</span>
              <span class="stat-value">{{ power.powersource }}</span>
            </div>
          </div>
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
        </div>
      </div>
    </div>
    <div v-else class="info-card empty-state">
      <div class="empty-message">该生物没有威能</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Creature } from "@/core/units/Creature";

defineProps<{
  creature: Creature;
}>();

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
  };
  return typeMap[type] || type;
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
  gap: 12px;
  margin-bottom: 12px;
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
