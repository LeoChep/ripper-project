<template>
    <div v-show="show" class="character-panel">
        <div
            v-for="(character, index) in characters"
            :key="character.id"
            :class="['character-item', { selected: index === selectedIndex }]"
            @click="selectCharacter(character)"
        >
            <img :src="getAvatar(character.unitTypeName)" :alt="character.name" class="avatar" />
            <div class="name">{{ character.name }}</div>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'
import { getUnitAvatar } from '@/utils/utils'
const characters = ref([])
const show=computed(() => {
    const characterStore = useCharacterStore();
    return characterStore.show;
});
onMounted(() => {
    // 可以在这里加载角色数据
    const characterStore = useCharacterStore();
    characters.value = characterStore.characters;
});
// 示例角色数据，可根据实际需求替换
const getAvatar = (unitTypeName) => {
    return getUnitAvatar(unitTypeName);
};
const selectedIndex = ref(0)

function selectCharacter(character) {
 
     const characterStore = useCharacterStore();
     characterStore.selectCharacter(character);
    // 可在此处发出事件通知父组件
}
</script>

<style scoped>
.character-panel {
    position: absolute;
    display: flex;
    justify-content: flex-start;
    align-items: flex-end;
    background-image: url('@/assets/ui/test3.png');
    background-size: 800px 100%;
    background-repeat: no-repeat;
    background-position: center top -10px;
    padding: 20px 0px 25px 20px;
    gap: 32px;
    z-index:10;
    left:0px;
    top:450px;
    width:800px;
    height: 170px;
}

.character-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    transition: transform 0.2s;
    padding: 0;
    /* border-radius: 12px; */
    width: 120px;
    height: 120px;
    position: relative;
}

.character-item.selected {
    /* transform: scale(1.1); */
    box-shadow: 0 0 2px #ffd700;
}

.avatar {
    width: 100%;
    height: 100%;
    object-fit: cover;
    /* border-radius: 12px; */
    border: 2px solid #fff;
    margin-bottom: 0;
}

.name {
    color: #fff;
    font-size: 12px;
    font-weight: bold;
    text-shadow: 0 1px 2px #000;
    position: absolute;
    bottom: 4px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.5);
    padding: 2px 6px;
    border-radius: 4px;
}
</style>