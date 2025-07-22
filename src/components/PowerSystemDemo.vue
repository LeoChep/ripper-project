<template>
  <div class="power-system-demo">
    <h3>技能系统演示</h3>
    
    <!-- 技能信息显示 -->
    <div v-if="viciousOffensive" class="power-info">
      <h4>{{ viciousOffensive.name }}</h4>
      <p><strong>类型:</strong> {{ viciousOffensive.actionType }} 动作</p>
      <p><strong>使用类型:</strong> {{ viciousOffensive.isAtWill ? '随意' : viciousOffensive.isEncounter ? '遭遇' : '每日' }}</p>
      <p><strong>范围:</strong> {{ viciousOffensive.range }} 格</p>
      <p><strong>主要能力:</strong> {{ viciousOffensive.getPrimaryAbility().toUpperCase() }}</p>
      <p><strong>目标防御:</strong> {{ viciousOffensive.getTargetDefense().toUpperCase() }}</p>
      
      <div class="power-description">
        <strong>描述:</strong>
        <div v-html="formatDescription(viciousOffensive.getHTMLDescription())"></div>
      </div>
      
      <div class="power-keywords">
        <strong>关键词:</strong>
        <span v-for="keyword in viciousOffensive.getKeywords()" :key="keyword" class="keyword">
          {{ keyword }}
        </span>
      </div>
    </div>

    <!-- 单位技能管理演示 -->
    <div v-if="selectedUnit && powerManager" class="unit-powers">
      <h4>{{ selectedUnit.name }} 的技能</h4>
      
      <div class="action-buttons">
        <button @click="addPowerToUnit" :disabled="!viciousOffensive">
          添加恶毒攻击到单位
        </button>
        <button @click="clearUnitPowers">
          清空技能
        </button>
      </div>
      
      <div class="power-list">
        <h5>可用技能 ({{ availablePowers.length }})</h5>
        <ul>
          <li v-for="power in availablePowers" :key="power.id" class="power-item">
            {{ power.name }}
            <span class="power-type">({{ power.actionType }})</span>
            <button @click="usePower(power)" :disabled="!canUsePower(power)">
              使用
            </button>
          </li>
        </ul>
      </div>
    </div>

    <!-- 操作日志 -->
    <div class="action-log">
      <h4>操作日志</h4>
      <div class="log-entries">
        <div v-for="(log, index) in actionLogs" :key="index" class="log-entry">
          {{ log }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { createViciousOffensivePower, setupUnitPowers, usePowerToAttack } from '@/core/power/examples';
import { PowerManager } from '@/core/power/PowerManager';
import { AttackPower } from '@/core/power/AttackPower';
import { Power } from '@/core/power/Power';
import type { Unit } from '@/core/units/Unit';
import { golbalSetting } from '@/core/golbalSetting';

// 响应式数据
const viciousOffensive = ref<AttackPower | null>(null);
const powerManager = ref<PowerManager | null>(null);
const selectedUnit = ref<Unit | null>(null);
const actionLogs = ref<string[]>([]);

// 计算属性
const availablePowers = computed(() => {
  if (!powerManager.value) return [];
  return powerManager.value.getAvailablePowers();
});

// 方法
const formatDescription = (desc: string): string => {
  return desc.replace(/\n/g, '<br>');
};

const addLog = (message: string) => {
  actionLogs.value.unshift(`[${new Date().toLocaleTimeString()}] ${message}`);
  // 保持日志条数不超过10条
  if (actionLogs.value.length > 10) {
    actionLogs.value = actionLogs.value.slice(0, 10);
  }
};

const addPowerToUnit = () => {
  if (viciousOffensive.value && powerManager.value) {
    powerManager.value.addPower(viciousOffensive.value);
    addLog(`已将"${viciousOffensive.value.name}"添加到${selectedUnit.value?.name}`);
  }
};

const clearUnitPowers = () => {
  if (powerManager.value) {
    powerManager.value.clear();
    addLog(`已清空${selectedUnit.value?.name}的所有技能`);
  }
};

const canUsePower = (power: Power): boolean => {
  if (!selectedUnit.value) return false;
  // 由于类型兼容性问题，这里暂时返回true
  // 在实际使用中需要确保Unit类型的一致性
  return true;
};

const usePower = async (power: Power) => {
  if (!selectedUnit.value) {
    addLog('未选择单位');
    return;
  }

  if (!golbalSetting.map) {
    addLog('地图未加载');
    return;
  }

  // 检查是否是攻击型技能
  if (!(power instanceof AttackPower)) {
    addLog('目前只支持攻击型技能');
    return;
  }

  // 模拟攻击一个随机位置
  const unitX = Math.floor(selectedUnit.value.x / 64);
  const unitY = Math.floor(selectedUnit.value.y / 64);
  const targetX = unitX + 1; // 攻击右侧一格
  const targetY = unitY;

  try {
    // 由于类型兼容性问题，暂时简化处理
    addLog(`${selectedUnit.value.name} 尝试使用 ${power.name}，目标位置: (${targetX}, ${targetY})`);
    
    // 这里可以调用实际的攻击逻辑
    // 需要解决Unit类型的兼容性问题后才能正常工作
    
  } catch (error) {
    addLog(`使用技能时发生错误: ${error}`);
  }
};

// 生命周期
onMounted(async () => {
  try {
    // 加载恶毒攻击技能
    viciousOffensive.value = await createViciousOffensivePower();
    addLog('成功加载恶毒攻击技能');

    // 获取当前选中的单位（这里需要根据实际情况获取）
    // 暂时使用一个模拟的单位
    if (golbalSetting.map?.sprites?.length) {
      selectedUnit.value = golbalSetting.map.sprites[0];
      if (selectedUnit.value) {
        // 由于类型兼容性问题，暂时创建一个简单的PowerManager
        powerManager.value = new PowerManager(selectedUnit.value as any);
        addLog(`选中单位: ${selectedUnit.value.name}`);
      }
    }
  } catch (error) {
    addLog(`初始化失败: ${error}`);
  }
});
</script>

<style scoped>
.power-system-demo {
  padding: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  border-radius: 8px;
  max-width: 800px;
  margin: 0 auto;
}

.power-info {
  background: rgba(255, 255, 255, 0.1);
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 20px;
}

.power-description {
  margin: 10px 0;
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
}

.power-keywords {
  margin: 10px 0;
}

.keyword {
  display: inline-block;
  background: #007bff;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  margin-right: 5px;
}

.unit-powers {
  background: rgba(255, 255, 255, 0.1);
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 20px;
}

.action-buttons {
  margin: 15px 0;
}

.action-buttons button {
  margin-right: 10px;
  padding: 8px 16px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.action-buttons button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.power-list ul {
  list-style: none;
  padding: 0;
}

.power-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: rgba(0, 0, 0, 0.3);
  margin: 5px 0;
  border-radius: 3px;
}

.power-type {
  color: #ffc107;
  font-size: 12px;
}

.power-item button {
  padding: 4px 12px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
}

.power-item button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.action-log {
  background: rgba(255, 255, 255, 0.1);
  padding: 15px;
  border-radius: 5px;
}

.log-entries {
  max-height: 200px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.3);
  padding: 10px;
  border-radius: 3px;
}

.log-entry {
  font-family: monospace;
  font-size: 12px;
  margin: 2px 0;
  color: #00ff00;
}
</style>
