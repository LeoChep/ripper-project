<template>
    <div ref="talk_window" id="talk-window" v-show="showFlag">
        <p>{{ talkContent }}</p>
    </div>
</template>

<script setup>
import { onMounted, computed,ref } from 'vue'
import { useTalkStateStore } from '@/stores/talkStateStore'
const talkState = useTalkStateStore();
const showFlag=ref(false)
const talkContent = computed(() => {
    if (talkState.talkState.content&&talkState.talkState.content.length>0){
        showFlag.value = true;
    }else{
        showFlag.value = false;
    }
    return talkState.talkState.input;
})

onMounted(()=>{
    // talkState.speak("欢迎来到游戏世界！")
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            talkState.enterEnd()
        }
    });
})
// 这里可以添加响应式数据和逻辑
</script>

<style scoped>
#talk-window {
    position: absolute;
    top: 450px;
    left: 0px;
    height: 150px;
    width: 800px;
    z-index: 2;
    background-color: rgb(0, 0, 255, 0.2);
    font-size: 18px;
    color: seashell;
    border-style: ridge;
    border-width: 5px;
    border-radius: 5px
}

pre {
    font-family: ipix_12pxregular;
    font-weight: 500;
}
</style>