<template>
  <transition name="fade">
    <div v-if="isVisible" class="turn-announcement-wrapper">
      <div class="turn-announcement-content">
        <img :src="currentImage" class="turn-image" alt="turn announcement" />
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref } from "vue";
import * as InitSystem from "@/core/system/InitiativeSystem";
const isVisible = ref(false);
const currentImage = ref("");

// 显示玩家回合动画
function showPlayerTurn() {
  currentImage.value = "/src/assets/ui/player-turn.png";
  showAnimation();
}

// 显示敌方回合动画
function showEnemyTurn() {
  currentImage.value = "/src/assets/ui/enemy-turn.png";
  showAnimation();
}

InitSystem.playPlayerTurnAnnouncementAnimHandles.push(showPlayerTurn);
InitSystem.playEnemyTurnAnnouncementAnimHandles.push(showEnemyTurn);
function showAnimation() {
  isVisible.value = true;
  setTimeout(() => {
    isVisible.value = false;
  }, 1500);
}

defineExpose({
  showPlayerTurn,
  showEnemyTurn,
});
</script>

<style scoped>
.turn-announcement-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 9999;
  background: transparent;
}

.turn-announcement-content {
  position: relative;
  animation: slideInFromLeft 0.6s ease-out;
}

.turn-image {
  width: 280px;
  height: 160px;
  object-fit: contain;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5));
}

/* 从左到右泡沫渐变出现动画 */
@keyframes slideInFromLeft {
  0% {
    transform: translateX(-100px) scale(0.8);
    opacity: 0;
    filter: blur(10px);
  }
  50% {
    filter: blur(5px);
  }
  100% {
    transform: translateX(0) scale(1);
    opacity: 1;
    filter: blur(0);
  }
}

/* 淡出动画 */
.fade-enter-active {
  animation: slideInFromLeft 0.6s ease-out;
}

.fade-leave-active {
  transition: opacity 0.4s ease-out;
}

.fade-leave-to {
  opacity: 0;
}
</style>
