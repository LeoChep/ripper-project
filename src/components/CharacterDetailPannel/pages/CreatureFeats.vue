<template>
  <div class="page-content">
    <!-- 专长卡片 -->
    <div v-if="creature.feats && creature.feats.length" class="info-card feats">
      <div class="card-title">🎯 专长</div>
      <div class="feats-list">
        <div v-for="feat in creature.feats" :key="feat.name" class="feat-item">
          <div class="feat-name">{{ feat.displayName || feat.name }}</div>
          <div v-if="feat.description" class="feat-description">
            {{ feat.description }}
          </div>
        </div>
      </div>
    </div>

    <div v-if="!creature.feats?.length" class="info-card empty-state">
      <div class="empty-message">该生物没有专长</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Creature } from "@/core/units/Creature";

defineProps<{
  creature: Creature;
}>();
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

/* 专长列表 */
.feats-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feat-item {
  background: linear-gradient(135deg, rgba(61, 36, 21, 0.6), rgba(44, 24, 16, 0.6));
  border: 2px solid rgba(139, 69, 19, 0.7);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.feat-name {
  font-weight: bold;
  color: #ffd700;
  margin-bottom: 8px;
  font-size: 16px;
}

.feat-description {
  color: #e6d3b7;
  font-size: 14px;
  line-height: 1.5;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  border-left: 4px solid #8b4513;
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
