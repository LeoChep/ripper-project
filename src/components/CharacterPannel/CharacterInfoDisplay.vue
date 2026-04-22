<template>
  <div class="character-detail">
    <div class="name">{{ displayName }}</div>
    <img :src="avatarSrc" :alt="displayName" class="avatar" />
    <div class="hp-display">
      <div class="hp-text">HP:{{ currentHp }}/{{ maxHp }}</div>
    </div>
  </div>
</template>

<script setup>
import { shallowRef } from 'vue'
import { getUnitAvatar } from '@/utils/utils'

// 使用 shallowRef 避免深度响应式
const displayName = shallowRef('')
const avatarSrc = shallowRef('')
const currentHp = shallowRef(0)
const maxHp = shallowRef(0)

// 更新显示数据 - 外部调用
const updateDisplay = (character) => {
  if (!character) {
    displayName.value = ''
    avatarSrc.value = ''
    currentHp.value = 0
    maxHp.value = 0
    return
  }

  const creature = character.creature
  displayName.value = character.name || ''
  avatarSrc.value = getUnitAvatar(character.unitTypeName)
  currentHp.value = creature?.hp ?? 0
  maxHp.value = creature?.maxHp ?? 0
}

// 清除显示
const clear = () => {
  displayName.value = ''
  avatarSrc.value = ''
  currentHp.value = 0
  maxHp.value = 0
}

defineExpose({
  updateDisplay,
  clear
})
</script>

<style scoped>
.character-detail {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 110px;
  height: 120px;
  position: relative;
  flex-shrink: 0;
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
  font-size: 13px;
  font-weight: bold;
  text-shadow: 1px 1px 1px #000, -1px -1px 2px #000, 1px -1px 2px #000, -1px 1px 2px #000;
  position: absolute;
  top: 3px;
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
  font-size: 18px;
  font-weight: bold;
  text-shadow: 2px 2px 4px #000, -1px -1px 2px #000, 1px -1px 2px #000, -1px 1px 2px #000;
  margin-bottom: 2px;
  line-height: 1;
}
</style>
