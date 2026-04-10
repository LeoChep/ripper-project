<template>
  <div class="inventory-container">
    <div class="inventory-header">
      <h3>背包</h3>
      <div class="inventory-stats">
        <span class="stat-item">
          <span class="stat-label">道具数量:</span>
          <span class="stat-value">{{ totalItems }}</span>
        </span>
        <span class="stat-item">
          <span class="stat-label">总重量:</span>
          <span class="stat-value">{{ totalWeight.toFixed(1) }}</span>
        </span>
        <span class="stat-item">
          <span class="stat-label">总价值:</span>
          <span class="stat-value">{{ totalValue }}</span>
        </span>
      </div>
    </div>

    <div class="inventory-content">
      <!-- 如果背包为空 -->
      <div v-if="!inventory || inventory.length === 0" class="empty-inventory">
        <div class="empty-icon">📦</div>
        <p>背包是空的</p>
      </div>

      <!-- 道具列表 -->
      <div v-else class="item-list">
        <div
          v-for="item in inventory"
          :key="item.uid"
          class="item-card"
          :class="[`rarity-${item.rarity}`, `type-${item.type}`]"
          @click="selectItem(item)"
        >
          <div class="item-icon">
            <img v-if="item.icon" :src="item.icon" :alt="item.name" />
            <div v-else class="default-icon">{{ getItemIcon(item.type) }}</div>
          </div>

          <div class="item-info">
            <div class="item-header">
              <h4 class="item-name" :class="`rarity-${item.rarity}`">
                {{ item.name }}
              </h4>
              <span class="item-stack" v-if="item.maxStack > 1">
                x{{ item.stackCount }}
              </span>
            </div>
            
            <div class="item-type">
              {{ getTypeLabel(item.type) }} · {{ getRarityLabel(item.rarity) }}
            </div>
            
            <div class="item-description">{{ item.description }}</div>
            
            <div class="item-footer">
              <span class="item-weight">⚖️ {{ item.totalWeight.toFixed(1) }}</span>
              <span class="item-value">💰 {{ item.totalValue }}</span>
            </div>
          </div>

          <div class="item-actions">
            <button
              v-if="item.canUse"
              class="action-btn use-btn"
              @click.stop="useItem(item)"
              title="使用"
            >
              使用
            </button>
            <button
              v-if="item.canEquip"
              class="action-btn equip-btn"
              @click.stop="equipItem(item)"
              title="装备"
            >
              装备
            </button>
            <button
              class="action-btn give-btn"
              @click.stop="giveItem(item)"
              title="给予"
            >
              给予
            </button>
            <button
              class="action-btn drop-btn"
              @click.stop="dropItem(item)"
              title="丢弃"
            >
              丢弃
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 道具详情弹窗 -->
    <div v-if="selectedItem" class="item-detail-modal" @click="selectedItem = null">
      <div class="item-detail-content" @click.stop>
        <div class="detail-header">
          <h3 :class="`rarity-${selectedItem.rarity}`">{{ selectedItem.name }}</h3>
          <button class="close-detail" @click="selectedItem = null">✕</button>
        </div>
        
        <div class="detail-body">
          <div class="detail-row">
            <span class="detail-label">类型:</span>
            <span class="detail-value">{{ getTypeLabel(selectedItem.type) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">稀有度:</span>
            <span class="detail-value">{{ getRarityLabel(selectedItem.rarity) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">堆叠:</span>
            <span class="detail-value">{{ selectedItem.stackCount }} / {{ selectedItem.maxStack }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">重量:</span>
            <span class="detail-value">{{ selectedItem.weight }} (总: {{ selectedItem.totalWeight }})</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">价值:</span>
            <span class="detail-value">{{ selectedItem.value }} (总: {{ selectedItem.totalValue }})</span>
          </div>
          
          <div class="detail-description">
            <p>{{ selectedItem.description }}</p>
          </div>

          <!-- 自定义属性 -->
          <div v-if="selectedItem.properties && Object.keys(selectedItem.properties).length > 0" class="detail-properties">
            <h4>属性</h4>
            <div v-for="(value, key) in selectedItem.properties" :key="key" class="property-row">
              <span class="property-key">{{ key }}:</span>
              <span class="property-value">{{ value }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 选择目标单位弹窗 -->
    <div v-if="giveTargetItem" class="item-detail-modal" @click="giveTargetItem = null">
      <div class="give-target-content" @click.stop>
        <div class="detail-header">
          <h3>选择给予对象</h3>
          <button class="close-detail" @click="giveTargetItem = null">✕</button>
        </div>
        
        <div class="give-info">
          <p>将 <span class="item-highlight">{{ giveTargetItem.name }} x{{ giveStackAmount }}</span> 给予:</p>
          <div v-if="giveTargetItem.maxStack > 1" class="stack-control">
            <label>给予数量:</label>
            <input 
              type="number" 
              v-model.number="giveStackAmount" 
              :min="1" 
              :max="giveTargetItem.stackCount"
              class="stack-input"
            />
            <span class="stack-max">/ {{ giveTargetItem.stackCount }}</span>
          </div>
        </div>

        <div class="target-list">
          <div
            v-for="target in availableTargets"
            :key="target.id"
            class="target-card"
            @click="confirmGive(target)"
          >
            <div class="target-avatar">
              <img v-if="target.creature" :src="getUnitAvatar(target.unitTypeName)" :alt="target.name" />
              <div v-else class="default-avatar">👤</div>
            </div>
            <div class="target-info">
              <h4>{{ target.name }}</h4>
              <p class="target-stats">
                <span>背包: {{ target.inventory?.length || 0 }} 种道具</span>
              </p>
            </div>
          </div>

          <div v-if="availableTargets.length === 0" class="no-targets">
            <p>没有可用的目标单位</p>
            <p class="hint">（只能给予队伍中的其他角色）</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import type { Creature } from '@/core/units/Creature';
import type { Unit } from '@/core/units/Unit';
import type { Item } from '@/core/item/Item';
import { ItemType, ItemRarity } from '@/core/item/ItemInterface';
import { MessageTipSystem } from '@/core/system/MessageTipSystem';
import { golbalSetting } from '@/core/golbalSetting';
import { getUnitAvatar } from '@/utils/utils';
import { ItemSystem } from '@/core/item';

// 道具信息接口（用于UI显示）
interface ItemInfo {
  uid: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;
  icon?: string;
  stackCount: number;
  maxStack: number;
  weight: number;
  value: number;
  totalWeight: number;
  totalValue: number;
  canUse: boolean;
  canEquip: boolean;
  properties?: Record<string, any>;
}

const props = defineProps<{
  unit: Unit | null;
  creature: Creature | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const selectedItem = ref<ItemInfo | null>(null);
const giveTargetItem = ref<ItemInfo | null>(null);
const giveStackAmount = ref<number>(1);

// 静态数据 - 不使用响应式
const inventory = ref<ItemInfo[]>([]);
const totalItems = ref(0);
const totalWeight = ref(0);
const totalValue = ref(0);

/**
 * 手动刷新背包数据
 * 不依赖 Vue 响应式，避免性能问题
 */
const updateFunc = () => {
  if (!props.unit) return;

  const items: ItemInfo[] = [];
  let totalCount = 0;
  let totalW = 0;
  let totalV = 0;

  for (const item of props.unit.inventory) {
    if (!item) continue;
    const itemInfo: ItemInfo = {
      uid: item.uid,
      name: item.name,
      description: item.description,
      type: item.type,
      rarity: item.rarity,
      icon: item.icon,
      stackCount: item.stackCount,
      maxStack: item.maxStack,
      weight: item.weight,
      value: item.value,
      totalWeight: item.getTotalWeight(),
      totalValue: item.getTotalValue(),
      canUse: item.canUse,
      canEquip: item.canEquip,
      properties: item.properties,
    };
    items.push(itemInfo);
    totalCount += item.stackCount;
    totalW += itemInfo.totalWeight;
    totalV += itemInfo.totalValue;
  }

  inventory.value = items;
  totalItems.value = totalCount;
  totalWeight.value = totalW;
  totalValue.value = totalV;
};

// 获取道具图标
const getItemIcon = (type: ItemType): string => {
  const icons: Record<ItemType, string> = {
    [ItemType.WEAPON]: '⚔️',
    [ItemType.ARMOR]: '🛡️',
    [ItemType.CONSUMABLE]: '🧪',
    [ItemType.QUEST]: '📜',
    [ItemType.MATERIAL]: '🔨',
    [ItemType.MISC]: '📦',
  };
  return icons[type] || '❓';
};

// 获取类型标签
const getTypeLabel = (type: ItemType): string => {
  const labels: Record<ItemType, string> = {
    [ItemType.WEAPON]: '武器',
    [ItemType.ARMOR]: '护甲',
    [ItemType.CONSUMABLE]: '消耗品',
    [ItemType.QUEST]: '任务物品',
    [ItemType.MATERIAL]: '材料',
    [ItemType.MISC]: '杂项',
  };
  return labels[type] || '未知';
};

// 获取稀有度标签
const getRarityLabel = (rarity: ItemRarity): string => {
  const labels: Record<ItemRarity, string> = {
    [ItemRarity.COMMON]: '普通',
    [ItemRarity.UNCOMMON]: '罕见',
    [ItemRarity.RARE]: '稀有',
    [ItemRarity.EPIC]: '史诗',
    [ItemRarity.LEGENDARY]: '传说',
  };
  return labels[rarity] || '未知';
};

// 获取可用的目标单位（队伍中的其他玩家角色）
const availableTargets = ref<Unit[]>([]);

const updateAvailableTargets = () => {
  if (!props.unit) {
    availableTargets.value = [];
    return;
  }

  const map = golbalSetting.map;
  if (!map || !map.sprites) {
    availableTargets.value = [];
    return;
  }

  // 获取所有玩家单位，排除自己
  availableTargets.value = map.sprites.filter((unit: Unit) =>
    unit.party === 'player' &&
    unit.id !== props.unit?.id &&
    unit.state !== 'dead'
  );
};

// 组件挂载时初始化
onMounted(() => {
  updateFunc();
  updateAvailableTargets();
  // 设置背包更新回调
  ItemSystem.getInstance().setUpdateInventoryFunc(() => {
    updateFunc();
    updateAvailableTargets();
  });
});

// 组件卸载时清理
onUnmounted(() => {
  // 清除背包更新回调
  ItemSystem.getInstance().setUpdateInventoryFunc(null);
});

/**
 * 通过 uid 从原始背包中查找 Item 对象
 */
const findOriginalItem = (uid: string): Item | null => {
  if (!props.unit) return null;
  return props.unit.inventory.find(item => item?.uid === uid) || null;
};

// 选择道具
const selectItem = (itemInfo: ItemInfo) => {
  selectedItem.value = itemInfo;
};

// 开始给予道具
const giveItem = (itemInfo: ItemInfo) => {
  giveTargetItem.value = itemInfo;
  giveStackAmount.value = itemInfo.stackCount;
};

// 确认给予道具
const confirmGive = async (target: any) => {
  if (!giveTargetItem.value || !props.unit) return;

  const itemInfo = giveTargetItem.value;
  const amount = itemInfo.maxStack > 1 ? giveStackAmount.value : itemInfo.stackCount;

  // 验证数量
  if (amount <= 0 || amount > itemInfo.stackCount) {
    MessageTipSystem.getInstance().setMessageQuickly('给予数量无效');
    return;
  }

  // 从当前单位移除道具
  const removedItem = props.unit.removeItem(itemInfo.uid, amount);
  if (!removedItem) {
    MessageTipSystem.getInstance().setMessageQuickly('移除道具失败');
    return;
  }

  // 添加到目标单位
  const success = target.addItem(removedItem);
  if (success) {
    MessageTipSystem.getInstance().setMessageQuickly(
      `已将 ${itemInfo.name} x${amount} 给予 ${target.name}`
    );
    console.log(`道具转移: ${itemInfo.name} x${amount} 从 ${props.unit.name} 到 ${target.name}`);
  } else {
    // 如果添加失败，把道具还回去
    props.unit.addItem(removedItem);
    MessageTipSystem.getInstance().setMessageQuickly('目标背包已满或添加失败');
  }

  // 关闭弹窗
  giveTargetItem.value = null;
};

// 使用道具
const useItem = async (itemInfo: ItemInfo) => {
  if (!itemInfo.canUse || !props.unit) {
    return;
  }

  // 查找原始 Item 对象
  const originalItem = findOriginalItem(itemInfo.uid);
  if (!originalItem) {
    MessageTipSystem.getInstance().setMessageQuickly('道具不存在');
    return;
  }

  console.log('使用道具:', itemInfo.name);

  // 使用道具
  ItemSystem.getInstance().useItem(originalItem, props.unit);

  // 使用后自动关闭背包界面
  emit('close');
};

// 装备道具
const equipItem = (itemInfo: ItemInfo) => {
  if (!itemInfo.canEquip) {
    return;
  }

  console.log('装备道具:', itemInfo.name);
  // 这里可以添加实际的装备逻辑
  alert(`装备了 ${itemInfo.name} (功能待实现)`);
};

// 丢弃道具
const dropItem = async (itemInfo: ItemInfo) => {
  if (!props.unit) {
    return;
  }

  const confirmed = await MessageTipSystem.getInstance().confirm(`确定要丢弃 ${itemInfo.name} (x${itemInfo.stackCount}) 吗？`);
  if (confirmed) {
    props.unit.removeItem(itemInfo.uid);
    console.log('丢弃道具:', itemInfo.name);
  }
};
</script>

<style scoped>
.inventory-container {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.inventory-header {
  margin-bottom: 20px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 15px;
}

.inventory-header h3 {
  color: #ffd700;
  font-size: 24px;
  margin: 0 0 10px 0;
  font-family: "Cinzel", serif;
}

.inventory-stats {
  display: flex;
  gap: 20px;
  font-size: 14px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.stat-label {
  color: rgba(255, 255, 255, 0.7);
}

.stat-value {
  color: #ffd700;
  font-weight: bold;
}

.inventory-content {
  flex: 1;
  overflow-y: auto;
}

/* 空背包 */
.empty-inventory {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: rgba(255, 255, 255, 0.5);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

/* 道具列表 */
.item-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 道具卡片 */
.item-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.item-card:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 215, 0, 0.5);
  transform: translateX(5px);
}

/* 稀有度边框颜色 */
.item-card.rarity-common {
  border-left: 3px solid #9d9d9d;
}

.item-card.rarity-uncommon {
  border-left: 3px solid #1eff00;
}

.item-card.rarity-rare {
  border-left: 3px solid #0070dd;
}

.item-card.rarity-epic {
  border-left: 3px solid #a335ee;
}

.item-card.rarity-legendary {
  border-left: 3px solid #ff8000;
}

/* 道具图标 */
.item-icon {
  width: 50px;
  height: 50px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
}

.item-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.default-icon {
  font-size: 28px;
}

/* 道具信息 */
.item-info {
  flex: 1;
  min-width: 0;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.item-name {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
}

.item-name.rarity-common {
  color: #9d9d9d;
}

.item-name.rarity-uncommon {
  color: #1eff00;
}

.item-name.rarity-rare {
  color: #0070dd;
}

.item-name.rarity-epic {
  color: #a335ee;
}

.item-name.rarity-legendary {
  color: #ff8000;
}

.item-stack {
  color: #ffd700;
  font-size: 14px;
  font-weight: bold;
}

.item-type {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 4px;
}

.item-description {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-footer {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

/* 道具操作 */
.item-actions {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.action-btn {
  padding: 4px 12px;
  font-size: 12px;
  border: 1px solid;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: rgba(0, 0, 0, 0.3);
  color: white;
}

.use-btn {
  border-color: #4caf50;
}

.use-btn:hover {
  background: #4caf50;
}

.equip-btn {
  border-color: #2196f3;
}

.equip-btn:hover {
  background: #2196f3;
}

.give-btn {
  border-color: #ff9800;
}

.give-btn:hover {
  background: #ff9800;
}

.drop-btn {
  border-color: #f44336;
}

.drop-btn:hover {
  background: #f44336;
}

/* 道具详情弹窗 */
.item-detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.item-detail-content {
  background: linear-gradient(135deg, #2d1b4e 0%, #1a0f2e 100%);
  border: 2px solid #ffd700;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.3);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.detail-header h3 {
  margin: 0;
  font-size: 24px;
  font-family: "Cinzel", serif;
}

.close-detail {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-detail:hover {
  color: #ffd700;
}

.detail-body {
  padding: 20px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.detail-label {
  color: rgba(255, 255, 255, 0.7);
  font-weight: bold;
}

.detail-value {
  color: #ffd700;
}

.detail-description {
  margin-top: 15px;
  padding: 15px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
}

.detail-properties {
  margin-top: 15px;
}

.detail-properties h4 {
  color: #ffd700;
  margin: 0 0 10px 0;
}

.property-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.property-key {
  color: rgba(255, 255, 255, 0.7);
}

.property-value {
  color: white;
  font-weight: bold;
}

/* 滚动条样式 */
.inventory-content::-webkit-scrollbar,
.item-detail-content::-webkit-scrollbar {
  width: 8px;
}

.inventory-content::-webkit-scrollbar-track,
.item-detail-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.inventory-content::-webkit-scrollbar-thumb,
.item-detail-content::-webkit-scrollbar-thumb {
  background: rgba(255, 215, 0, 0.3);
  border-radius: 4px;
}

.inventory-content::-webkit-scrollbar-thumb:hover,
.item-detail-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 215, 0, 0.5);
}

/* 给予目标选择弹窗 */
.give-target-content {
  background: linear-gradient(135deg, #2d1b4e 0%, #1a0f2e 100%);
  border: 2px solid #ff9800;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 0 30px rgba(255, 152, 0, 0.3);
}

.give-info {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.give-info p {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
}

.item-highlight {
  color: #ff9800;
  font-weight: bold;
}

.stack-control {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 15px;
}

.stack-control label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

.stack-input {
  width: 80px;
  padding: 6px 10px;
  border: 1px solid rgba(255, 152, 0, 0.5);
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.3);
  color: white;
  font-size: 14px;
}

.stack-input:focus {
  outline: none;
  border-color: #ff9800;
}

.stack-max {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}

.target-list {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.target-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(255, 152, 0, 0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.target-card:hover {
  background: rgba(255, 152, 0, 0.1);
  border-color: #ff9800;
  transform: translateX(5px);
}

.target-avatar {
  width: 60px;
  height: 60px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 152, 0, 0.5);
  border-radius: 50%;
  overflow: hidden;
}

.target-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.default-avatar {
  font-size: 32px;
}

.target-info {
  flex: 1;
}

.target-info h4 {
  margin: 0 0 5px 0;
  color: #ffd700;
  font-size: 18px;
}

.target-stats {
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.no-targets {
  text-align: center;
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.5);
}

.no-targets p {
  margin: 10px 0;
}

.no-targets .hint {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.3);
}
</style>
