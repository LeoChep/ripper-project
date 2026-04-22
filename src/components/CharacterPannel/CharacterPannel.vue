<template>
    <div v-show="show">
        <!-- 左侧角色列表 -->
        <div class="character-list">
            <div v-for="(character, index) in characterListData" :key="character.id"
                :class="['character-list-item', { 'selected': character.id === selectedCharacterId }]"
                @click="selectCharacterById(character.id, index)">
                <img :src="getAvatar(character.unitTypeName)" :alt="character.name" class="list-avatar" />
                <div class="list-name">{{ character.name }}</div>
            </div>
        </div>

        <ActionBar :character="selectedCharacter" id="action-bar" />

        <!-- 原位置显示选中角色详情 -->
        <div class="character-detail-panel" id="character-detail-panel" :style="{top: actionPannelTop+'px'}">
            <!-- 底部区域：角色详情 + 动作面板 -->
            <div class="bottom-section">
                <!-- 角色信息显示组件 -->
                <CharacterInfoDisplay ref="characterInfoRef" />

                <!-- 动作选择面板 -->
                <ActionPannelSimple
                    ref="actionPanelRef"
                    @actionSelected="handleActionSelected"
                    @openInventory="handleOpenInventory"
                />
            </div>
        </div>
    </div>
</template>

<script setup>
import { shallowRef, onMounted, onUnmounted, computed } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'
import { getUnitAvatar } from '@/utils/utils'
import CharacterInfoDisplay from './CharacterInfoDisplay.vue'
import ActionPannelSimple from './ActionPannelSimple.vue'
import ActionBar from '../ActionBar/ActionBar.vue'
import { CharacterController } from '@/core/controller/CharacterController'
import { useTalkStateStore } from '@/stores/talkStateStore'
import { CharacterCombatController } from "@/core/controller/CharacterCombatController"
import test3Img from '@/assets/ui/test3.png'
import { appSetting } from '@/core/envSetting'
import { golbalSetting } from '@/core/golbalSetting'

// 使用 shallowRef 避免深度响应式
const actionPannelTop = shallowRef(0)
const characterInfoRef = shallowRef(null)
const actionPanelRef = shallowRef(null)
const selectedCharacter = shallowRef(null)
const characterListData = shallowRef([])
const selectedCharacterId = shallowRef(null)

// 存储数据（原始类型，非响应式）
let characterStore = null
let pollingTimer = null
let characterListTimer = null
let lastSelectedCharacterId = null
let lastHp = null
let lastMaxHp = null
let lastCharacterListLength = 0

const show = computed(() => {
    return !useTalkStateStore().talkState.onCg
})

// 更新角色列表数据
const updateCharacterList = () => {
    const characters = golbalSetting.playerRoles || []

    // 检查角色数量是否变化
    if (characters.length !== lastCharacterListLength) {
        lastCharacterListLength = characters.length

        const newList = characters.map(character => ({
            id: character.id,
            name: character.name,
            unitTypeName: character.unitTypeName
        }))

        characterListData.value = newList
    }
}

// 轮询更新
const pollUpdate = () => {
    const characters = golbalSetting.playerRoles || []
    if (characters.length === 0) return

    const storeSelectedId = characterStore?.selectedCharacterId

    // 检查是否正在使用威能
    checkUsePowerHandler()

    // 查找当前选中的角色
    let selectedChar = null

    characters.forEach((character) => {
        if (character.id === storeSelectedId) {
            selectedChar = character
        }
    })

    // 初始化选中角色
    if (!selectedChar && characters.length > 0) {
        const firstCharacter = characters[0]
        CharacterController.curser = firstCharacter.id
        characterStore.selectedCharacterId = firstCharacter.id
        CharacterController.selectCharacterById(firstCharacter.id)
        selectedChar = firstCharacter
    }

    if (!selectedChar) return

    selectedCharacter.value = selectedChar
    selectedCharacterId.value = selectedChar.id

    // 检查角色是否切换
    if (lastSelectedCharacterId !== selectedChar.id) {
        lastSelectedCharacterId = selectedChar.id
        lastHp = null
        lastMaxHp = null

        // 更新子组件
        characterInfoRef.value?.updateDisplay(selectedChar)
        actionPanelRef.value?.updateData(selectedChar)
    } else {
        // 角色未切换，检查具体数据是否变化
        const creature = selectedChar.creature
        const currentHp = creature?.hp ?? 0
        const currentMaxHp = creature?.maxHp ?? 0

        // HP 变化，只更新 HP 显示
        if (currentHp !== lastHp || currentMaxHp !== lastMaxHp) {
            lastHp = currentHp
            lastMaxHp = currentMaxHp
            characterInfoRef.value?.updateDisplay(selectedChar)
        }

        // 更新 ActionPannel（检查 Proned 状态等）
        actionPanelRef.value?.updateData(selectedChar)
    }
}

const checkUsePowerHandler = () => {
    const controller = CharacterCombatController.getInstance()
    if (controller.inUsePower) {
        const actionPanel = document.getElementById('character-detail-panel')
        if (actionPanel) actionPanel.style.display = 'none'
        const actionBar = document.getElementById('action-bar')
        if (actionBar) actionBar.style.display = 'none'
    } else {
        const actionPanel = document.getElementById('character-detail-panel')
        if (actionPanel) actionPanel.style.display = 'flex'
        const actionBar = document.getElementById('action-bar')
        if (actionBar) actionBar.style.display = 'block'
    }
}

const getAvatar = (unitTypeName) => {
    return getUnitAvatar(unitTypeName)
}

const selectCharacterById = (characterId, index) => {
    const controller = CharacterCombatController.getInstance()
    if (controller.inUsePower) {
        console.warn("当前正在使用威能，无法切换角色")
        return
    }

    const characters = golbalSetting.playerRoles || []
    const character = characters.find(c => c.id === characterId)

    if (!character) return

    lastSelectedCharacterId = character.id
    characterStore.selectCharacter(character)
    CharacterController.curser = character.id
    CharacterController.selectCharacterById(character.id)

    characterInfoRef.value?.updateDisplay(character)
    actionPanelRef.value?.updateData(character)
}

const handleActionSelected = (action) => {
    console.log('父组件接收到动作选择:', action)
}

const handleOpenInventory = () => {
    console.log('打开背包面板')
    const characters = golbalSetting.playerRoles || []
    const storeSelectedId = characterStore?.selectedCharacterId

    const selectedChar = characters.find(c => c.id === storeSelectedId)
    if (selectedChar) {
        window.dispatchEvent(new CustomEvent('openCharacterInventory', {
            detail: { unit: selectedChar }
        }))
    }
}

onMounted(() => {
    actionPannelTop.value = appSetting.height - 170 - 10
    characterStore = useCharacterStore()
    CharacterController.selectCharacterHandlers.push(characterStore.selectCharacter)

    // 初始化角色列表
    updateCharacterList()

    // 角色列表更新定时器（较低频率）
    characterListTimer = setInterval(() => {
        updateCharacterList()
    }, 500)

    // 数据更新轮询定时器
    pollingTimer = setInterval(() => {
        pollUpdate()
    }, 100)
})

onUnmounted(() => {
    if (pollingTimer) clearInterval(pollingTimer)
    if (characterListTimer) clearInterval(characterListTimer)
})

</script>

<style scoped>
/* 右侧角色列表 */
.character-list {
    position: fixed;
    left: 1450px;
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
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    background-image: v-bind('"url(" + test3Img + ")"');
    background-size: 800px 100%;
    background-repeat: no-repeat;
    background-position: center bottom;
    padding: 15px 40px 15px 20px;
    z-index: 10;
    left: 400px;
    top: 730px;
    width: 800px;
    height: 170px;
    gap: 5px;
}

/* 底部区域样式 */
.bottom-section {
    display: flex;
    justify-content: flex-start;
    align-items: flex-end;
    gap: 15px;
    flex: 1;
    margin-top: 5px;
    width: 100%;
}
</style>
