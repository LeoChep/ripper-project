<template>
  <div v-if="isVisible" class="chest-loot-overlay" @click.self="close">
    <div class="chest-loot-container">
      <div class="chest-loot-header">
        <h2>✧ 宝箱内容 ✧</h2>
        <button class="close-button" @click="close">✕</button>
      </div>
      <div class="chest-loot-content">
        <div v-if="items.length > 0" class="items-grid">
          <div 
            v-for="(item, index) in items" 
            :key="index" 
            class="item-slot"
            :title="getItemTooltip(item)"
          >
            <div class="item-icon">
              <img 
                v-if="item.icon" 
                :src="getItemIconUrl(item)" 
                :alt="item.name || item"
              />
              <span v-else class="item-placeholder">📦</span>
            </div>
            <div class="item-name">{{ getItemName(item) }}</div>
          </div>
        </div>
        <div v-else class="empty-chest">
          <p>宝箱是空的</p>
        </div>
      </div>
      <div class="chest-loot-footer">
        <button class="take-all-button" @click="takeAll" v-if="items.length > 0">
          全部拾取
        </button>
        <button class="close-footer-button" @click="close">
          关闭
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface Props {
  isVisible: boolean;
  items: any[];
}

interface Emits {
  (e: 'close'): void;
  (e: 'takeAll', items: any[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const close = () => {
  emit('close');
};

const takeAll = () => {
  emit('takeAll', props.items);
  close();
};

// 获取物品名称
const getItemName = (item: any): string => {
  if (typeof item === 'string') {
    return item;
  }
  return item.name || item.id || '未知物品';
};

// 获取物品图标URL
const getItemIconUrl = (item: any): string => {
  if (typeof item === 'string') {
    // 如果只是字符串，尝试构造默认路径
    return new URL(`@/assets/items/${item}.png`, import.meta.url).href;
  }
  if (item.icon) {
    return new URL(`@/assets/items/${item.icon}`, import.meta.url).href;
  }
  return '';
};

// 获取物品提示信息
const getItemTooltip = (item: any): string => {
  if (typeof item === 'string') {
    return item;
  }
  let tooltip = item.name || '未知物品';
  if (item.description) {
    tooltip += '\n' + item.description;
  }
  if (item.type) {
    tooltip += '\n类型: ' + item.type;
  }
  return tooltip;
};
</script>

<style scoped>
.chest-loot-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.chest-loot-container {
  background: linear-gradient(135deg, #2d1810 0%, #1a0f0a 100%);
  border: 3px solid #8b4513;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8), 
              inset 0 1px 0 rgba(255, 215, 0, 0.3);
  min-width: 400px;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateY(-50px) scale(0.9);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

.chest-loot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 2px solid #8b4513;
  background: linear-gradient(180deg, rgba(139, 69, 19, 0.3) 0%, transparent 100%);
}

.chest-loot-header h2 {
  margin: 0;
  color: #ffd700;
  font-size: 24px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  font-family: 'Georgia', serif;
}

.close-button {
  background: transparent;
  border: 2px solid #8b4513;
  color: #ffd700;
  font-size: 24px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-button:hover {
  background: rgba(139, 69, 19, 0.5);
  border-color: #ffd700;
  transform: rotate(90deg);
}

.chest-loot-content {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 15px;
}

.item-slot {
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid #8b4513;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  cursor: pointer;
}

.item-slot:hover {
  background: rgba(139, 69, 19, 0.3);
  border-color: #ffd700;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
}

.item-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #8b4513;
  border-radius: 4px;
}

.item-icon img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.item-placeholder {
  font-size: 32px;
}

.item-name {
  color: #ffeb3b;
  font-size: 12px;
  text-align: center;
  word-break: break-word;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

.empty-chest {
  text-align: center;
  padding: 40px;
  color: #888;
  font-size: 18px;
}

.chest-loot-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 2px solid #8b4513;
  background: linear-gradient(0deg, rgba(139, 69, 19, 0.3) 0%, transparent 100%);
}

.take-all-button,
.close-footer-button {
  padding: 10px 20px;
  border: 2px solid #8b4513;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
  font-family: 'Georgia', serif;
}

.take-all-button {
  background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.take-all-button:hover {
  background: linear-gradient(135deg, #66bb6a 0%, #388e3c 100%);
  border-color: #ffd700;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
}

.close-footer-button {
  background: linear-gradient(135deg, #757575 0%, #424242 100%);
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.close-footer-button:hover {
  background: linear-gradient(135deg, #9e9e9e 0%, #616161 100%);
  border-color: #ffd700;
  transform: translateY(-1px);
}

/* 滚动条样式 */
.chest-loot-content::-webkit-scrollbar {
  width: 8px;
}

.chest-loot-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.chest-loot-content::-webkit-scrollbar-thumb {
  background: #8b4513;
  border-radius: 4px;
}

.chest-loot-content::-webkit-scrollbar-thumb:hover {
  background: #a0522d;
}
</style>
