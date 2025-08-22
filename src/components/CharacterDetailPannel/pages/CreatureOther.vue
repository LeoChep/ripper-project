<template>
  <div class="page-content">
    <!-- 语言信息卡片 -->
    <div v-if="creature.languages.length" class="info-card languages">
      <div class="card-title">🗣️ 语言</div>
      <div class="languages-display">
        <div
          v-for="(language, index) in creature.languages"
          :key="index"
          class="language-item"
        >
          {{ language }}
        </div>
      </div>
    </div>

    <!-- 备注信息卡片 -->
    <div v-if="creature.notes.length" class="info-card notes-card">
      <div class="card-title">📝 备注</div>
      <div class="notes-list enhanced">
        <div
          v-for="(note, index) in creature.notes"
          :key="index"
          class="note-item enhanced"
        >
          <div class="note-content">{{ note }}</div>
        </div>
      </div>
    </div>

    <div
      v-if="!creature.languages?.length && !creature.notes?.length"
      class="info-card empty-state"
    >
      <div class="empty-message">该生物没有其他信息</div>
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

/* 语言显示 */
.languages-display {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.language-item {
  background: linear-gradient(135deg, rgba(61, 36, 21, 0.6), rgba(44, 24, 16, 0.6));
  border: 2px solid rgba(139, 69, 19, 0.7);
  border-radius: 8px;
  padding: 12px 16px;
  color: #ffd700;
  font-size: 14px;
  font-weight: bold;
  text-align: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.2s;
}

.language-item:hover {
  background: linear-gradient(135deg, rgba(139, 69, 19, 0.4), rgba(218, 165, 32, 0.3));
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
}

/* 备注卡片增强 */
.notes-list.enhanced {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.note-item.enhanced {
  background: linear-gradient(135deg, rgba(61, 36, 21, 0.6), rgba(44, 24, 16, 0.6));
  border: 2px solid rgba(139, 69, 19, 0.7);
  border-left: 6px solid #8b4513;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.2s;
}

.note-item.enhanced:hover {
  background: linear-gradient(135deg, rgba(139, 69, 19, 0.4), rgba(218, 165, 32, 0.2));
  transform: translateX(4px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
}

.note-content {
  color: #e6d3b7;
  font-size: 14px;
  line-height: 1.6;
  text-align: justify;
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
  .languages-display {
    justify-content: center;
  }

  .language-item {
    flex: 1;
    min-width: 100px;
    max-width: calc(50% - 6px);
  }
}
</style>
