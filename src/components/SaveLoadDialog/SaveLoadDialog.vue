<template>
  <div v-if="isVisible" class="dialog-overlay" @click.self="close">
    <div class="dialog-container">
      <div class="dialog-header">
        <h2>{{ mode === 'save' ? '保存游戏' : '读取游戏' }}</h2>
        <button class="close-button" @click="close">✕</button>
      </div>
      <div class="dialog-toolbar" v-if="mode === 'load'">
        <button class="import-button" @click="triggerFileImport">
          📁 导入存档文件
        </button>
        <input 
          ref="fileInputRef" 
          type="file" 
          accept=".json" 
          style="display: none" 
          @change="handleFileImport"
        />
      </div>
      <div class="dialog-content">
        <div class="save-slots">
          <div 
            v-for="slot in slots" 
            :key="slot.id" 
            class="save-slot"
            :class="{ 
              'has-save': slot.hasSave, 
              'empty': !slot.hasSave,
              'import-mode': importedGameState !== null && mode === 'load'
            }"
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
        <div v-if="importedGameState && mode === 'load'" class="import-hint">
          📥 已加载外部存档，请选择要导入到的栏位
        </div>
        <button class="cancel-button" @click="close">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

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
const fileInputRef = ref<HTMLInputElement | null>(null);
const importedGameState = ref<any>(null);

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
    // 读取模式：可以选择有存档的栏位，或者导入到该栏位
    if (importedGameState.value) {
      // 导入模式：将外部文件保存到选中的栏位
      if (slot?.hasSave) {
        if (confirm(`栏位 ${slotId} 已有存档，是否覆盖为导入的存档？`)) {
          saveImportedGameState(slotId);
        }
      } else {
        saveImportedGameState(slotId);
      }
    } else {
      // 正常读取模式
      if (slot?.hasSave) {
        emit('select', slotId);
      } else {
        alert('该栏位没有存档！');
      }
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
  importedGameState.value = null; // 关闭时清除导入的数据
  emit('close');
};

// 触发文件选择
const triggerFileImport = () => {
  fileInputRef.value?.click();
};

// 处理文件导入
const handleFileImport = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (!file) return;
  
  try {
    const text = await file.text();
    const gameState = JSON.parse(text);
    
    // 验证是否是有效的游戏存档
    if (!gameState.timestamp) {
      alert('无效的存档文件！');
      return;
    }
    
    importedGameState.value = gameState;
    alert(`成功读取存档文件！\n保存时间: ${new Date(gameState.timestamp).toLocaleString()}\n\n请选择要导入到哪个栏位。`);
    
    // 重置文件输入，以便可以重复导入同一文件
    target.value = '';
  } catch (error) {
    console.error('导入存档失败:', error);
    alert('导入失败！文件格式可能不正确。');
  }
};

// 保存导入的游戏状态到指定栏位
const saveImportedGameState = (slotId: number) => {
  if (!importedGameState.value) return;
  
  try {
    localStorage.setItem(`gameState_slot_${slotId}`, JSON.stringify(importedGameState.value));
    alert(`存档已导入到栏位 ${slotId}！`);
    importedGameState.value = null;
    loadSlotInfo(); // 刷新栏位信息
    emit('close');
  } catch (error) {
    console.error('保存导入的存档失败:', error);
    alert('保存失败！');
  }
};

// 监听 isVisible 变化，重新加载栏位信息
watch(() => props.isVisible, (newVal) => {
  if (newVal) {
    loadSlotInfo();
    importedGameState.value = null; // 打开时清除之前导入的数据
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

.dialog-toolbar {
  padding: 10px 20px;
  border-bottom: 1px solid #444;
  display: flex;
  justify-content: flex-start;
}

.import-button {
  padding: 8px 20px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 5px;
}

.import-button:hover {
  background: #1976d2;
  transform: translateY(-1px);
}

.import-button:active {
  background: #1565c0;
  transform: translateY(0);
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
  position: relative;
}

.save-slot:hover {
  border-color: #4caf50;
  background: #404040;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
}

.save-slot.import-mode {
  border-color: #2196f3;
  background: #404040;
}

.save-slot.import-mode:hover {
  border-color: #42a5f5;
  box-shadow: 0 4px 8px rgba(33, 150, 243, 0.5);
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
  justify-content: space-between;
  align-items: center;
}

.import-hint {
  color: #2196f3;
  font-size: 14px;
  font-weight: bold;
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
