<template>
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

const talkState = useTalkStateStore();
const characterStore = useCharacterStore();
const showFlag: Ref<boolean> = ref(false);
const count: Ref<number> = ref(0);
const dramaSystem= DramaSystem.getInstance();

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

// 表现层：打字机效果实现
const speak = (content: string): Promise<void> => {
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
    speak
});

onMounted(() => {
    // 监听 Enter 键，触发对话流程控制
    window.addEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
#talk-window {
  position: absolute;
  font-size: 18px;
  background-image: url("@/assets/ui/test3.png");
  background-size: 800px 100%;
  background-repeat: no-repeat;
  background-position: center bottom;
  padding: 15px 15px 15px 20px;
  /* 与character-detail-panel保持一致的内边距 */
  z-index: 10;
  left: 400px;
  top: 730px;
  /* 与character-detail-panel相同的位置 */
  width: 800px;
  height: 170px;
  gap: 5px;
  /* 与character-detail-panel保持一致的间距 */
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
