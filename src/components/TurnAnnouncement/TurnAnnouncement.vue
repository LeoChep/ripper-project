<template>
  <transition name="fade">
    <div v-if="isVisible" class="turn-announcement-wrapper">
      <div ref="contentRef" class="turn-announcement-content">
        <img :src="currentImage" class="turn-image" alt="turn announcement" />
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, nextTick } from "vue";
import * as InitSystem from "@/core/system/InitiativeSystem";
import playerTurnImg from "@/assets/ui/player-turn.png";
import enemyTurnImg from "@/assets/ui/enemy-turn.png";
import { appSetting } from "@/core/envSetting";
const isVisible = ref(false);
const currentImage = ref("");
const contentRef = ref<HTMLDivElement | null>(null);

// 缓动函数 - 自由落体加速（更平缓）
function easeInCubic(t: number): number {
  return t * t * t;
}

// 缓动函数 - 向上飞出减速
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// 阻尼振动函数
function dampedOscillation(t: number, frequency: number, damping: number): number {
  return Math.exp(-damping * t) * Math.cos(frequency * t);
}

// 显示玩家回合动画
async function showPlayerTurn() {
  currentImage.value = playerTurnImg;
  await showAnimation();
}

// 显示敌方回合动画
async function showEnemyTurn() {
  currentImage.value = enemyTurnImg;
  await showAnimation();
}

InitSystem.playPlayerTurnAnnouncementAnimHandles.push(showPlayerTurn);
InitSystem.playEnemyTurnAnnouncementAnimHandles.push(showEnemyTurn);

async function showAnimation() {
  isVisible.value = true;

  // 等待 DOM 渲染完成
  await nextTick();

  const element = contentRef.value;
  if (!element) return;

  const dropDuration = 700; // 下落时间（毫秒）
  const shakeDuration = 500; // 晃动时间（毫秒）
  const flyDuration = 600; // 飞出时间（毫秒）- 增加时长使动画更流畅

  const startTime = performance.now(); // 使用 performance.now() 获得更高精度
  let animationId: number;

  // 创建 Promise 在动画结束时 resolve
  return new Promise<void>((resolve) => {
    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      if (!element) {
        resolve();
        return;
      }

      if (elapsed < dropDuration) {
        // 阶段1：自由落体下落
        const progress = elapsed / dropDuration;
        const easedProgress = easeInCubic(progress);
        const translateY = -300 + 300 * easedProgress;
        element.style.transform = `translateY(${translateY}px) rotate(0deg)`;
        element.style.opacity = String(Math.min(1, progress * 1.5));
        animationId = requestAnimationFrame(animate);
      } else if (elapsed < dropDuration + shakeDuration) {
        // 阶段2：阻尼振动晃动
        const shakeProgress = (elapsed - dropDuration) / shakeDuration;
        const angle = dampedOscillation(shakeProgress * 6, 12, 3) * 25;
        const verticalBounce =
          Math.exp(-shakeProgress * 2.5) * Math.sin(shakeProgress * 20) * 12;
        element.style.transform = `translateY(${verticalBounce}px) rotate(${angle}deg)`;
        element.style.opacity = "1";
        animationId = requestAnimationFrame(animate);
      } else if (elapsed < dropDuration + shakeDuration + flyDuration) {
        // 阶段3：向上飞出（使用更平滑的缓动）
        const flyProgress = (elapsed - dropDuration - shakeDuration) / flyDuration;
        const easedFlyProgress = easeOutCubic(flyProgress);
        const translateY = -450 * easedFlyProgress; // 增加飞出距离
        const scale = 1 - flyProgress * 0.15; // 减少缩放幅度
        const opacity = Math.max(0, 1 - Math.pow(flyProgress, 1.2) * 1.3); // 使用指数函数使淡出更平滑

        element.style.transform = `translateY(${translateY}px) rotate(0deg) scale(${scale})`;
        element.style.opacity = String(opacity);
        element.style.willChange = "transform, opacity"; // 提示浏览器优化性能

        animationId = requestAnimationFrame(animate);
      } else {
        // 动画结束
        element.style.willChange = "auto";
        isVisible.value = false;
        resolve(); // 动画完成，resolve Promise
      }
    }

    animationId = requestAnimationFrame(animate);
  });
}

defineExpose({
  showPlayerTurn,
  showEnemyTurn,
});
</script>

<style scoped>
.turn-announcement-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: v-bind('appSetting.width + "px"');
  height: v-bind('appSetting.height + "px"');
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 9999;
  background: transparent;
}

.turn-announcement-content {
  position: relative;
}

.turn-announcement-content.leaving {
  animation: none;
}

.turn-image {
  width: 320px;
  height: 140px;
  /* object-fit: contain; */
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5));
}

.fade-enter-active,
.fade-leave-active {
  transition: none;
}
</style>
