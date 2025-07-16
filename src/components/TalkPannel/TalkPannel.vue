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
    background-position: center top -10px;
    padding: 30px 0px ;
    gap: 32px;
    z-index:10;
    left:0px;
    top:450px;
    width:800px;
    height: 170px;

}

.talk-content {
    width: 96%;
    margin: 0px 0px 25px 20px;
}

p {
    font-family: ipix_12pxregular;
    /* font-weight: bold; */
    font-size: 18px;
    color: #121212;
    text-shadow: 1px 1px 1px rgba(201, 199, 199, 0.3);
}
</style>