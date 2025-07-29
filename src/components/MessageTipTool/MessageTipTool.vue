<template>
  <div 
    v-if="messageStore.message" 
    class="message-tip-tool"
    :class="{ 'fade-in': messageStore.message }"
    :style="tipPosition"
  >
    <div class="tip-content">
      {{ messageStore.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMessageStore } from '@/stores/message'
import { appSetting } from '@/core/envSetting'

const messageStore = useMessageStore()

// 计算基于游戏窗体的位置
const tipPosition = computed(() => {
  // 游戏窗体靠左显示，所以左边界从0开始
  const gameLeft = 0
  // 计算游戏窗体内的中心位置
  const gameCenterX = gameLeft + appSetting.width / 2  // 1600 / 2 = 800px
  
  return {
    left: `${gameCenterX}px`,
    transform: 'translateX(-50%)',
    top: '80px'
  }
})
</script>

<style scoped>
.message-tip-tool {
  position: fixed;
  z-index: 1000;
  pointer-events: none;
  transition: opacity 0.3s ease-in-out;
  width: fit-content;
}

.tip-content {
  background: rgba(0, 0, 0, 0.75);
  color: #ffffff;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  text-align: center;
  min-width: 200px;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  /* 确保不超出游戏窗体宽度 */
  word-wrap: break-word;
}

.fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* 响应式设计 - 基于游戏窗体尺寸 */
@media (max-width: 1600px) {
  .tip-content {
    font-size: 14px;
    padding: 10px 16px;
    max-width: 300px;
  }
}
</style>
