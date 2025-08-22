<template>
  <div class="page-content">
    <!-- 装备卡片 -->
    <div v-if="creature.equipment.length" class="info-card equipment">
      <div class="card-title">🎒 装备</div>
      <div class="equipment-list enhanced">
        <div
          v-for="(item, index) in creature.equipment"
          :key="index"
          class="equipment-item"
        >
          {{ item }}
        </div>
      </div>
    </div>

    <!-- 武器卡片 -->
    <div
      v-if="creature.weapons && creature.weapons.length"
      class="info-card weapons"
    >
      <div class="card-title">⚔️ 武器</div>
      <div class="weapons-list">
        <div
          v-for="weapon in creature.weapons"
          :key="weapon.name"
          class="weapon-item"
        >
          <div class="weapon-header">
            <span class="weapon-name">{{ weapon.name }}</span>
            <span class="weapon-type">{{ weapon.type }}</span>
          </div>
          <div class="weapon-stats">
            <div class="weapon-stat">
              <span class="stat-label">伤害:</span>
              <span class="stat-value">{{ weapon.damage }}</span>
            </div>
            <div class="weapon-stat">
              <span class="stat-label">攻击加值:</span>
              <span class="stat-value">+{{ weapon.bonus }}</span>
            </div>
            <div v-if="weapon.range" class="weapon-stat">
              <span class="stat-label">射程:</span>
              <span class="stat-value">{{ weapon.range }}</span>
            </div>
            <div v-if="weapon.weight" class="weapon-stat">
              <span class="stat-label">重量:</span>
              <span class="stat-value">{{ weapon.weight }}</span>
            </div>
            <div v-if="weapon.cost" class="weapon-stat">
              <span class="stat-label">价格:</span>
              <span class="stat-value">{{ weapon.cost }}</span>
            </div>
          </div>
          <div
            v-if="weapon.properties && weapon.properties.length"
            class="weapon-properties"
          >
            <span class="props-label">属性:</span>
            <span class="props-list">{{ weapon.properties.join(", ") }}</span>
          </div>
          <div v-if="weapon.description" class="weapon-description">
            {{ weapon.description }}
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="!creature.equipment?.length && !creature.weapons?.length"
      class="info-card empty-state"
    >
      <div class="empty-message">该生物没有装备和武器</div>
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

/* 装备列表增强 */
.equipment-list.enhanced {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.equipment-list.enhanced .equipment-item {
  background: linear-gradient(135deg, rgba(61, 36, 21, 0.4), rgba(44, 24, 16, 0.4));
  border: 1px solid rgba(139, 69, 19, 0.6);
  border-radius: 6px;
  padding: 8px 12px;
  color: #e6d3b7;
  font-size: 14px;
  text-align: center;
  transition: all 0.2s;
}

.equipment-list.enhanced .equipment-item:hover {
  background: linear-gradient(135deg, rgba(139, 69, 19, 0.3), rgba(218, 165, 32, 0.2));
  color: #ffd700;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

/* 武器列表 */
.weapons-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.weapon-item {
  background: linear-gradient(135deg, rgba(61, 36, 21, 0.6), rgba(44, 24, 16, 0.6));
  border: 2px solid rgba(139, 69, 19, 0.7);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.weapon-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.weapon-name {
  font-size: 16px;
  font-weight: bold;
  color: #ffd700;
}

.weapon-type {
  font-size: 12px;
  color: #daa520;
  font-style: italic;
}

.weapon-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
  margin-bottom: 8px;
}

.weapon-stat {
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

.weapon-properties {
  margin-top: 8px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  border-left: 3px solid #8b4513;
}

.props-label {
  font-weight: bold;
  color: #daa520;
  margin-right: 8px;
}

.props-list {
  color: #e6d3b7;
}

.weapon-description {
  margin-top: 8px;
  color: #e6d3b7;
  font-size: 14px;
  line-height: 1.5;
  padding: 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  border-left: 3px solid #8b4513;
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
