<template>
  <!-- 顶部提示窗体 -->
  <div v-show="displayFlag" class="message-tip-tool top-tip" :class="{ 'fade-in': displayFlag }"
    :style="tipPosition">
    <div class="tip-content">
      {{ displayMessage }}
    </div>
  </div>

  <!-- 底部显示窗体 -->
  <div v-if="messageStore.bottomMessage" class="message-tip-tool bottom-tip"
    :class="{ 'fade-in': messageStore.bottomMessage }" :style="bottomTipPosition">
    <div class="bottom-content">
      {{ messageStore.bottomMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useMessageStore } from '@/stores/message'
import { useInitiativeStore } from '@/stores/initiativeStore'
import { appSetting } from '@/core/envSetting'

import * as InitSystem from "@/core/system/InitiativeSystem";
import { UnitSystem } from '@/core/system/UnitSystem';
const messageStore = useMessageStore()

const displayFlag=ref(false);
// 计算要显示的消息
const displayMessage = ref("")
onMounted(() => {
  // 初始化时清除消息
  messageStore.clearMessages()
  setInterval(() => {
    if (messageStore.message!="") {
      displayMessage.value = messageStore.message
    }
    else {
      displayMessage.value = ""
      const unit = InitSystem.getPointAtUnit();
      if (unit) {

        if (unit.party !== 'player') {
          displayMessage.value = unit.creature?.name + `正在行动中`;
        }
      }
    }

    if (displayMessage.value!="")
    {
      displayFlag.value=true;
    }
    else
    {
      displayFlag.value=false;
    }
  }, 100) // 每10秒清除一次消息
})
// 计算基于游戏窗体的位置 - 顶部提示
const tipPosition = computed(() => {
  // 游戏窗体靠左显示，所以左边界从0开始
  const gameLeft = 0
  // 计算游戏窗体内的中心位置
  const gameCenterX = gameLeft + appSetting.width / 2  // 1600 / 2 = 800px

  return {
    left: `${gameCenterX}px`,
    transform: 'translateX(-50%)',
    top: '120px'
  }
})

// 计算基于游戏窗体的位置 - 底部提示
const bottomTipPosition = computed(() => {
  const gameLeft = 0
  const gameCenterX = gameLeft + appSetting.width / 2  // 1600 / 2 = 800px
  const gameBottom = appSetting.height - 220  // 距离游戏窗体底部200

  return {
    left: `${gameCenterX}px`,
    transform: 'translateX(-50%)',
    top: `${gameBottom}px`
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

/* 顶部提示窗体样式 */
.top-tip .tip-content {
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
  word-wrap: break-word;
}

/* 底部显示窗体样式 - 使用与顶部相同的样式 */
.bottom-tip .bottom-content {
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

/* 底部窗体的特殊动画 */
.bottom-tip.fade-in {
  animation: slideUpFadeIn 0.4s ease-out;
}

@keyframes slideUpFadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* 响应式设计 - 基于游戏窗体尺寸 */
@media (max-width: 1600px) {

  .top-tip .tip-content,
  .bottom-tip .bottom-content {
    font-size: 14px;
    padding: 10px 16px;
    max-width: 300px;
  }
}
</style>
