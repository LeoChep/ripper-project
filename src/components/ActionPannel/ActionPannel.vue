<template>
  <div class="action-panel">
    <div class="panel-header">
      <h3>行动面板</h3>
    </div>
    
    <div class="initiative-info">
      <div class="info-row">
        <label>主动权值:</label>
        <span class="value">{{ initiativeValue }}</span>
      </div>
      
      <div class="info-row" v-if="owner">
        <label>所有者:</label>
        <span class="value">{{ owner.name || '未命名单位' }}</span>
      </div>
      
      <div class="info-row">
        <label>准备状态:</label>
        <span class="value" :class="{ 'ready': isReady, 'not-ready': !isReady }">
          {{ isReady ? '已准备' : '未准备' }}
        </span>
      </div>
    </div>
    
    <div class="action-counts">
      <h4>行动点数</h4>
      <div class="action-grid">
        <div class="action-item">
          <div class="action-label">标准行动</div>
          <div class="action-value">{{ standerActionNumber }}</div>
        </div>
        
        <div class="action-item">
          <div class="action-label">次要行动</div>
          <div class="action-value">{{ minorActionNumber }}</div>
        </div>
        
        <div class="action-item">
          <div class="action-label">移动行动</div>
          <div class="action-value">{{ moveActionNumber }}</div>
        </div>
      </div>
    </div>
    
    <!-- <div class="action-buttons">
      <button @click="resetInitiative" class="btn btn-secondary">
        重置主动权
      </button>
      <button @click="toggleReady" class="btn btn-primary">
        {{ isReady ? '取消准备' : '设为准备' }}
      </button>
    </div> -->
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useInitiativeStore } from '../../stores/initiativeStore'

// 使用 initiative store
const initiativeStore = useInitiativeStore()

// 计算属性，从 store 获取数据
const initiativeValue = computed(() => initiativeStore.getInitiativeValue)
const owner = computed(() => initiativeStore.getOwner)
const standerActionNumber = ref(1)
const minorActionNumber = ref(1)
const moveActionNumber = ref(1)
const isReady = computed(() => initiativeStore.isReady)

// 监听updata事件更新移动行动次数
initiativeStore.$onAction(({ name, args }) => {
  if (name === 'updateActionNumbers') {
    const [stander, minor, move] = args
    moveActionNumber.value = move
    standerActionNumber.value = stander
    minorActionNumber.value = minor
  }
})  
// 方法
const resetInitiative = () => {
  initiativeStore.resetInitiative()
}

const toggleReady = () => {
  initiativeStore.setReady(!isReady.value)
}
</script>

<style scoped>
.action-panel {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 20px;
  width: 300px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.panel-header {
  text-align: center;
  margin-bottom: 20px;
}

.panel-header h3 {
  margin: 0;
  color: #495057;
  font-weight: 600;
}

.initiative-info {
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #e9ecef;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row label {
  font-weight: 500;
  color: #6c757d;
}

.info-row .value {
  font-weight: 600;
  color: #212529;
}

.value.ready {
  color: #28a745;
}

.value.not-ready {
  color: #dc3545;
}

.action-counts {
  margin-bottom: 20px;
}

.action-counts h4 {
  margin: 0 0 15px 0;
  color: #495057;
  font-size: 16px;
  font-weight: 600;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.action-item {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 12px;
  text-align: center;
  transition: box-shadow 0.2s;
}

.action-item:hover {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.action-label {
  font-size: 12px;
  color: #6c757d;
  margin-bottom: 5px;
}

.action-value {
  font-size: 24px;
  font-weight: bold;
  color: #007bff;
}

.action-buttons {
  display: flex;
  gap: 10px;
  justify-content: space-between;
}

.btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #545b62;
}
</style>
