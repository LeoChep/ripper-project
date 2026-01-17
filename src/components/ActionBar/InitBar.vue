<template>
  <div class="init-bar-wrapper">
    <div class="init-bar-scroll" ref="scrollContainer" @wheel="onWheel">
      <div
        v-for="unit in units"
        :key="unit.id"
        :class="['init-bar-item', { 'is-current': isCurrentUnit(unit) }]"
        v-show="isAllLoaded"
      >
        <img
          v-if="isCurrentUnit(unit)"
          src="/src/assets/ui/init-cursor.png"
          class="init-cursor"
          alt="cursor"
        />
        <div class="init-bar-avatarbox">
          <img
            :src="getAvatar(unit.unitTypeName)"
            class="init-bar-avatar"
            :alt="unit.name"
          />
        </div>
        <!-- <div class="init-bar-name">{{ unit.name }}</div> -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useInitiativeStore } from "@/stores/initiativeStore";
import { getUnitAvatar } from "@/utils/utils";
import * as InitSystem from "@/core/system/InitiativeSystem";
const scrollContainer = ref<HTMLDivElement | null>(null);
const initiativeStore = useInitiativeStore();
const isAvatarBoxLoaded = ref(false);
const isCursorLoaded = ref(false);
const loadedAvatarCount = ref(0);

// 预加载框体图片资源
const avatarBoxImg = new Image();
avatarBoxImg.onload = () => {
  isAvatarBoxLoaded.value = true;
};
avatarBoxImg.src = "/src/assets/ui/init-avtarbox2.png";

const cursorImg = new Image();
cursorImg.onload = () => {
  isCursorLoaded.value = true;
};
cursorImg.src = "/src/assets/ui/init-cursor.png";

InitSystem.playStartUIhandles.push(() => {
  initiativeStore.initializeInitiative();
});
// 假设 store 中有 sortedUnits，包含 { id, avatar, name } 按先攻顺序排列
const units = computed(() => initiativeStore.sortedUnits);
const currentUnit = computed(() => initiativeStore.getOwner);

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
  return currentUnit.value && currentUnit.value.id === unit.id;
};

const getAvatar = (unitTypeName: string) => {
  return getUnitAvatar(unitTypeName);
};
function onWheel(e: WheelEvent) {
  e.preventDefault();
  if (scrollContainer.value) {
    scrollContainer.value.scrollLeft += e.deltaY > 0 ? 60 : -60;
  }
}
</script>

<style scoped>
.init-bar-wrapper {
  width: 100vw;
  position: fixed;
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
  max-width: 900px;
  padding: 0 24px 40px 24px;
  scrollbar-width: none;
  pointer-events: auto;
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
}
.init-bar-item.is-current {
  /* filter: brightness(1.2); */
}
.init-cursor {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 32px;
  height: 32px;
  z-index: 10;
  object-fit: contain;
  animation: bounce 1s ease-in-out infinite;
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
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}
.init-bar-avatarbox::after {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-image: url("/src/assets/ui/init-avtarbox2.png");
  background-size: 100% 100%;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 3;
  pointer-events: none;
}
.init-bar-item.is-current .init-bar-avatarbox {
  width: 64px;
  height: 64px;
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
