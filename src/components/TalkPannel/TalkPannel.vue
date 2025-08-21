<template>
    <div ref="talk_window" id="talk-window" v-show="showFlag">
        <div class="talk-content">
               <p>{{ talkContent }}</p>
        </div>
            
     


    </div>
</template>

<script setup>
import { onMounted, computed,ref } from 'vue'
import { useTalkStateStore } from '@/stores/talkStateStore'
import { useCharacterStore } from '@/stores/characterStore'
const talkState = useTalkStateStore();
const characterStore = useCharacterStore();
const showFlag=ref(false)
const talkContent = computed(() => {
    if (talkState.talkState.content&&talkState.talkState.content.length>0){
        showFlag.value = true;
        characterStore.setShow(false);
    }else{
        showFlag.value = false;
         characterStore.setShow(true);
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
    font-size: 18px;
    background-image: url('@/assets/ui/test3.png');
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
    width: calc(100% );
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