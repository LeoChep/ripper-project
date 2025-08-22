<template>
  <div class="page-content">
    <!-- 能力值卡片 -->
    <div v-if="creature.abilities" class="info-card abilities">
      <div class="card-title">属性</div>
      <div class="abilities-grid">
        <div
          v-for="(ability, name) in creature.abilities"
          :key="name"
          class="ability-item"
        >
          <div class="ability-name">{{ name }}</div>
          <div class="ability-score">{{ ability.value }}</div>
          <div class="ability-modifier">
            ({{ ability.modifier >= 0 ? "+" : "" }}{{ ability.modifier }})
          </div>
        </div>
      </div>
    </div>

    <!-- 生命值和防御卡片 -->
    <div class="info-card combat-stats">
      <div class="card-title">战斗数据</div>
      <div class="hp-display">
        <div class="hp-bar">
          <div
            class="hp-fill"
            :style="{
              width:
                (creature.hp / (creature.hp + (creature.bloodied || 0))) * 100 +
                '%',
            }"
          ></div>
          <div class="hp-text">
            HP: {{ creature.hp }} (重伤: {{ creature.bloodied }})
          </div>
        </div>
      </div>
      <div class="defense-grid">
        <div class="defense-item ac">
          <div class="defense-label">护甲等级</div>
          <div class="defense-value">{{ creature.ac }}</div>
        </div>
        <div class="defense-item fort">
          <div class="defense-label">强韧</div>
          <div class="defense-value">{{ creature.fortitude }}</div>
        </div>
        <div class="defense-item reflex-def">
          <div class="defense-label">反射</div>
          <div class="defense-value">{{ reflex }}</div>
        </div>
        <div class="defense-item will-def">
          <div class="defense-label">意志</div>
          <div class="defense-value">{{ will }}</div>
        </div>
      </div>
    </div>

    <!-- 抗性和免疫卡片 -->
    <div
      v-if="creature.immunities.length || creature.resistances.length"
      class="info-card resistances"
    >
      <div class="card-title">抗性与免疫</div>
      <div v-if="creature.immunities.length" class="resistance-group">
        <div class="resistance-type immunity">
          <span class="resistance-icon">🛡️</span>
          <span class="resistance-label">免疫:</span>
          <span class="resistance-values">{{
            creature.immunities.join(", ")
          }}</span>
        </div>
      </div>
      <div v-if="creature.resistances.length" class="resistance-group">
        <div class="resistance-type resistance">
          <span class="resistance-icon">🔰</span>
          <span class="resistance-label">抗性:</span>
          <span class="resistance-values">
            <span
              v-for="r in creature.resistances"
              :key="r.type"
              class="resist-item"
            >
              {{ r.type }} {{ r.value }}
            </span>
          </span>
        </div>
      </div>
    </div>

    <!-- 技能卡片 -->
    <div v-if="creature.skills.length" class="info-card skills">
      <div class="card-title">技能</div>
      <div class="skills-grid">
        <div v-for="s in creature.skills" :key="s.name" class="skill-item">
          <span class="skill-name">{{ s.name }}</span>
          <span class="skill-bonus">+{{ s.bonus }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Creature } from "@/core/units/Creature";

defineProps<{
  creature: Creature;
  reflex: string;
  will: string;
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

/* 生命值显示 */
.hp-display {
  margin-bottom: 16px;
}

.hp-bar {
  position: relative;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid #8b4513;
  border-radius: 8px;
  height: 32px;
  overflow: hidden;
}

.hp-fill {
  height: 100%;
  background: linear-gradient(135deg, #dc143c, #ff4500, #dc143c);
  transition: width 0.3s ease;
}

.hp-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  font-size: 14px;
}

/* 防御值网格 */
.defense-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.defense-item {
  text-align: center;
  padding: 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  border: 1px solid rgba(139, 69, 19, 0.5);
}

.defense-label {
  font-size: 12px;
  color: #daa520;
  margin-bottom: 4px;
}

.defense-value {
  font-size: 18px;
  color: #ffd700;
  font-weight: bold;
}

/* 能力值网格 */
.abilities-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}

.ability-item {
  text-align: center;
  padding: 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  border: 1px solid rgba(139, 69, 19, 0.5);
}

.ability-name {
  font-size: 12px;
  color: #daa520;
  margin-bottom: 4px;
  font-weight: bold;
}

.ability-score {
  font-size: 16px;
  color: #ffd700;
  font-weight: bold;
}

.ability-modifier {
  font-size: 12px;
  color: #e6d3b7;
  margin-top: 2px;
}

/* 抗性和免疫 */
.resistance-group {
  margin-bottom: 12px;
}

.resistance-type {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #e6d3b7;
}

.resistance-icon {
  font-size: 18px;
}

.resistance-label {
  font-weight: bold;
  color: #daa520;
  min-width: 50px;
}

.resistance-values {
  flex: 1;
}

.resist-item {
  display: inline-block;
  background: rgba(0, 0, 0, 0.3);
  padding: 2px 8px;
  border-radius: 4px;
  margin-right: 8px;
  border: 1px solid rgba(139, 69, 19, 0.5);
}

/* 技能网格 */
.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
}

.skill-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  border: 1px solid rgba(139, 69, 19, 0.5);
}

.skill-name {
  color: #e6d3b7;
  font-size: 13px;
}

.skill-bonus {
  color: #ffd700;
  font-weight: bold;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .defense-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .abilities-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 480px) {
  .abilities-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
