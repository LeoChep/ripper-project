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

  <!-- 选择弹窗 -->
  <div v-if="messageStore.dialogConfig" class="dialog-overlay" @click.self="handleOverlayClick">
    <div class="dialog-container" :style="dialogPosition">
      <!-- 确认对话框 -->
      <div v-if="messageStore.dialogConfig.type === 'confirm'" class="confirm-dialog">
        <div class="dialog-message">{{ messageStore.dialogConfig.message }}</div>
        <div class="dialog-buttons">
          <button class="dialog-button cancel-button" @click="handleCancel">
            {{ messageStore.dialogConfig.cancelText || '取消' }}
          </button>
          <button class="dialog-button confirm-button" @click="handleConfirm">
            {{ messageStore.dialogConfig.confirmText || '确认' }}
          </button>
        </div>
      </div>

      <!-- 选择对话框 -->
      <div v-else-if="messageStore.dialogConfig.type === 'select'" class="select-dialog">
        <div class="dialog-message">{{ messageStore.dialogConfig.message }}</div>
        <div class="dialog-options">
          <button 
            v-for="option in messageStore.dialogConfig.options" 
            :key="option.value"
            class="dialog-option"
            @click="handleSelect(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
        <button class="dialog-button cancel-button" @click="handleCancel">
          取消
        </button>
      </div>
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

// 计算对话框位置 - 居中显示
const dialogPosition = computed(() => {
  const gameLeft = 0
  const gameCenterX = gameLeft + appSetting.width / 2
  const gameCenterY = appSetting.height / 2

  return {
    left: `${gameCenterX}px`,
    top: `${gameCenterY}px`,
    transform: 'translate(-50%, -50%)'
  }
})

// 处理确认按钮
const handleConfirm = () => {
  const config = messageStore.dialogConfig
  if (config && config.type === 'confirm') {
    config.onConfirm?.()
  }
  messageStore.closeDialog()
}

// 处理取消按钮
const handleCancel = () => {
  const config = messageStore.dialogConfig
  if (config) {
    config.onCancel?.()
  }
  messageStore.closeDialog()
}

// 处理选择
const handleSelect = (value: string | number) => {
  const config = messageStore.dialogConfig
  if (config && config.type === 'select') {
    config.onSelect?.(value)
  }
  messageStore.closeDialog()
}

// 处理点击遮罩层
const handleOverlayClick = () => {
  // 可选：点击遮罩层关闭对话框
  // handleCancel()
}
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

/* 对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 3000;
  pointer-events: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: overlayFadeIn 0.2s ease-out;
}

@keyframes overlayFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.dialog-container {
  position: fixed;
  z-index: 3001;
  animation: dialogSlideIn 0.3s ease-out;
}

@keyframes dialogSlideIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

.confirm-dialog,
.select-dialog {
  background: linear-gradient(135deg, rgba(30, 30, 40, 0.98), rgba(20, 20, 30, 0.98));
  border-radius: 12px;
  padding: 24px;
  min-width: 320px;
  max-width: 500px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(100, 100, 150, 0.3);
  backdrop-filter: blur(10px);
}

.dialog-message {
  color: #ffffff;
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 24px;
  text-align: center;
  line-height: 1.6;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* 确认对话框按钮 */
.dialog-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.dialog-button {
  padding: 10px 24px;
  border-radius: 8px;
  border: 2px solid transparent;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 100px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.confirm-button {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  border-color: #4CAF50;
}

.confirm-button:hover {
  background: linear-gradient(135deg, #45a049, #3d8b40);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
}

.cancel-button {
  background: linear-gradient(135deg, #666, #555);
  color: white;
  border-color: #666;
}

.cancel-button:hover {
  background: linear-gradient(135deg, #555, #444);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(100, 100, 100, 0.4);
}

/* 选择对话框选项 */
.dialog-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.dialog-option {
  padding: 14px 20px;
  border-radius: 8px;
  border: 2px solid rgba(100, 100, 150, 0.4);
  background: linear-gradient(135deg, rgba(60, 60, 80, 0.6), rgba(50, 50, 70, 0.6));
  color: white;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.dialog-option:hover {
  background: linear-gradient(135deg, rgba(80, 80, 120, 0.8), rgba(70, 70, 110, 0.8));
  border-color: rgba(120, 120, 180, 0.6);
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(100, 100, 150, 0.3);
}

.dialog-option:active {
  transform: translateX(2px);
}

/* 响应式设计 */
@media (max-width: 600px) {
  .confirm-dialog,
  .select-dialog {
    min-width: 280px;
    padding: 20px;
  }

  .dialog-message {
    font-size: 16px;
  }

  .dialog-button,
  .dialog-option {
    font-size: 14px;
    padding: 10px 16px;
  }
}
</style>
