<template>
  <div>
    <!-- 阵型编辑按钮 -->
    <button 
      class="formation-button"
      @click="openFormationEditor"
      :disabled="disabled"
    >
      <div class="button-icon">⚔️</div>
      <div class="button-text">编辑阵型</div>
      <div class="button-shine"></div>
    </button>

    <!-- 阵型编辑器弹窗 -->
    <FormationEditor
      :visible="isFormationEditorVisible"
      @close="closeFormationEditor"
      @save="onFormationSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import FormationEditor from './FormationEditor.vue'

// Props
defineProps<{
  disabled?: boolean
}>()

// Emits
const emit = defineEmits<{
  formationChanged: [formation: any[]]
}>()

// 响应式数据
const isFormationEditorVisible = ref(false)

// 打开阵型编辑器
const openFormationEditor = () => {
  if (!isFormationEditorVisible.value) {
    isFormationEditorVisible.value = true
  }
}

// 关闭阵型编辑器
const closeFormationEditor = () => {
  isFormationEditorVisible.value = false
}

// 保存阵型
const onFormationSave = (formation: any[]) => {
  console.log('阵型已保存:', formation)
  emit('formationChanged', formation)
  closeFormationEditor()
}
</script>

<style scoped>
/* 像素字体 */
/* @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap'); */

.formation-button {
  position: relative;
  background: linear-gradient(145deg, #4a2c17, #8b4513);
  border: 3px solid #ffd700;
  border-radius: 8px;
  padding: 12px 20px;
  cursor: pointer;
  font-family: monospace;
  font-size: 10px;
  color: #ffd700;
  text-shadow: 2px 2px 0px #000;
  box-shadow: 
    0 4px 8px rgba(0, 0, 0, 0.5),
    inset 0 2px 4px rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
  overflow: hidden;
  min-width: 140px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.formation-button:hover {
  background: linear-gradient(145deg, #5a3c27, #9b5513);
  border-color: #ffeb3b;
  transform: translateY(-2px);
  box-shadow: 
    0 6px 12px rgba(0, 0, 0, 0.6),
    inset 0 2px 4px rgba(255, 255, 255, 0.2),
    0 0 20px rgba(255, 235, 59, 0.3);
}

.formation-button:active {
  transform: translateY(0px);
  box-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.5),
    inset 0 2px 4px rgba(0, 0, 0, 0.2);
}

.formation-button:disabled {
  background: linear-gradient(145deg, #3a3a3a, #5a5a5a);
  border-color: #777;
  color: #999;
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.formation-button:disabled:hover {
  transform: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.button-icon {
  font-size: 16px;
  filter: drop-shadow(1px 1px 0px #000);
  animation: glow 2s ease-in-out infinite alternate;
}

.button-text {
  font-size: 8px;
  letter-spacing: 1px;
  line-height: 1.2;
}

.button-shine {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent,
    rgba(255, 255, 255, 0.1),
    transparent
  );
  transform: rotate(45deg);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.formation-button:hover .button-shine {
  opacity: 1;
  animation: shine 0.6s ease-in-out;
}

/* 动画效果 */
@keyframes glow {
  0% {
    filter: drop-shadow(1px 1px 0px #000) drop-shadow(0 0 5px rgba(255, 215, 0, 0.5));
  }
  100% {
    filter: drop-shadow(1px 1px 0px #000) drop-shadow(0 0 15px rgba(255, 215, 0, 0.8));
  }
}

@keyframes shine {
  0% {
    transform: translateX(-100%) translateY(-100%) rotate(45deg);
  }
  100% {
    transform: translateX(100%) translateY(100%) rotate(45deg);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .formation-button {
    padding: 10px 16px;
    min-width: 120px;
  }
  
  .button-icon {
    font-size: 14px;
  }
  
  .button-text {
    font-size: 7px;
  }
}

/* 额外的像素风格装饰 */
.formation-button::before {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  right: 3px;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  border-radius: 1px;
}

.formation-button::after {
  content: '';
  position: absolute;
  bottom: 3px;
  left: 3px;
  right: 3px;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.3), transparent);
  border-radius: 1px;
}

/* 禁用状态的装饰 */
.formation-button:disabled::before,
.formation-button:disabled::after {
  display: none;
}
</style>