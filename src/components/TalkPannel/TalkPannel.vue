<template>
  <!-- 角色立绘层 -->
  <div>
    <div v-if="currentUnit" class="character-portrait">
      <div class="portrait-container">
        <img v-if="avatarUrl" :src="avatarUrl" :alt="currentUnit.name" class="portrait-image" />
        <div class="portrait-name-box">
          <span class="portrait-name">{{ currentUnit.creature?.name }}</span>
        </div>


      </div>
    </div>

    <!-- 对话框（无角色时使用） -->
    <!-- 嵌入式选项 -->
    <!-- 对话框（位于角色头像下方） -->
    <div v-if="showFlag || talkState.options.length > 0" class="talk-window-portrait">
      <div v-if="showFlag" class="talk-content-portrait">
        <p>{{ talkContent }}</p>
      </div>
          <div v-if="talkState.options.length > 0" class="portrait-options">
      <div v-for="(option, index) in talkState.options" :key="index"
        :class="['portrait-option-item', { 'selected': index === talkState.selectedOption }]"
        @click="handleOptionClick(index)" @mouseenter="handleOptionHover(index)">
        <span class="option-text">{{ option.text }}</span>
      </div>
    </div>
    </div>

  </div>

</template>

<script setup lang="ts">
import { onMounted, computed, ref, type Ref, type ComputedRef, watch } from 'vue'
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
const dramaSystem = DramaSystem.getInstance();
const currentUnit: Ref<Unit | null> = ref(null);

const talkContent: ComputedRef<string> = computed(() => {
  return talkState.talkState.input;
});
watch(
  () => talkState.talkState.content,
  (newVal) => {
    showFlag.value = newVal.length > 0;
  }
);
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
    const timer = setInterval(() => {
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
    const timer = setInterval(() => {
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
    if (!talkState.talkState.isOnChoice) {
      talkState.end(true);
      talkState.talkState.endFlag = false;
      talkState.talkState.inputingTimer = null;
      talkState.talkState.input = "";
      talkState.talkState.content = "";
      talkState.end = () => { };
    } else {
      // 如果在选项状态，不做任何操作
      talkState.end(true);
      talkState.end = () => { };
    }

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

// 表现层：角色选择（带可选对话文本）
const unitChoose = async (
  unit: Unit,
  options: { text: string; value: any }[],
  dialogText?: string
): Promise<any> => {
  currentUnit.value = unit; // 设置当前角色

  // 如果提供了对话文本，先显示对话
  if (dialogText) {
    await new Promise<void>((resolve) => {
      talkState.talkState.input = "";
      talkState.talkState.endFlag = false;
      talkState.talkState.content = dialogText;
      talkState.talkState.isOnChoice = true;
      talkState.end = resolve;
      const timer = setInterval(() => {
        const input: string = talkState.talkState.input;
        let endIndex: number = input.length + 1;
        if (endIndex > dialogText.length) {
          endIndex = dialogText.length;
          window.clearInterval(timer);
          talkState.talkState.endFlag = true;
        }
        talkState.talkState.input = dialogText.substring(0, endIndex);
      }, 50);
      talkState.talkState.inputingTimer = timer;
    });
  }

  // 显示选项并等待选择
  return new Promise((resolve) => {
    talkState.showOptions(options, (value: any) => {
      // 只有在有对话文本时才清空对话内容
      // 这样对话框会在选项显示期间保持显示
      if (dialogText) {
        talkState.talkState.input = "";
        talkState.talkState.content = "";
        talkState.talkState.endFlag = false;
        talkState.talkState.isOnChoice = false;
      }
      currentUnit.value = null; // 选择完成后清除角色
      resolve(value);
    });
  });
};

// 表现层：通过角色名称进行选择
const unitNameChoose = (
  unitName: string,
  options: { text: string; value: any }[],
  dialogText?: string
): Promise<any> => {
  const units = UnitSystem.getInstance().getAllUnits();
  for (const unit of units) {
    if (unit.name === unitName) {
      return unitChoose(unit, options, dialogText);
    }
  }
  return unitChoose({ name: unitName } as Unit, options, dialogText);
};

dramaSystem.unitSpeak = unitNameSpeak;
dramaSystem.speak = speak;
dramaSystem.CGstart = talkState.CGstart;
dramaSystem.CGEnd = talkState.CGEnd;
const choose = async (options: { text: string; value: any }[]): Promise<any> => {
  return new Promise((resolve) => {
    talkState.showOptions(options, (value: any) => {
      resolve(value);
    });
  });
};
dramaSystem.choose = choose;
dramaSystem.unitChoose = unitNameChoose;
// 选项处理逻辑
const handleOptionClick = (index: number): void => {
  talkState.selectOption(index);
};

const handleOptionHover = (index: number): void => {
  talkState.selectedOption = index;
};

// 键盘事件处理
const handleKeyDown = (event: KeyboardEvent): void => {
  // 如果有选项显示，处理选项选择
  if (talkState.options.length > 0) {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      talkState.selectedOption = Math.max(0, talkState.selectedOption - 1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      talkState.selectedOption = Math.min(talkState.options.length - 1, talkState.selectedOption + 1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      talkState.selectOption(talkState.selectedOption);
    }
  } else if (event.key === 'Enter') {
    enterEnd();
  }
};

// 暴露方法供外部调用
defineExpose({
  speak,
  unitSpeak,
  unitChoose,
  showOptions: talkState.showOptions
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
  transform: translate(-50%, -70%);
  width: 400px;
  height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
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
  text-align: center;
}

.portrait-name {
  font-family: ipix_12pxregular;
  font-size: 24px;
  color: #ffffff;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.9);
  font-weight: bold;
  letter-spacing: 2px;
}

/* 对话框（位于角色头像下方） */
.talk-window-portrait {
  position: absolute;
  top: v-bind('appSetting.height / 2 + 170 + "px"');
  left: v-bind('appSetting.width / 2 + "px"');
  transform: translateX(-50%);
  width: auto;
  min-width: 800px;
  max-width: 1200px;
  min-height: 250px;
  background-image: url("@/assets/ui/testtalkUI.png");
  background-size: 100% 100%;
  pointer-events: auto;
  background-repeat: no-repeat;
  background-position: center center;
  padding: 20px 40px 40px 40px;
  z-index: 4;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.talk-content-portrait {
  width: 100%;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
}

.talk-content-portrait p {
  font-family: ipix_12pxregular;
  font-size: 20px;
  color: #1a1a1a;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.4);
  line-height: 1.8;
  margin: 0;
  padding: 0 40px;

  word-wrap: break-word;
  white-space: pre-wrap;
  font-weight: normal;
}

/* 选项容器样式 */
.portrait-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
  width: 100%;
  align-items: center;
  border-top: 2px solid rgba(26, 26, 26, 0.2);
  padding-top: 20px;
}

/* 单个选项样式 */
.portrait-option-item {
  position: relative;
  width: 85%;
  padding: 10px 30px;
  cursor: pointer;
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba(26, 26, 26, 0.15);
  transition: all 0.2s ease;
  text-align: left;
  pointer-events: auto;
}

.portrait-option-item:hover,
.portrait-option-item.selected {
  background: rgba(26, 26, 26, 0.03);
  border-bottom-color: rgba(26, 26, 26, 0.3);
}

.portrait-option-item.selected::before {
  content: "▶";
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #1a1a1a;
  font-size: 18px;
  font-weight: bold;
  animation: blink 1s infinite;
}

/* 选项文本样式 */
.option-text {
  font-family: ipix_12pxregular;
  font-size: 20px;
  color: #1a1a1a;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.5);
  font-weight: bold;
  letter-spacing: 1px;
  line-height: 1.5;
}

/* 闪烁动画 */
@keyframes blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}
</style>
