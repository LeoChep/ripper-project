import { ref, computed } from 'vue';
import { UnitSystem } from '../system/UnitSystem';

export interface WorldPoint {
  x: number;
  y: number;
  label?: string;
  color?: string;
}

export interface WorldPointGroup {
  id: string;
  name: string;
  points: WorldPoint[];
  visible: boolean;
  color: string;
  autoRefresh?: boolean;  // 是否自动刷新
  renderTracking?: boolean; // 是否为渲染跟踪模式
}

// 全局状态
const groups = ref<WorldPointGroup[]>([
  {
    id: 'test-rect',
    name: '测试矩形',
    points: [
      { x: 200, y: 200, label: '左上' },
      { x: 400, y: 200, label: '右上' },
      { x: 400, y: 400, label: '右下' },
      { x: 200, y: 400, label: '左下' },
    ],
    visible: false,
    color: '#ff0',
  },
]);

let idCounter = 0;
let refreshTimer: number | null = null;

// 渲染跟踪模式：存储单位ID到点索引的映射
const renderTrackingGroupId: string = 'render-tracking-units';
const unitIdToPointIndex = new Map<number | string, number>();

/**
 * 检查是否启用了渲染跟踪（模块级函数，供 UnitAnimSprite 直接调用）
 */
function isRenderTrackingEnabled(): boolean {
  const group = groups.value.find(g => g.id === renderTrackingGroupId);
  return group?.renderTracking ?? false;
}

/**
 * 在单位渲染时更新其位置到世界点（模块级函数，供 UnitAnimSprite 直接调用）
 * @param unitId 单位ID
 * @param x 世界坐标X
 * @param y 世界坐标Y
 * @param label 单位名称/标签
 */
export function updateUnitPositionOnRender(unitId: number | string, x: number, y: number, label: string = ''): void {
  // 检查是否启用了渲染跟踪
  if (!isRenderTrackingEnabled()) {
    return;
  }

  const group = groups.value.find(g => g.id === renderTrackingGroupId);
  if (!group) return;

  // 查找或创建该单位的点
  let pointIndex = unitIdToPointIndex.get(unitId);

  if (pointIndex === undefined) {
    // 新单位，添加点
    pointIndex = group.points.length;
    group.points.push({
      x,
      y,
      label: label || String(unitId),
    });
    unitIdToPointIndex.set(unitId, pointIndex);
  } else {
    // 已存在的单位，更新位置
    const point = group.points[pointIndex];
    if (point) {
      point.x = x;
      point.y = y;
      if (label) {
        point.label = label;
      }
    }
  }
}

/**
 * 世界点管理 Composable
 */
export function useWorldPoints() {
  /**
   * 获取所有组
   */
  const allGroups = computed(() => groups.value);

  /**
   * 获取可见的点（用于渲染）
   */
  const visiblePoints = computed(() => {
    const result: Array<{ group: WorldPointGroup; point: WorldPoint; index: number }> = [];
    for (const group of groups.value) {
      if (group.visible) {
        group.points.forEach((point, index) => {
          result.push({ group, point, index });
        });
      }
    }
    return result;
  });

  /**
   * 创建新组
   */
  function createGroup(name: string, color: string = '#ff0'): WorldPointGroup {
    const group: WorldPointGroup = {
      id: `group-${++idCounter}`,
      name,
      points: [],
      visible: true,
      color,
    };
    groups.value.push(group);
    return group;
  }

  /**
   * 删除组
   */
  function deleteGroup(groupId: string) {
    const index = groups.value.findIndex(g => g.id === groupId);
    if (index !== -1) {
      groups.value.splice(index, 1);
      // 如果删除的是自动刷新组，停止计时器
      stopAutoRefresh();
    }
  }

  /**
   * 切换组可见性
   */
  function toggleGroupVisible(groupId: string) {
    const group = groups.value.find(g => g.id === groupId);
    if (group) {
      group.visible = !group.visible;
    }
  }

  /**
   * 添加点到组
   */
  function addPoint(groupId: string, point: WorldPoint) {
    const group = groups.value.find(g => g.id === groupId);
    if (group) {
      group.points.push(point);
    }
  }

  /**
   * 更新组中的点
   */
  function updatePoint(groupId: string, index: number, point: WorldPoint) {
    const group = groups.value.find(g => g.id === groupId);
    if (group && group.points[index]) {
      group.points[index] = point;
    }
  }

  /**
   * 删除组中的点
   */
  function deletePoint(groupId: string, index: number) {
    const group = groups.value.find(g => g.id === groupId);
    if (group) {
      group.points.splice(index, 1);
    }
  }

  /**
   * 清空所有组
   */
  function clearAll() {
    stopAutoRefresh();
    disableRenderTracking();
    groups.value = [];
  }

  /**
   * 从 UnitSystem 同步所有单位到指定组
   * @param groupId 目标组ID，如果为空则创建新组
   * @param groupName 组名称
   * @param color 颜色
   */
  function syncUnitsToGroup(groupId: string | null = null, groupName: string = '单位位置', color: string = '#0f0'): string {
    const unitSystem = UnitSystem.getInstance();
    const units = unitSystem.getAllUnits();
    const aliveUnits = units.filter(u => u.state !== 'dead');

    let targetGroup: WorldPointGroup | null = null;

    if (groupId) {
      targetGroup = groups.value.find(g => g.id === groupId) || null;
    }

    // 如果没有找到目标组，创建新组
    if (!targetGroup) {
      targetGroup = createGroup(groupName, color);
      targetGroup.autoRefresh = false;
    }

    // 清空现有点
    targetGroup.points = [];

    // 添加所有单位位置
    for (const unit of aliveUnits) {
      targetGroup.points.push({
        x: unit.x,
        y: unit.y,
        label: unit.name || unit.id.toString(),
      });
    }

    return targetGroup.id;
  }

  /**
   * 创建自动刷新的单位位置组
   */
  function createAutoRefreshUnitsGroup(groupName: string = '单位位置(自动)', color: string = '#0f0', interval: number = 500): string {
    // 先停止之前的自动刷新
    stopAutoRefresh();

    // 同步单位位置
    const groupId = syncUnitsToGroup(null, groupName, color);

    // 标记为自动刷新组
    const group = groups.value.find(g => g.id === groupId);
    if (group) {
      group.autoRefresh = true;
    }

    // 启动定时器
    refreshTimer = window.setInterval(() => {
      syncUnitsToGroup(groupId, groupName, color);
    }, interval);

    return groupId;
  }

  /**
   * 停止自动刷新
   */
  function stopAutoRefresh() {
    if (refreshTimer !== null) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }

    // 清除所有组的自动刷新标记
    for (const group of groups.value) {
      if (group.autoRefresh) {
        group.autoRefresh = false;
      }
    }
  }

  /**
   * 检查是否有自动刷新正在运行
   */
  function isAutoRefreshing(): boolean {
    return refreshTimer !== null;
  }

  /**
   * 启用渲染跟踪模式
   * 在单位渲染时自动更新其位置到世界点
   */
  function enableRenderTracking(groupName: string = '单位位置(渲染跟踪)', color: string = '#0f0'): string {
    // 先清除已有的跟踪组
    disableRenderTracking();

    // 检查是否已存在跟踪组
    let group = groups.value.find(g => g.id === renderTrackingGroupId);
    if (!group) {
      group = createGroup(groupName, color);
      group.id = renderTrackingGroupId;
      group.renderTracking = true;
    } else {
      group.name = groupName;
      group.color = color;
      group.renderTracking = true;
      group.points = [];
    }

    // 清空映射
    unitIdToPointIndex.clear();

    return renderTrackingGroupId;
  }

  /**
   * 禁用渲染跟踪模式
   */
  function disableRenderTracking() {
    const group = groups.value.find(g => g.id === renderTrackingGroupId);
    if (group) {
      group.renderTracking = false;
    }
    unitIdToPointIndex.clear();
  }

  /**
   * 检查是否启用了渲染跟踪（内部版本，使用模块级函数）
   */
  function isRenderTrackingEnabledInternal(): boolean {
    const group = groups.value.find(g => g.id === renderTrackingGroupId);
    return group?.renderTracking ?? false;
  }

  /**
   * 移除已死亡单位的点
   */
  function removeDeadUnit(unitId: number | string): void {
    const pointIndex = unitIdToPointIndex.get(unitId);
    if (pointIndex !== undefined) {
      const group = groups.value.find(g => g.id === renderTrackingGroupId);
      if (group) {
        group.points.splice(pointIndex, 1);
        // 重建索引映射
        unitIdToPointIndex.clear();
        group.points.forEach((point, index) => {
          // 使用label作为临时key（单位ID）
          unitIdToPointIndex.set(point.label || index, index);
        });
      }
    }
  }

  return {
    allGroups,
    visiblePoints,
    createGroup,
    deleteGroup,
    toggleGroupVisible,
    addPoint,
    updatePoint,
    deletePoint,
    clearAll,
    syncUnitsToGroup,
    createAutoRefreshUnitsGroup,
    stopAutoRefresh,
    isAutoRefreshing,
    enableRenderTracking,
    disableRenderTracking,
    isRenderTrackingEnabled: isRenderTrackingEnabledInternal,
    removeDeadUnit,
  };
}
