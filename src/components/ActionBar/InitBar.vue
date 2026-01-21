<template>
  <div
    class="init-bar-wrapper"
    :style="{ '--init-avatarbox-bg': `url(${initAvatarBoxImg})` }"
  >
    <div class="init-bar-scroll" ref="scrollContainer" @wheel="onWheel">
      <div
        v-for="unit in units"
        :id="`init-${unit.id}`"
        :key="unit.id"
        :class="['init-bar-item']"
        v-show="isAllLoaded"
      >
        <img
          :id="`init-cursor-${unit.id}`"
          :src="initCursorImg"
          class="init-cursor"
          alt="cursor"
        />
        <div :class="['init-bar-avatarbox', unit.party === 'player' ? 'ally' : 'enemy']">
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
import { currentInit, useInitiativeStore } from "@/stores/initiativeStore";
import { getUnitAvatar } from "@/utils/utils";
import * as InitSystem from "@/core/system/InitiativeSystem";
import initCursorImg from "@/assets/ui/init-cursor.png";
import initAvatarBoxImg from "@/assets/ui/init-avtarbox2.png";
import { appSetting } from "@/core/envSetting";
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
avatarBoxImg.src = initAvatarBoxImg;

const cursorImg = new Image();
cursorImg.onload = () => {
  isCursorLoaded.value = true;
};
cursorImg.src = initCursorImg;

InitSystem.loadBattleUIhandles.push(() => {
  initiativeStore.initializeInitiative();
});
// 假设 store 中有 sortedUnits，包含 { id, avatar, name } 按先攻顺序排列
const units = computed(() => initiativeStore.sortedUnits);
const currentUnit = computed(() => initiativeStore.getOwner);
const currentUnitId = computed(() => initiativeStore.currentUnitId);
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
  if (isAllLoaded.value && currentUnitId.value && scrollContainer.value) {
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
    }
    const currentUnitId = currentInit.currentUnitId;
    const currentUnitElement = document.getElementById(`init-${currentUnitId}`);
    if (currentUnitElement) {
      currentUnitElement.classList.add("is-current");
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
  width: 40px;
  height: 40px;
  z-index: 10;
  object-fit: contain;
  animation: bounce 1s ease-in-out infinite;
  display: none;
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
