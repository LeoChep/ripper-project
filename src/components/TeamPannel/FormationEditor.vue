<template>
  <div v-if="visible" class="formation-editor-overlay" @click="closeModal">
    <div class="formation-editor-modal" @click.stop>
      <!-- 标题栏 -->
      <div class="modal-header">
        <h2 class="modal-title">⚔️ 队伍阵型 ⚔️</h2>
        <button class="close-btn" @click="closeModal">✕</button>
      </div>

      <!-- 主要内容区域 -->
      <div class="modal-content">
        <!-- 左侧：角色列表 -->
        <div class="character-list">
          <h3 class="section-title">可用角色</h3>
          <div class="character-roster">
            <div
              v-for="character in availableCharacters"
              :key="character.id"
              class="character-item"
              :class="{ 'in-formation': isCharacterInFormation(character.id) }"
              draggable="true"
              @dragstart="onDragStart($event, character)"
            >
              <div class="character-avatar">
                <img :src="character.avatar" :alt="character.name" />
              </div>
              <div class="character-info">
                <div class="character-name">{{ character.name }}</div>
                <div class="character-level">Lv.{{ character.level }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：九宫格阵型 -->
        <div class="formation-area">
          <h3 class="section-title">战斗阵型</h3>
          <div class="formation-grid">
            <div
              v-for="(slot, index) in formationSlots"
              :key="index"
              class="formation-slot"
              :class="{ 
                'front-row': index < 3, 
                'middle-row': index >= 3 && index < 6, 
                'back-row': index >= 6,
                'occupied': slot.character,
                'drag-over': dragOverIndex === index
              }"
              @dragover.prevent="onDragOver(index)"
              @dragleave="onDragLeave"
              @drop="onDrop($event, index)"
            >
              <!-- 位置标签 -->
              <div class="position-label">{{ getPositionLabel(index) }}</div>
              
              <!-- 角色内容 -->
              <div v-if="slot.character" class="slot-character">
                <div class="character-portrait">
                  <img :src="slot.character.avatar" :alt="slot.character.name" />
                </div>
                <div class="character-name-small">{{ slot.character.name }}</div>
                <button class="remove-btn" @click="removeFromFormation(index)">×</button>
              </div>
              
              <!-- 空槽位提示 -->
              <div v-else class="empty-slot">
                <div class="slot-icon">⚪</div>
                <div class="slot-text">空位</div>
              </div>
            </div>
          </div>

          <!-- 阵型说明 -->
          <div class="formation-info">
            <div class="info-row">
              <span class="info-label">前排:</span>
              <span class="info-text">承受伤害，保护后排</span>
            </div>
            <div class="info-row">
              <span class="info-label">中排:</span>
              <span class="info-text">平衡输出与防御</span>
            </div>
            <div class="info-row">
              <span class="info-label">后排:</span>
              <span class="info-text">法师与射手的最佳位置</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="modal-footer">
        <div class="preset-buttons">
          <button class="preset-btn" @click="loadPreset('defensive')">🛡️ 防御阵型</button>
          <button class="preset-btn" @click="loadPreset('balanced')">⚖️ 平衡阵型</button>
          <button class="preset-btn" @click="loadPreset('offensive')">⚔️ 攻击阵型</button>
        </div>
        <div class="action-buttons">
          <button class="cancel-btn" @click="closeModal">取消</button>
          <button class="confirm-btn" @click="saveFormation">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'

// Props
defineProps<{
  visible: boolean
}>()

// Emits
const emit = defineEmits<{
  close: []
  save: [formation: FormationSlot[]]
}>()

// 类型定义
interface Character {
  id: string
  name: string
  level: number
  avatar: string
  class: string
}

interface FormationSlot {
  character: Character | null
  position: number
}

// 响应式数据
const dragOverIndex = ref<number | null>(null)
const formationSlots = reactive<FormationSlot[]>(
  Array.from({ length: 9 }, (_, index) => ({
    character: null,
    position: index
  }))
)

// 模拟角色数据
const availableCharacters = ref<Character[]>([
  { id: '1', name: '艾丽娅', level: 25, avatar: '/avatars/warrior.png', class: 'warrior' },
  { id: '2', name: '魔法师莉亚', level: 23, avatar: '/avatars/mage.png', class: 'mage' },
  { id: '3', name: '游侠托马斯', level: 24, avatar: '/avatars/ranger.png', class: 'ranger' },
  { id: '4', name: '牧师安娜', level: 22, avatar: '/avatars/priest.png', class: 'priest' },
  { id: '5', name: '盗贼杰克', level: 26, avatar: '/avatars/rogue.png', class: 'rogue' }
])

// 计算属性
const isCharacterInFormation = (characterId: string) => {
  return formationSlots.some(slot => slot.character?.id === characterId)
}

// 获取位置标签
const getPositionLabel = (index: number) => {
  const labels = ['前左', '前中', '前右', '中左', '中中', '中右', '后左', '后中', '后右']
  return labels[index]
}

// 拖拽相关方法
const onDragStart = (event: DragEvent, character: Character) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('character', JSON.stringify(character))
  }
}

const onDragOver = (index: number) => {
  dragOverIndex.value = index
}

const onDragLeave = () => {
  dragOverIndex.value = null
}

const onDrop = (event: DragEvent, index: number) => {
  event.preventDefault()
  dragOverIndex.value = null
  
  if (event.dataTransfer) {
    const characterData = event.dataTransfer.getData('character')
    const character = JSON.parse(characterData) as Character
    
    // 如果角色已在阵型中，先移除
    const existingIndex = formationSlots.findIndex(slot => slot.character?.id === character.id)
    if (existingIndex !== -1) {
      formationSlots[existingIndex].character = null
    }
    
    // 添加到新位置
    formationSlots[index].character = character
  }
}

// 从阵型中移除角色
const removeFromFormation = (index: number) => {
  formationSlots[index].character = null
}

// 加载预设阵型
const loadPreset = (type: string) => {
  // 清空当前阵型
  formationSlots.forEach(slot => slot.character = null)
  
  // 根据类型加载预设（这里可以根据实际需求实现）
  switch (type) {
    case 'defensive':
      // 防御阵型：前排三个位置
      if (availableCharacters.value.length >= 3) {
        formationSlots[0].character = availableCharacters.value[0]
        formationSlots[1].character = availableCharacters.value[1]
        formationSlots[2].character = availableCharacters.value[2]
      }
      break
    case 'balanced':
      // 平衡阵型：前排2个，后排2个
      if (availableCharacters.value.length >= 4) {
        formationSlots[0].character = availableCharacters.value[0]
        formationSlots[2].character = availableCharacters.value[1]
        formationSlots[6].character = availableCharacters.value[2]
        formationSlots[8].character = availableCharacters.value[3]
      }
      break
    case 'offensive':
      // 攻击阵型：后排三个位置
      if (availableCharacters.value.length >= 3) {
        formationSlots[6].character = availableCharacters.value[0]
        formationSlots[7].character = availableCharacters.value[1]
        formationSlots[8].character = availableCharacters.value[2]
      }
      break
  }
}

// 关闭模态框
const closeModal = () => {
  emit('close')
}

// 保存阵型
const saveFormation = () => {
  emit('save', formationSlots)
  closeModal()
}
</script>

<style scoped>
/* 像素字体 */
/* @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap'); */

.formation-editor-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  font-family: monospace;
  font-size: 16px; /* 从14px增加到16px */
}

.formation-editor-modal {
  background: #2c1810;
  border: 4px solid #8b4513;
  border-radius: 8px;
  width: 90%;
  max-width: 900px; /* 从800px增加到900px */
  max-height: 90vh;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
  position: relative;
  overflow: hidden;
}

/* 标题栏 */
.modal-header {
  background: linear-gradient(45deg, #4a2c17, #8b4513);
  padding: 20px; /* 从16px增加到20px */
  border-bottom: 2px solid #ffd700;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  color: #ffd700;
  margin: 0;
  font-size: 18px; /* 从12px增加到18px */
  text-shadow: 2px 2px 0px #000;
}

.close-btn {
  background: #8b0000;
  border: 2px solid #ff0000;
  color: #fff;
  width: 32px; /* 从24px增加到32px */
  height: 32px;
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
  font-size: 14px; /* 从8px增加到14px */
  transition: all 0.2s;
}

.close-btn:hover {
  background: #ff0000;
  transform: scale(1.1);
}

/* 主要内容 */
.modal-content {
  display: flex;
  padding: 20px; /* 从16px增加到20px */
  gap: 20px; /* 从16px增加到20px */
  max-height: 65vh; /* 从60vh增加到65vh */
  overflow-y: auto;
}

/* 角色列表 */
.character-list {
  flex: 1;
  min-width: 220px; /* 从200px增加到220px */
}

.section-title {
  color: #ffd700;
  margin: 0 0 16px 0; /* 从12px增加到16px */
  font-size: 14px; /* 从10px增加到14px */
  text-align: center;
  text-shadow: 1px 1px 0px #000;
}

.character-roster {
  display: flex;
  flex-direction: column;
  gap: 10px; /* 从8px增加到10px */
  max-height: 350px; /* 从300px增加到350px */
  overflow-y: auto;
  padding: 12px; /* 从8px增加到12px */
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid #8b4513;
  border-radius: 4px;
}

.character-item {
  display: flex;
  align-items: center;
  gap: 12px; /* 从8px增加到12px */
  padding: 12px; /* 从8px增加到12px */
  background: #3d2817;
  border: 2px solid #8b4513;
  border-radius: 4px;
  cursor: grab;
  transition: all 0.2s;
}

.character-item:hover {
  background: #4a2c17;
  border-color: #ffd700;
  transform: translateY(-2px);
}

.character-item.in-formation {
  opacity: 0.5;
  border-style: dashed;
}

.character-avatar {
  width: 40px; /* 从32px增加到40px */
  height: 40px;
  border: 2px solid #8b4513;
  border-radius: 4px;
  overflow: hidden;
  background: #1a1a1a;
}

.character-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
}

.character-info {
  flex: 1;
}

.character-name {
  color: #fff;
  font-size: 12px; /* 从8px增加到12px */
  margin-bottom: 4px; /* 从2px增加到4px */
}

.character-level {
  color: #ffd700;
  font-size: 10px; /* 从6px增加到10px */
}

/* 阵型区域 */
.formation-area {
  flex: 2;
}

.formation-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px; /* 从8px增加到12px */
  padding: 20px; /* 从16px增加到20px */
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid #8b4513;
  border-radius: 4px;
  margin-bottom: 20px; /* 从16px增加到20px */
}

.formation-slot {
  aspect-ratio: 1;
  border: 2px solid #8b4513;
  border-radius: 4px;
  background: #2c1810;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.2s;
  min-height: 100px; /* 从80px增加到100px */
}

.formation-slot.front-row {
  border-color: #ff4444;
  box-shadow: inset 0 0 8px rgba(255, 68, 68, 0.2);
}

.formation-slot.middle-row {
  border-color: #ffaa44;
  box-shadow: inset 0 0 8px rgba(255, 170, 68, 0.2);
}

.formation-slot.back-row {
  border-color: #44ff44;
  box-shadow: inset 0 0 8px rgba(68, 255, 68, 0.2);
}

.formation-slot.occupied {
  background: #3d2817;
  border-color: #ffd700;
}

.formation-slot.drag-over {
  background: #4a2c17;
  border-color: #ffd700;
  transform: scale(1.05);
}

.position-label {
  position: absolute;
  top: 4px; /* 从2px增加到4px */
  left: 4px;
  color: #999;
  font-size: 10px; /* 从6px增加到10px */
}

.slot-character {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px; /* 从4px增加到6px */
  position: relative;
  width: 100%;
}

.character-portrait {
  width: 50px; /* 从40px增加到50px */
  height: 50px;
  border: 2px solid #ffd700;
  border-radius: 4px;
  overflow: hidden;
  background: #1a1a1a;
}

.character-portrait img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
}

.character-name-small {
  color: #fff;
  font-size: 10px; /* 从6px增加到10px */
  text-align: center;
}

.remove-btn {
  position: absolute;
  top: -6px; /* 从-4px调整到-6px */
  right: -6px;
  width: 20px; /* 从16px增加到20px */
  height: 20px;
  background: #8b0000;
  border: 2px solid #ff0000;
  border-radius: 50%;
  color: #fff;
  cursor: pointer;
  font-size: 12px; /* 从8px增加到12px */
  line-height: 1;
}

.remove-btn:hover {
  background: #ff0000;
}

.empty-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px; /* 从4px增加到6px */
  opacity: 0.5;
}

.slot-icon {
  font-size: 20px; /* 从16px增加到20px */
  color: #666;
}

.slot-text {
  color: #666;
  font-size: 10px; /* 从6px增加到10px */
}

/* 阵型说明 */
.formation-info {
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid #8b4513;
  border-radius: 4px;
  padding: 12px; /* 从8px增加到12px */
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px; /* 从4px增加到6px */
  font-size: 10px; /* 从6px增加到10px */
}

.info-label {
  color: #ffd700;
  font-weight: bold;
}

.info-text {
  color: #ccc;
}

/* 底部按钮 */
.modal-footer {
  background: #2c1810;
  border-top: 2px solid #8b4513;
  padding: 20px; /* 从16px增加到20px */
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px; /* 从16px增加到20px */
}

.preset-buttons {
  display: flex;
  gap: 12px; /* 从8px增加到12px */
}

.preset-btn {
  background: #4a2c17;
  border: 2px solid #8b4513;
  color: #ffd700;
  padding: 12px 16px; /* 从8px 12px增加到12px 16px */
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
  font-size: 10px; /* 从6px增加到10px */
  transition: all 0.2s;
}

.preset-btn:hover {
  background: #8b4513;
  border-color: #ffd700;
  transform: translateY(-2px);
}

.action-buttons {
  display: flex;
  gap: 12px; /* 从8px增加到12px */
}

.cancel-btn {
  background: #666;
  border: 2px solid #999;
  color: #fff;
  padding: 12px 20px; /* 从8px 16px增加到12px 20px */
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
  font-size: 12px; /* 从8px增加到12px */
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: #999;
  transform: translateY(-2px);
}

.confirm-btn {
  background: #2d5a2d;
  border: 2px solid #4a8f4a;
  color: #fff;
  padding: 12px 20px; /* 从8px 16px增加到12px 20px */
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
  font-size: 12px; /* 从8px增加到12px */
  transition: all 0.2s;
}

.confirm-btn:hover {
  background: #4a8f4a;
  border-color: #6bcf6b;
  transform: translateY(-2px);
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 12px; /* 从8px增加到12px */
}

::-webkit-scrollbar-track {
  background: #2c1810;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #8b4513;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #ffd700;
}
</style>