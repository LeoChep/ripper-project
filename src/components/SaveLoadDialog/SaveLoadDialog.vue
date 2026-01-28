<template>
  <div v-if="isVisible" class="dialog-overlay" @click.self="close">
    <div class="dialog-container">
      <div class="dialog-header">
        <h2>{{ mode === 'save' ? '保存游戏' : '读取游戏' }}</h2>
        <button class="close-button" @click="close">✕</button>
      </div>
      <div class="dialog-content">
        <div class="save-slots">
          <div 
            v-for="slot in slots" 
            :key="slot.id" 
            class="save-slot"
            :class="{ 'has-save': slot.hasSave, 'empty': !slot.hasSave }"
            @click="selectSlot(slot.id)"
          >
            <div class="slot-header">
              <span class="slot-number">栏位 {{ slot.id }}</span>
              <button 
                v-if="slot.hasSave" 
                class="delete-button" 
                @click.stop="deleteSlot(slot.id)"
                title="删除存档"
              >
                🗑️
              </button>
            </div>
            <div v-if="slot.hasSave" class="slot-info">
              <p class="save-time">{{ formatTime(slot.timestamp) }}</p>
              <p class="save-details" v-if="slot.mapName">地图: {{ slot.mapName }}</p>
              <p class="save-details" v-if="slot.inBattle !== undefined">
                状态: {{ slot.inBattle ? '战斗中' : '非战斗' }}
              </p>
            </div>
            <div v-else class="slot-empty">
              <p>空栏位</p>
            </div>
          </div>
        </div>
      </div>
      <div class="dialog-footer">
        <button class="cancel-button" @click="close">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

interface SaveSlot {
  id: number;
  hasSave: boolean;
  timestamp?: number;
  mapName?: string;
  inBattle?: boolean;
}

const props = defineProps<{
  mode: 'save' | 'load';
  isVisible: boolean;
}>();

const emit = defineEmits<{
  close: [];
  select: [slotId: number];
}>();

const slots = ref<SaveSlot[]>([]);

const TOTAL_SLOTS = 10;

onMounted(() => {
  loadSlotInfo();
});

const loadSlotInfo = () => {
  const slotList: SaveSlot[] = [];
  for (let i = 1; i <= TOTAL_SLOTS; i++) {
    const saveData = localStorage.getItem(`gameState_slot_${i}`);
    if (saveData) {
      try {
        const data = JSON.parse(saveData);
        slotList.push({
          id: i,
          hasSave: true,
          timestamp: data.timestamp,
          mapName: data.mapName || '未知',
          inBattle: data.inBattle
        });
      } catch (e) {
        slotList.push({
          id: i,
          hasSave: false
        });
      }
    } else {
      slotList.push({
        id: i,
        hasSave: false
      });
    }
  }
  slots.value = slotList;
};

const selectSlot = (slotId: number) => {
  const slot = slots.value.find(s => s.id === slotId);
  
  if (props.mode === 'save') {
    // 保存模式：任何栏位都可以选择
    if (slot?.hasSave) {
      if (confirm(`栏位 ${slotId} 已有存档，是否覆盖？`)) {
        emit('select', slotId);
      }
    } else {
      emit('select', slotId);
    }
  } else {
    // 读取模式：只能选择有存档的栏位
    if (slot?.hasSave) {
      emit('select', slotId);
    } else {
      alert('该栏位没有存档！');
    }
  }
};

const deleteSlot = (slotId: number) => {
  if (confirm(`确定要删除栏位 ${slotId} 的存档吗？此操作不可恢复！`)) {
    localStorage.removeItem(`gameState_slot_${slotId}`);
    loadSlotInfo();
  }
};

const formatTime = (timestamp?: number) => {
  if (!timestamp) return '未知时间';
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const close = () => {
  emit('close');
};

// 监听 isVisible 变化，重新加载栏位信息
import { watch } from 'vue';
watch(() => props.isVisible, (newVal) => {
  if (newVal) {
    loadSlotInfo();
  }
});
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.dialog-container {
  background: #2a2a2a;
  border-radius: 10px;
  width: 90%;
  max-width: 900px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  color: #ffffff;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 2px solid #444;
}

.dialog-header h2 {
  margin: 0;
  font-size: 24px;
  color: #fff;
}

.close-button {
  background: transparent;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  transition: all 0.2s;
}

.close-button:hover {
  background: #444;
  color: #fff;
}

.dialog-content {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.save-slots {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.save-slot {
  background: #3a3a3a;
  border: 2px solid #555;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 100px;
}

.save-slot:hover {
  border-color: #4caf50;
  background: #404040;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
}

.save-slot.has-save {
  border-color: #4caf50;
}

.save-slot.empty {
  border-style: dashed;
  border-color: #666;
}

.slot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.slot-number {
  font-weight: bold;
  font-size: 16px;
  color: #4caf50;
}

.delete-button {
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 5px;
  border-radius: 3px;
  transition: all 0.2s;
}

.delete-button:hover {
  background: #ff5252;
}

.slot-info {
  color: #ccc;
}

.save-time {
  font-size: 14px;
  margin: 5px 0;
  color: #fff;
}

.save-details {
  font-size: 12px;
  margin: 3px 0;
  color: #aaa;
}

.slot-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60px;
  color: #666;
  font-style: italic;
}

.dialog-footer {
  padding: 15px 20px;
  border-top: 2px solid #444;
  display: flex;
  justify-content: flex-end;
}

.cancel-button {
  padding: 10px 30px;
  background: #666;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.cancel-button:hover {
  background: #777;
}

.cancel-button:active {
  background: #555;
}

@media (max-width: 768px) {
  .save-slots {
    grid-template-columns: 1fr;
  }
}
</style>
