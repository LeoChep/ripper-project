<template>
  <!-- 角色立绘层 -->
  <div v-if="currentUnit" class="character-portrait">
    <div class="portrait-container">
      <img
        v-if="avatarUrl"
        :src="avatarUrl"
        :alt="currentUnit.name"
        class="portrait-image"
      />
      <div class="portrait-name-box">
        <span class="portrait-name">{{ currentUnit.name }}</span>
      </div>
    </div>
  </div>

  <!-- 对话框 -->
  <div ref="talk_window" id="talk-window" v-show="showFlag">
    <div class="talk-content">
      <p>{{ talkContent }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref, type Ref, type ComputedRef } from 'vue'
import { useTalkStateStore } from '@/stores/talkStateStore'
import { useCharacterStore } from '@/stores/characterStore'
import { DramaSystem } from '@/core/system/DramaSystem';
import type { Unit } from '@/core/units/Unit';
import { UnitSystem } from '@/core/system/UnitSystem';
import { getUnitAvatar } from '@/utils/utils';
import { appSetting } from '@/core/envSetting';

const talkState = useTalkStateStore();
const characterStore = useCharacterStore();
const showFlag: Ref<boolean> = ref(false);
const count: Ref<number> = ref(0);
const dramaSystem= DramaSystem.getInstance();
const currentUnit: Ref<Unit | null> = ref(null);

const talkContent: ComputedRef<string> = computed(() => {
    if (talkState.talkState.content && talkState.talkState.content.length > 0) {
        showFlag.value = true;
        characterStore.setShow(false);
    } else {
        showFlag.value = false;
        characterStore.setShow(true);
    }
    return talkState.talkState.input;
});

const avatarUrl: ComputedRef<string> = computed(() => {
    if (currentUnit.value && currentUnit.value.unitTypeName) {
        return getUnitAvatar(currentUnit.value.unitTypeName);
    }
    return '';
});

// 表现层：打字机效果实现
const speak = (content: string): Promise<void> => {
    currentUnit.value = null; // 清除角色显示
    return new Promise((resolve) => {
        talkState.talkState.input = "";
        talkState.talkState.endFlag = false;
        talkState.talkState.content = content;
        talkState.end = resolve;
        const timer= setInterval(() => {
            const input: string = talkState.talkState.input;
            let endIndex: number = input.length + 1;
            if (endIndex > content.length) {
                endIndex = content.length;
                window.clearInterval(timer);
                talkState.talkState.endFlag = true;
            }
            talkState.talkState.input = content.substring(0, endIndex);
        }, 50);
        talkState.talkState.inputingTimer = timer;
    });
};

// 表现层：角色对话打字机效果（显示角色头像）

const unitSpeak = (unit: Unit, content: string): Promise<void> => {
    currentUnit.value = unit; // 设置当前角色
    return new Promise((resolve) => {
        talkState.talkState.input = "";
        talkState.talkState.endFlag = false;
        talkState.talkState.content = content;
        talkState.end = () => {
            currentUnit.value = null; // 对话结束时清除角色
            resolve();
        };
        const timer= setInterval(() => {
            const input: string = talkState.talkState.input;
            let endIndex: number = input.length + 1;
            if (endIndex > content.length) {
                endIndex = content.length;
                window.clearInterval(timer);
                talkState.talkState.endFlag = true;
            }
            talkState.talkState.input = content.substring(0, endIndex);
        }, 50);
        talkState.talkState.inputingTimer = timer;
    });
};

// 表现层：处理 Enter 键按下的逻辑
const enterEnd = (): void => {
    count.value++;
    console.log("count", count.value);
    if (!talkState.talkState.endFlag) {
        // 第一次按 Enter：跳过打字机效果，直接显示全部内容
        window.clearInterval(talkState.talkState.inputingTimer);
        talkState.talkState.input = talkState.talkState.content;
        console.log(talkState.talkState);
        talkState.talkState.endFlag = true;
    } else {
        // 第二次按 Enter：结束对话，清空内容
        talkState.end(true);
        talkState.talkState.endFlag = false;
        talkState.talkState.inputingTimer = null;
        talkState.talkState.input = "";
        talkState.talkState.content = "";
        talkState.end = () => {};
    }
};
const unitNameSpeak = (unitName: string, content: string): Promise<void> => {
    const units = UnitSystem.getInstance().getAllUnits();
    for (const unit of units) {
        if (unit.name === unitName) {
            return unitSpeak(unit, content);
        }
    }
    return unitSpeak({ name: unitName } as Unit, content);
};
dramaSystem.unitSpeak = unitNameSpeak;
dramaSystem.speak = speak;
dramaSystem.CGstart = talkState.CGstart;
dramaSystem.CGEnd =talkState.CGEnd;
// 键盘事件处理
const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter') {
        enterEnd();
    }
};

// 暴露方法供外部调用
defineExpose({
    speak,
    unitSpeak
});

onMounted(() => {
    // 监听 Enter 键，触发对话流程控制
    window.addEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
/* 角色立绘层 - galgame 风格 */
.character-portrait {
  position: absolute;
  left: v-bind('appSetting.width / 2 + "px"');
  top: v-bind('appSetting.height / 2 + "px"');
  transform: translate(-50%, -50%);
  z-index: 9;
  pointer-events: none;
  width: 0;
  height: 0;
}

.portrait-container {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 400px;
  height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.portrait-container::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url("@/assets/ui/init-avtarbox2.png");
  background-size: 100% 100%;
  background-repeat: no-repeat;
  z-index: 2;
  pointer-events: none;
}

.portrait-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 1;
}

.portrait-name-box {
  position: absolute;
  bottom: 15px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(30, 30, 30, 0.9));
  padding: 10px 30px;
  border-radius: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.6);
  z-index: 3;
}

.portrait-name {
  font-family: ipix_12pxregular;
  font-size: 24px;
  color: #ffffff;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.9);
  font-weight: bold;
  letter-spacing: 2px;
}

/* 对话框 */
#talk-window {
  position: absolute;
  font-size: 18px;
  background-image: url("@/assets/ui/test3.png");
  background-size: 800px 100%;
  background-repeat: no-repeat;
  background-position: center bottom;
  padding: 15px 15px 15px 20px;
  z-index: 10;
  left: 400px;
  top: 730px;
  width: 800px;
  height: 170px;
  gap: 5px;
}

.talk-content {
  width: calc(100%);
  /* 考虑左右内边距的影响 */
  margin: 35px 0px 15px 0px;
  /* 调整边距适应新的内边距 */
  padding: 0px;
}

p {
  font-family: ipix_12pxregular;
  /* font-weight: bold; */
  font-size: 18px;
  color: #121212;
  text-shadow: 1px 1px 1px rgba(201, 199, 199, 0.3);
}
</style>
