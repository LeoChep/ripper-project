<template>
  <div class="init-bar-wrapper" :style="{ '--init-avatarbox-bg': `url(${initAvatarBoxImg})` }">
    <div class="init-bar-scroll" :class="{ 'dragging-active': isDragging }" ref="scrollContainer" @wheel="onWheel"
      @mousemove="onMouseMove">
      <div v-for="(unit, index) in previewUnits" :id="`init-${unit.id}`" :key="unit.id"
        :class="['init-bar-item', { 'is-dragging': isDragging && draggedUnitId === unit.id, 'is-drop-target': isDropTarget(unit.originalIndex), 'preview-position': isDragging && unit.originalIndex !== index }]"
        v-show="isAllLoaded">
        <img :id="`init-cursor-${unit.id}`" :src="initCursorImg" class="init-cursor" alt="cursor"
          @mousedown.stop="onDelayStart(unit, $event)" />
        <div :class="['init-bar-avatarbox', unit.party === 'player' ? 'ally' : 'enemy']">
          <img :src="getAvatar(unit.unitTypeName)" class="init-bar-avatar" :alt="unit.name" />
        </div>
        <!-- 预览位置索引 - 显示先攻值 -->
        <div v-if="isDragging && unit.originalIndex !== index" class="preview-index">
          {{ unit.initiative?.initativeValue?.toFixed(1) || 0 }}
        </div>
        <!-- 延迟按钮 - 只在当前回合单位上显示 -->
        <button :id="`delay-button-${unit.id}`" v-if="!isDragging" class="delay-button"
          @mousedown.stop="onDelayStart(unit, $event)">
          延迟
        </button>
        <!-- <div v-if="isDragging && draggedUnitId === unit.id" class="drag-tip">
          移动鼠标选择位置，点击确认
        </div> -->
        <!-- <div class="init-bar-name">{{ unit.name }}</div> -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { currentInit, useInitiativeStore } from "@/stores/initiativeStore";
import { getUnitAvatar } from "@/utils/utils";
import * as InitSystem from "@/core/system/InitiativeSystem";
import initCursorImg from "@/assets/ui/init-cursor.png";
import initAvatarBoxImg from "@/assets/ui/init-avtarbox2.png";
import delayButtonImg from "@/assets/ui/delay-button.png";
import { appSetting } from "@/core/envSetting";
import type { Unit } from "@/class/Unit";
import { UnitSystem } from "@/core/system/UnitSystem";
import { CharacterCombatController } from "@/core/controller/CharacterCombatController";
import { CharacterCombatDelayControlle } from "@/core/controller/CharacterCombatDelayControlle";

const scrollContainer = ref<HTMLDivElement | null>(null);
const initiativeStore = useInitiativeStore();
const isAvatarBoxLoaded = ref(false);
const isCursorLoaded = ref(false);
const loadedAvatarCount = ref(0);

// 拖拽相关状态
const isDragging = ref(false);
const draggedUnitId = ref<number | null>(null);
const draggedFromIndex = ref<number | null>(null);
const dropTargetIndex = ref<number | null>(null);

// 预加载框体图片资源
const avatarBoxImg = new Image();
avatarBoxImg.onload = () => {
  isAvatarBoxLoaded.value = true;
};
avatarBoxImg.src = initAvatarBoxImg;

const cursorImg = new Image();
cursorImg.onload = () => {
  isCursorLoaded.value = true;
};
cursorImg.src = initCursorImg;

InitSystem.loadBattleUIhandles.push(() => {
  initiativeStore.initializeInitiative();
});
InitSystem.removeFromInitiativehandles.push(() => {
  initiativeStore.initializeInitiative();
});
// 假设 store 中有 sortedUnits，包含 { id, avatar, name } 按先攻顺序排列
const units = computed(() => initiativeStore.sortedUnits);
const currentUnit = computed(() => initiativeStore.getOwner);
const currentUnitId = computed(() => initiativeStore.currentUnitId);

// 预览单位顺序 - 在拖拽时显示拖动后的排列
const previewUnits = computed(() => {
  const unitsArray = units.value.map((unit, idx) => ({
    ...unit,
    originalIndex: idx
  }));

  if (!isDragging.value || draggedFromIndex.value === null || dropTargetIndex.value === null) {
    return unitsArray;
  }

  const fromIndex = draggedFromIndex.value;
  const toIndex = dropTargetIndex.value;

  if (fromIndex === toIndex) {
    return unitsArray;
  }

  // 创建预览数组
  const preview = [...unitsArray];
  const [draggedUnit] = preview.splice(fromIndex, 1);
  preview.splice(toIndex, 0, draggedUnit);

  return preview;
});
// 监听units变化，预加载所有头像
watch(
  units,
  (newUnits) => {
    if (!newUnits || newUnits.length === 0) {
      loadedAvatarCount.value = 0;
      return;
    }

    loadedAvatarCount.value = 0;
    let loadedCount = 0;

    newUnits.forEach((unit: any) => {
      const avatarImg = new Image();
      avatarImg.onload = () => {
        loadedCount++;
        loadedAvatarCount.value = loadedCount;
      };
      avatarImg.onerror = () => {
        loadedCount++;
        loadedAvatarCount.value = loadedCount;
      };
      avatarImg.src = getAvatar(unit.unitTypeName);
    });
  },
  { immediate: true }
);

// 所有资源加载完成后才显示
const isAllLoaded = computed(() => {
  return (
    isAvatarBoxLoaded.value &&
    isCursorLoaded.value &&
    loadedAvatarCount.value === units.value.length &&
    units.value.length > 0
  );
});

const isCurrentUnit = (unit: any) => {
  return currentInit.currentUnitId === unit.id;
};
const lastUnitId = ref<number | null>(null);
setInterval(() => {

  const currentUnitId = InitSystem.getPointAtUnit()?.id || null;
  const unit = UnitSystem.getInstance().getUnitById(currentUnitId?.toString() || '');
  if (isAllLoaded.value && currentUnitId && scrollContainer.value) {
    if (lastUnitId.value) {
      const lastUnitElement = document.getElementById(`init-${lastUnitId.value}`);
      if (lastUnitElement) {
        lastUnitElement.classList.remove("is-current");
      }
      const lastCursorElement = document.getElementById(
        `init-cursor-${lastUnitId.value}`
      );

      if (lastCursorElement) {
        lastCursorElement.style.display = "none";
      }
      const lastDelayButton = document.getElementById(
        `delay-button-${lastUnitId.value}`
      );
      if (lastDelayButton) {
        lastDelayButton.style.display = "none";
      }
    }

    const currentUnitElement = document.getElementById(`init-${currentUnitId}`);
    if (currentUnitElement) {
      currentUnitElement.classList.add("is-current");
    }
    const currentDelayButton = document.getElementById(`delay-button-${currentUnitId}`);
    if (unit?.party === 'player') {
      if (currentDelayButton) {
        currentDelayButton.style.display = "block";
      }
    }

    const currentCursorElement = document.getElementById(`init-cursor-${currentUnitId}`);
    if (currentCursorElement) {
      currentCursorElement.style.display = "block";
    }
    lastUnitId.value = currentUnitId;
  }
}, 500);
const getAvatar = (unitTypeName: string) => {
  return getUnitAvatar(unitTypeName);
};

function onWheel(e: WheelEvent) {
  e.preventDefault();
  if (scrollContainer.value) {
    scrollContainer.value.scrollLeft += e.deltaY > 0 ? 60 : -60;
  }
}

// 延迟按钮按下事件 - 开始拖拽
function onDelayStart(unit: any, event?: MouseEvent) {
  if (event) {
    event.preventDefault(); // 阻止默认的文本选择行为
  }
  isDragging.value = true;
  draggedUnitId.value = unit.id;
  const currentIndex = units.value.findIndex((u) => u.id === unit.id);
  draggedFromIndex.value = currentIndex;
  dropTargetIndex.value = currentIndex; // 默认目标位置为当前位置
  CharacterCombatController.getInstance().useDelayController()
  // 监听ESC键取消
  document.addEventListener('keydown', onEscapeKey);
  // 监听右键取消
  document.addEventListener('contextmenu', onRightClick);
  // 监听鼠标释放（在document上，支持容器外释放）
  document.addEventListener('mouseup', onDelayEnd);
}

// ESC键取消拖拽
function onEscapeKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && isDragging.value) {
    resetDragState();
    cancelDelay();
  }
}

// 鼠标移动事件 - 计算应该插入的位置
function onMouseMove(e: MouseEvent) {
  if (!isDragging.value || !scrollContainer.value) return;

  // 使用绝对鼠标位置
  const mouseX = e.clientX;

  // 遍历原始顺序的单位，基于它们的原始索引计算位置
  let closestIndex = draggedFromIndex.value ?? 0;
  let minDistance = Infinity;

  // 使用 previewUnits 但根据 originalIndex 来判断
  previewUnits.value.forEach((unit) => {
    const element = document.getElementById(`init-${unit.id}`);
    if (element) {
      const rect = element.getBoundingClientRect();
      // 头像中轴线的绝对位置
      const elementCenterX = rect.left + rect.width / 2;
      const distance = Math.abs(mouseX - elementCenterX);

      // 使用原始索引来避免循环依赖
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = unit.originalIndex;
      }
    }
  });

  // 如果指针在自己当前位置上，不进行预览变化
  if (closestIndex === draggedFromIndex.value) {
    return;
  }

  // 只在索引真正改变时才更新，减少不必要的重渲染
  if (dropTargetIndex.value !== closestIndex) {
    dropTargetIndex.value = closestIndex;
  }
}

/**
 * 计算目标拖拽先攻值
 * @param fromIndex 原始位置索引
 * @param targetIndex 目标位置索引
 * @param sortedUnits 排序后的单位列表
 * @returns 计算出的先攻值，如果无法计算则返回null
 */
function calculateDelayToNumber(fromIndex: number, targetIndex: number, sortedUnits: any[]): number | null {
  const targetUnit = sortedUnits[targetIndex];

  if (!targetUnit || !targetUnit.initiative) {
    console.error("Target unit doesn't have initiative value");
    return null;
  }

  let delayToNumber: number;

  if (targetIndex > fromIndex) {
    // 向后拖动（延迟）
    if (targetIndex === sortedUnits.length - 1) {
      // 拖到最后一位
      delayToNumber = targetUnit.initiative.initativeValue - 1;
    } else {
      // 插入到目标位置和下一位之间
      const nextUnit = sortedUnits[targetIndex + 1];
      if (nextUnit.initiative) {
        delayToNumber = (targetUnit.initiative.initativeValue + nextUnit.initiative.initativeValue) / 2;
      } else {
        delayToNumber = targetUnit.initiative.initativeValue - 0.01;
      }
    }
  } else {
    // 向前拖动
    if (targetIndex === 0) {
      // 拖到第一位
      delayToNumber = targetUnit.initiative.initativeValue + 1;
    } else {
      // 插入到前一位和目标位置之间
      const prevUnit = sortedUnits[targetIndex - 1];
      if (prevUnit.initiative) {
        delayToNumber = (prevUnit.initiative.initativeValue + targetUnit.initiative.initativeValue) / 2;
      } else {
        delayToNumber = targetUnit.initiative.initativeValue + 0.01;
      }
    }
  }

  return delayToNumber;
}

// 鼠标释放 - 完成拖拽
function onDelayEnd(e: MouseEvent) {
  if (!isDragging.value) return;

  if (draggedFromIndex.value === null || dropTargetIndex.value === null || draggedUnitId.value === null) {
    resetDragState();
    return;
  }

  const fromIndex = draggedFromIndex.value;
  const targetIndex = dropTargetIndex.value;

  if (fromIndex === targetIndex) {
    resetDragState();
    return;
  }

  // 计算目标先攻值
  const delayToNumber = calculateDelayToNumber(fromIndex, targetIndex, units.value);

  if (delayToNumber === null) {
    resetDragState();
    return;
  }
  //使用delay控制器完成延迟操作
  CharacterCombatDelayControlle.getInstence().resolve({ unitId: draggedUnitId.value, delayToNumber: delayToNumber });

  // 重新初始化store中的数据
  initiativeStore.initializeInitiative();

  resetDragState();
}

// 右键取消拖拽
function onRightClick(e: MouseEvent) {
  if (isDragging.value) {
    e.preventDefault();
    resetDragState();
    cancelDelay();
  }
}
function cancelDelay() {
  CharacterCombatDelayControlle.getInstence().resolve({ cancel: true });
}
// 重置拖拽状态
function resetDragState() {
  isDragging.value = false;
  draggedUnitId.value = null;
  draggedFromIndex.value = null;
  dropTargetIndex.value = null;

  document.removeEventListener('keydown', onEscapeKey);
  document.removeEventListener('contextmenu', onRightClick);
  document.removeEventListener('mouseup', onDelayEnd);
}

// 判断是否为放置目标（使用原始索引判断）
function isDropTarget(originalIndex: number) {
  return isDragging.value && dropTargetIndex.value === originalIndex && draggedFromIndex.value !== originalIndex;
}
</script>

<style scoped>
.init-bar-wrapper {
  width: v-bind('appSetting.width + "px"');
  position: absolute;
  top: 0;
  left: 0;
  z-index: 100;
  background: transparent;
  padding: 8px 0 60px 0;
  display: flex;
  justify-content: center;
  pointer-events: none;
}

.init-bar-scroll {
  display: flex;
  flex-direction: row;
  gap: 0;
  overflow-x: auto;
  overflow-y: visible;
  max-width: 1100px;
  padding: 0 24px 80px 24px;
  scrollbar-width: none;
  pointer-events: auto;
}

.init-bar-scroll.dragging-active {
  cursor: grabbing;
  user-select: none;
  -webkit-user-select: none;
}

.init-bar-scroll::-webkit-scrollbar {
  display: none;
}

.init-bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  background: transparent;
  border-radius: 12px;
  position: relative;
  transition: all 0.3s ease;
  overflow: visible;
}

/* 拖拽激活时，禁用单位项的过渡效果，避免抖动 */
.dragging-active .init-bar-item {
  transition: none;
}

.init-cursor {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 40px;
  z-index: 15;
  object-fit: contain;
  animation: bounce 1s ease-in-out infinite;
  display: none;
  cursor: pointer;
  transition: filter 0.3s ease;
  user-select: none;
  -webkit-user-select: none;
}

.init-cursor:hover {
  filter: brightness(1.2) drop-shadow(0 0 8px rgba(255, 255, 255, 0.6));
}

@keyframes bounce {

  0%,
  100% {
    transform: translateX(-50%) translateY(0);
  }

  50% {
    transform: translateX(-50%) translateY(-6px);
  }
}

.init-bar-avatarbox {
  position: relative;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

/* 拖拽时禁用头像框的过渡效果 */
.dragging-active .init-bar-avatarbox {
  transition: none;
}

.init-bar-avatarbox::after {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-image: var(--init-avatarbox-bg);
  background-size: 100% 100%;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 3;
  pointer-events: none;
}

/* Edge glow pseudo-element - sits behind the frame (::after) but outside the avatar */
.init-bar-avatarbox::before {
  content: "";
  position: absolute;
  left: 0px;
  top: -6px;
  width: calc(100%);
  height: calc(100% + 6px);
  border-radius: 12px;
  z-index: 2;
  pointer-events: none;
  background: transparent;
  /* 不填充中间，只用阴影制造光晕 */
  box-shadow: 0 0 6px rgba(0, 0, 0, 0);
  /* 默认无色，靠各阵营覆盖 */
  transition: box-shadow 0.25s ease, transform 0.25s ease;
}

.init-bar-avatarbox.ally::before {
  box-shadow: 0 0 6px rgba(230, 230, 230, 0.35), 0 0 12px rgba(230, 230, 230, 0.22);
  animation: pulseAlly 1.8s ease-in-out infinite;
}

.init-bar-avatarbox.enemy::before {
  box-shadow: 0 0 6px rgba(255, 40, 40, 0.38), 0 0 14px rgba(255, 40, 40, 0.24);
  animation: pulseEnemy 1.8s ease-in-out infinite;
}

@keyframes pulseAlly {
  0% {
    box-shadow: 0 0 3px rgba(230, 230, 230, 0.14), 0 0 8px rgba(230, 230, 230, 0.1);
    transform: scale(0.995);
  }

  35% {
    box-shadow: 0 0 10px rgba(230, 230, 230, 0.55), 0 0 18px rgba(230, 230, 230, 0.32);
    transform: scale(1.01);
  }

  65% {
    box-shadow: 0 0 10px rgba(230, 230, 230, 0.55), 0 0 18px rgba(230, 230, 230, 0.32);
    transform: scale(1.01);
  }

  100% {
    box-shadow: 0 0 3px rgba(230, 230, 230, 0.14), 0 0 8px rgba(230, 230, 230, 0.1);
    transform: scale(0.995);
  }
}

@keyframes pulseEnemy {
  0% {
    box-shadow: 0 0 3px rgba(255, 40, 40, 0.12), 0 0 8px rgba(255, 40, 40, 0.08);
    transform: scale(0.995);
  }

  35% {
    box-shadow: 0 0 12px rgba(255, 40, 40, 0.6), 0 0 22px rgba(255, 40, 40, 0.35);
    transform: scale(1.01);
  }

  65% {
    box-shadow: 0 0 12px rgba(255, 40, 40, 0.6), 0 0 22px rgba(255, 40, 40, 0.35);
    transform: scale(1.01);
  }

  100% {
    box-shadow: 0 0 3px rgba(255, 40, 40, 0.12), 0 0 8px rgba(255, 40, 40, 0.08);
    transform: scale(0.995);
  }
}

.init-bar-item.is-current .init-bar-avatarbox {
  width: 80px;
  height: 80px;
}

/* 拖动时禁用当前头像的大小变化 */
.dragging-active .init-bar-item.is-current .init-bar-avatarbox {
  width: 64px;
  height: 64px;
}

/* 延迟按钮样式 */
.delay-button {
  position: absolute;
  bottom: -32px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 30px;
  padding: 0;
  background: v-bind('"url(" + delayButtonImg + ")"') no-repeat;
  background-size: 100% 100%;
  color: transparent;
  border: none;
  font-size: 0;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;
  display: none;
  user-select: none;
  -webkit-user-select: none;
}

.delay-button:hover:not(:disabled) {
  transform: translateY(-2px) translateX(-50%) scale(1.05);
  filter: brightness(1.1);
}

.delay-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 拖动提示 */
.drag-tip {
  margin-top: 4px;
  padding: 6px 10px;
  background: rgba(74, 222, 128, 0.9);
  color: white;
  border-radius: 4px;
  font-size: 11px;
  text-align: center;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  animation: tipPulse 1.5s ease-in-out infinite;
  z-index: 10;
}

@keyframes tipPulse {

  0%,
  100% {
    opacity: 0.9;
    transform: scale(1);
  }

  50% {
    opacity: 1;
    transform: scale(1.02);
  }
}

/* 拖拽相关样式 */
.init-bar-item.is-dragging {
  opacity: 0.5;
  cursor: move;
}

.init-bar-item.preview-position {
  position: relative;
}

.init-bar-item.preview-position::before {
  content: '';
  position: absolute;
  inset: -4px;
  border: 2px dashed rgba(74, 222, 128, 0.6);
  border-radius: 8px;
  pointer-events: none;
  z-index: 5;
}

/* 移除可能导致抖动的动画 */
@keyframes slidePreview {
  from {
    opacity: 0.9;
  }

  to {
    opacity: 1;
  }
}

/* 预览位置索引 */
.preview-index {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: bold;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  z-index: 20;
  animation: popIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes popIn {
  0% {
    transform: scale(0);
    opacity: 0;
  }

  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.init-bar-item.is-drop-target {
  position: relative;
}

.init-bar-item.is-drop-target::after {
  content: '';
  position: absolute;
  left: -8px;
  top: 0;
  width: 4px;
  height: 100%;
  background: #4ade80;
  border-radius: 2px;
  box-shadow: 0 0 8px #4ade80;
  animation: dropIndicator 0.6s ease-in-out infinite;
}

@keyframes dropIndicator {

  0%,
  100% {
    opacity: 0.6;
  }

  50% {
    opacity: 1;
  }
}

.init-bar-avatar {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 90%;
  height: 90%;
  object-fit: cover;
  z-index: 1;
  transform: translate(-50%, -50%);
  border-radius: 6px;
}

.init-bar-name {
  color: #eee;
  font-size: 14px;
  text-align: center;
  white-space: nowrap;
}
</style>
