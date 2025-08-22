<template>
  <div class="page-content">
    <!-- 特性卡片 -->
    <div v-if="creature.traits.length" class="info-card traits">
      <div class="card-title">✨ 特性</div>
      <div class="traits-list">
        <div v-for="t in creature.traits" :key="t.name" class="trait-item enhanced">
          <div class="trait-name">{{ t.displayName || t.name }}</div>
          <div v-if="t.description" class="trait-description">
            {{ t.description }}
          </div>
        </div>
      </div>
    </div>

    <!-- 攻击方式卡片 -->
    <div v-if="creature.attacks.length" class="info-card attacks">
      <div class="card-title">⚔️ 攻击方式</div>
      <div class="attacks-list">
        <div v-for="atk in creature.attacks" :key="atk.name" class="attack-item">
          <div class="attack-header">
            <span class="attack-name">{{ atk.name }}</span>
            <span class="attack-type">{{ atk.type }} · {{ atk.action }}</span>
          </div>
          <div class="attack-details">
            <div v-if="atk.range" class="attack-stat">
              <span class="stat-label">范围:</span>
              <span class="stat-value">{{ atk.range }}</span>
            </div>
            <div class="attack-stat">
              <span class="stat-label">攻击:</span>
              <span class="stat-value"
                >+{{ atk.attackBonus }} vs {{ atk.target }}</span
              >
            </div>
            <div class="attack-stat">
              <span class="stat-label">伤害:</span>
              <span class="stat-value">{{ atk.damage }}</span>
            </div>
          </div>
          <div v-if="atk.effect" class="attack-effect hit-effect">
            <span class="effect-label">命中效果:</span>
            <span class="effect-text">{{ atk.effect }}</span>
          </div>
          <div v-if="atk.missEffect" class="attack-effect miss-effect">
            <span class="effect-label">失手效果:</span>
            <span class="effect-text">{{ atk.missEffect }}</span>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="!creature.traits.length && !creature.attacks.length"
      class="info-card empty-state"
    >
      <div class="empty-message">该生物没有特性和攻击方式</div>
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

/* 特性列表 */
.traits-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.trait-item {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(139, 69, 19, 0.5);
  border-radius: 6px;
  padding: 12px;
}

.trait-item.enhanced {
  background: linear-gradient(135deg, rgba(61, 36, 21, 0.6), rgba(44, 24, 16, 0.6));
  border: 2px solid rgba(139, 69, 19, 0.7);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.trait-name {
  font-weight: bold;
  color: #ffd700;
  margin-bottom: 8px;
  font-size: 16px;
}

.trait-description {
  color: #e6d3b7;
  font-size: 14px;
  line-height: 1.5;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  border-left: 4px solid #8b4513;
}

/* 攻击列表 */
.attacks-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.attack-item {
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(139, 69, 19, 0.5);
  border-radius: 6px;
  padding: 12px;
}

.attack-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.attack-name {
  font-size: 16px;
  font-weight: bold;
  color: #ffd700;
}

.attack-type {
  font-size: 12px;
  color: #daa520;
  font-style: italic;
}

.attack-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px;
  margin-bottom: 8px;
}

.attack-stat {
  display: flex;
  justify-content: space-between;
}

.stat-label {
  color: #daa520;
  font-size: 13px;
}

.stat-value {
  color: #e6d3b7;
  font-weight: bold;
}

.attack-effect {
  margin-top: 8px;
  padding: 8px;
  border-radius: 4px;
  font-size: 13px;
}

.hit-effect {
  background: rgba(0, 100, 0, 0.2);
  border-left: 4px solid #32cd32;
}

.miss-effect {
  background: rgba(100, 0, 0, 0.2);
  border-left: 4px solid #dc143c;
}

.effect-label {
  font-weight: bold;
  color: #ffd700;
}

.effect-text {
  color: #e6d3b7;
  margin-left: 8px;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .attack-details {
    grid-template-columns: 1fr;
  }
}
</style>
