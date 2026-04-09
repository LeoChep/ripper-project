<template>
  <div class="world-point-panel">
    <h3>世界点管理</h3>

    <!-- 单位同步区域 -->
    <div class="unit-sync-section">
      <div class="section-title">单位同步</div>
      <div class="sync-buttons">
        <button
          @click="syncUnitsOnce"
          :disabled="isAutoRefreshing()"
          class="sync-btn"
        >
          📋 同步单位位置
        </button>
        <button
          @click="toggleAutoRefresh"
          :class="{ active: isAutoRefreshing() }"
          class="auto-refresh-btn"
        >
          {{ isAutoRefreshing() ? '⏹️ 停止自动刷新' : '▶️ 自动刷新' }}
        </button>
      </div>
      <div v-if="isAutoRefreshing()" class="auto-refresh-info">
        每 {{ refreshInterval }}ms 自动刷新
      </div>

      <!-- 渲染跟踪开关 -->
      <div class="render-track-section">
        <button
          @click="toggleRenderTracking"
          :class="{ active: isRenderTrackingEnabled() }"
          class="render-track-btn"
        >
          {{ isRenderTrackingEnabled() ? '🎬 停止渲染跟踪' : '🎬 启用渲染跟踪' }}
        </button>
        <div v-if="isRenderTrackingEnabled()" class="render-track-info">
          渲染时自动更新单位位置
        </div>
      </div>
    </div>

    <div v-if="allGroups.length === 0" class="empty-state">
      暂无点组
    </div>

    <div v-for="group in allGroups" :key="group.id" class="group-card">
      <div class="group-header">
        <input
          v-model="group.name"
          class="group-name-input"
          placeholder="组名称"
        />
        <div class="group-controls">
          <span v-if="group.autoRefresh" class="auto-badge" title="自动刷新">🔄</span>
          <button
            @click="toggleGroupVisible(group.id)"
            :class="{ active: group.visible }"
            :title="group.visible ? '隐藏' : '显示'"
          >
            {{ group.visible ? '👁️' : '👁️‍🗨️' }}
          </button>
          <button @click="deleteGroup(group.id)" class="delete-btn" title="删除组">
            🗑️
          </button>
        </div>
      </div>

      <div class="color-picker-row">
        <span>颜色:</span>
        <input
          type="color"
          v-model="group.color"
          class="color-picker"
        />
        <span :style="{ color: group.color }">{{ group.color }}</span>
        <span class="point-count">({{ group.points.length }} 点)</span>
      </div>

      <div class="points-list">
        <div v-if="group.points.length === 0" class="empty-points">
          暂无点
        </div>
        <div
          v-for="(point, index) in group.points"
          :key="index"
          class="point-row"
        >
          <input
            v-model.number="point.x"
            type="number"
            placeholder="X"
            class="coord-input"
          />
          <input
            v-model.number="point.y"
            type="number"
            placeholder="Y"
            class="coord-input"
          />
          <input
            v-model="point.label"
            type="text"
            placeholder="标签"
            class="label-input"
          />
          <button
            @click="deletePoint(group.id, index)"
            class="delete-point-btn"
          >
            ✕
          </button>
        </div>
      </div>

      <button @click="addPointToGroup(group.id)" class="add-point-btn" :disabled="group.autoRefresh">
        + 添加点
      </button>
    </div>

    <div class="panel-footer">
      <button @click="createNewGroup" class="create-group-btn">
        + 新建组
      </button>
      <button @click="clearAll" class="clear-all-btn">
        清空所有
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWorldPoints } from '@/core/composables/useWorldPoints';

const refreshInterval = 500; // 刷新间隔(ms)

const {
  allGroups,
  createGroup,
  deleteGroup,
  toggleGroupVisible,
  addPoint,
  deletePoint,
  clearAll,
  syncUnitsToGroup,
  createAutoRefreshUnitsGroup,
  stopAutoRefresh,
  isAutoRefreshing,
  enableRenderTracking,
  disableRenderTracking,
  isRenderTrackingEnabled,
} = useWorldPoints();

let unitsGroupId: string | null = null;

function syncUnitsOnce() {
  unitsGroupId = syncUnitsToGroup(unitsGroupId, '单位位置', '#0f0');
}

function toggleAutoRefresh() {
  if (isAutoRefreshing()) {
    stopAutoRefresh();
  } else {
    unitsGroupId = createAutoRefreshUnitsGroup('单位位置(自动)', '#0f0', refreshInterval);
  }
}

function toggleRenderTracking() {
  if (isRenderTrackingEnabled()) {
    disableRenderTracking();
  } else {
    enableRenderTracking('单位位置(渲染跟踪)', '#0f0');
  }
}

function addPointToGroup(groupId: string) {
  addPoint(groupId, { x: 0, y: 0, label: '' });
}

function createNewGroup() {
  createGroup(`组 ${allGroups.value.length + 1}`, `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`);
}
</script>

<style scoped>
.world-point-panel {
  background: #222;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 16px;
  min-width: 280px;
  max-height: 600px;
  overflow-y: auto;
}

.world-point-panel h3 {
  margin: 0 0 12px 0;
  color: #fff;
  font-size: 14px;
  border-bottom: 1px solid #444;
  padding-bottom: 8px;
}

.empty-state {
  color: #666;
  text-align: center;
  padding: 20px;
  font-size: 12px;
}

.unit-sync-section {
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
}

.section-title {
  color: #888;
  font-size: 11px;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.sync-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.sync-btn,
.auto-refresh-btn {
  flex: 1;
  padding: 8px;
  border: 1px solid #444;
  border-radius: 4px;
  background: #333;
  color: #fff;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.sync-btn:hover:not(:disabled),
.auto-refresh-btn:hover {
  background: #444;
  border-color: #0af;
}

.sync-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.auto-refresh-btn.active {
  background: #0a6;
  border-color: #084;
}

.auto-refresh-info {
  color: #0a6;
  font-size: 11px;
  text-align: center;
}

.render-track-section {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #333;
}

.render-track-btn {
  width: 100%;
  padding: 8px;
  border: 1px solid #444;
  border-radius: 4px;
  background: #333;
  color: #fff;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.render-track-btn:hover {
  background: #444;
  border-color: #0af;
}

.render-track-btn.active {
  background: #060;
  border-color: #040;
}

.render-track-info {
  color: #060;
  font-size: 11px;
  text-align: center;
  margin-top: 4px;
}

.auto-badge {
  font-size: 12px;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.point-count {
  margin-left: auto;
  color: #666;
  font-size: 11px;
}

.group-card {
  background: #2a2a2a;
  border: 1px solid #333;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.group-name-input {
  background: #333;
  border: 1px solid #555;
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 13px;
  flex: 1;
  margin-right: 8px;
}

.group-name-input:focus {
  outline: none;
  border-color: #0af;
}

.group-controls {
  display: flex;
  gap: 4px;
}

.group-controls button {
  background: #333;
  border: 1px solid #555;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.group-controls button:hover {
  background: #444;
}

.group-controls button.active {
  background: #0af;
  border-color: #08f;
}

.group-controls button.delete-btn {
  border-color: #a33;
}

.group-controls button.delete-btn:hover {
  background: #a33;
}

.color-picker-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 12px;
  color: #aaa;
}

.color-picker {
  width: 32px;
  height: 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: none;
}

.points-list {
  margin-bottom: 8px;
}

.empty-points {
  color: #666;
  text-align: center;
  padding: 8px;
  font-size: 11px;
}

.point-row {
  display: flex;
  gap: 6px;
  margin-bottom: 6px;
}

.coord-input {
  width: 70px;
  background: #333;
  border: 1px solid #555;
  color: #fff;
  padding: 4px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.coord-input:focus {
  outline: none;
  border-color: #0af;
}

.label-input {
  flex: 1;
  background: #333;
  border: 1px solid #555;
  color: #fff;
  padding: 4px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.label-input:focus {
  outline: none;
  border-color: #0af;
}

.delete-point-btn {
  background: #333;
  border: 1px solid #a33;
  color: #a33;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.delete-point-btn:hover {
  background: #a33;
  color: #fff;
}

.add-point-btn {
  width: 100%;
  background: #333;
  border: 1px dashed #555;
  color: #0af;
  border-radius: 4px;
  padding: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.add-point-btn:hover {
  background: #3a3a3a;
  border-color: #0af;
}

.panel-footer {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.create-group-btn,
.clear-all-btn {
  flex: 1;
  padding: 8px;
  border: 1px solid #555;
  border-radius: 4px;
  background: #333;
  color: #fff;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.create-group-btn:hover {
  background: #444;
  border-color: #0af;
}

.clear-all-btn:hover {
  background: #a33;
  border-color: #f33;
}
</style>
