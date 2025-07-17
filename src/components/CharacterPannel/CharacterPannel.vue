<template>
    <div v-show="show">
        <!-- 左侧角色列表 -->
        <div class="character-list">
            <div v-for="(character, index) in characters" :key="character.id"
                :class="['character-list-item', { 'selected': selectedIndex === index }]"
                @click="selectCharacter(character, index)">
                <img :src="getAvatar(character.unitTypeName)" :alt="character.name" class="list-avatar" />
                <div class="list-name">{{ character.name }}</div>
            </div>
        </div>

        <!-- 原位置显示选中角色详情 -->
        <div v-if="selectedCharacter" class="character-detail-panel">
            <div class="character-detail">
                <!-- 名字显示 -->
                <div class="name">{{ selectedCharacter.name }}</div>
                <img :src="getAvatar(selectedCharacter.unitTypeName)" :alt="selectedCharacter.name" class="avatar" />
                <!-- HP 显示 -->
                <div class="hp-display">
                    <div class="hp-text">HP:{{ selectedCharacter.creature?.hp || 0 }}/{{
                        selectedCharacter.creature?.maxHp || 0 }}</div>
                </div>
            </div>
            
            <!-- 动作选择面板 -->
            <ActionPannel 
                :character="selectedCharacter" 
                @actionSelected="handleActionSelected" 
                ref="actionPanelRef" />
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'
import { getUnitAvatar } from '@/utils/utils'
import { CharacterOutCombatController } from '@/core/controller/CharacterOutCombatController'
import ActionPannel from '../ActionPannel/ActionPannel.vue'
import { CharacterController } from '@/core/controller/CharacterController'
import { lockOn } from '@/core/anim/LockOnAnim'
const characters = ref([])
const show = computed(() => {
    const characterStore = useCharacterStore();
    return characterStore.show;
});
const characterStore = useCharacterStore();
const selectedIndex = ref(0)
const selectedCharacter = ref(null)
const actionPanelRef = ref(null)

onMounted(() => {
    // 可以在这里加载角色数据
    characters.value = characterStore.characters;
    if (characters.value.length > 0) {
        selectedCharacter.value = characters.value[0];
    }
    setInterval(() => {
       const curser=CharacterController.curser;
       characters.value.forEach((character, index) => {
           if (character.id === curser) {
               selectedIndex.value = index;
               selectedCharacter.value = character;
           }
       });
    }, 100);
});

// 示例角色数据，可根据实际需求替换
const getAvatar = (unitTypeName) => {
    return getUnitAvatar(unitTypeName);
};

// 计算HP百分比
const getHpPercentage = (character) => {
    if (!character.creature || !character.creature.maxHp) return 0;
    return Math.max(0, Math.min(100, (character.creature.hp / character.creature.maxHp) * 100));
};

// 处理动作选择
const handleActionSelected = (action) => {
    console.log('父组件接收到动作选择:', action);
    // 这里可以处理动作选择的逻辑
}

function selectCharacter(character, index) {
    console.log('选中角色:', character);
    CharacterController.curser = character.id;
    selectedIndex.value = index;
    selectedCharacter.value = character;
    lockOn(character.x, character.y);
}

</script>

<style scoped>
/* 左侧角色列表 */
.character-list {
    position: fixed;
    left: 650px;
    top: 10px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    z-index: 15;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    padding: 10px;
    max-height: 400px;
    overflow-y: auto;
}

.character-list-item {
    display: flex;
    align-items: center;
    cursor: pointer;
    transition: all 0.2s;
    padding: 8px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid transparent;
    min-width: 120px;
}

.character-list-item:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateX(5px);
}

.character-list-item.selected {
    background: rgba(255, 215, 0, 0.3);
    border-color: #ffd700;
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.list-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2px solid #fff;
    margin-right: 10px;
    object-fit: cover;
}

.list-name {
    color: #fff;
    font-size: 12px;
    font-weight: bold;
    text-shadow: 1px 1px 2px #000;
}

/* 原位置的角色详情面板 */
.character-detail-panel {
    position: absolute;
    display: flex;
    justify-content: flex-start;
    align-items: flex-end;
    background-image: url('@/assets/ui/test3.png');
    background-size: 800px 100%;
    background-repeat: no-repeat;
    background-position: center top -10px;
    padding: 20px 0px 25px 20px;
    z-index: 10;
    left: 0px;
    top: 450px;
    width: 800px;
    height: 170px;
    gap: 20px;
}

.character-detail {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 120px;
    height: 125px;
    position: relative;
    flex-shrink: 0;
}

/* 动作选择面板 */
.action-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 125px;
    background: rgba(0, 0, 0, 0.6);
    border-radius: 8px;
    padding: 10px;
    border: 2px solid #444;
    position: relative;
    left: -10px;
}

/* 标签栏容器 */
.tab-container {
    margin-bottom: 8px;
}

.tab-row {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 8px;
}

.tab-group {
    display: flex;
    gap: 4px;
}

.tab-separator {
    width: 1px;
    height: 20px;
    background: #666;
}

.tab-btn {
    padding: 4px 8px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid #666;
    border-radius: 4px;
    color: #ccc;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.2s;
}

.tab-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
}

.tab-btn.active {
    background: #4a90e2;
    color: #fff;
    border-color: #4a90e2;
}

/* 动作按钮区域 */
.action-buttons {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    overflow-y: auto;
    margin-bottom: 8px;
}

.action-btn {
    padding: 6px 12px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid #666;
    border-radius: 4px;
    color: #fff;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
}

.action-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
}

.action-btn.selected {
    background: #f39c12;
    border-color: #f39c12;
    color: #fff;
}

/* 状态提示栏 */
.status-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 8px;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 4px;
    border-top: 1px solid #444;
}

.current-selection {
    color: #fff;
    font-size: 10px;
    font-weight: bold;
}

.action-points {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #fff;
    font-size: 10px;
}

.action-point {
    font-size: 14px;
    color: #666;
}

.action-point.filled {
    color: #4a90e2;
}

.avatar {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border: 2px solid #fff;
    margin-bottom: 0;
}

.name {
    color: #fff;
    font-size: 14px;
    font-weight: bold;
    text-shadow: 1px 1px 1px #000, -1px -1px 2px #000, 1px -1px 2px #000, -1px 1px 2px #000;
    position: absolute;
    top: 4px;
    left: 50%;
    transform: translateX(-50%);
    padding: 2px 6px;
}

.hp-display {
    position: absolute;
    bottom: 0px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 20;
    padding: 4px 8px;
    min-width: 60px;
    text-align: center;
}

.hp-text {
    color: #fff;
    font-size: 20px;
    font-weight: bold;
    text-shadow: 2px 2px 4px #000, -1px -1px 2px #000, 1px -1px 2px #000, -1px 1px 2px #000;
    margin-bottom: 2px;
    line-height: 1;
}
</style>