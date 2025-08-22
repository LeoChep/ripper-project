<template>
  <div class="creature-info-overlay" v-if="creature" @click="$emit('close')">
    <div class="creature-info-panel" @click.stop>
      <!-- 装饰性边框 -->
      <div class="panel-ornament top-left"></div>
      <div class="panel-ornament top-right"></div>
      <div class="panel-ornament bottom-left"></div>
      <div class="panel-ornament bottom-right"></div>
      
      <!-- 关闭按钮 -->
      <div class="close-btn" @click="$emit('close')">✕</div>
      
      <!-- 标题栏 -->
      <div class="creature-header">
        <div class="creature-title">{{ creature.name }}</div>
        <div class="creature-subtitle">等级 {{ creature.level }} {{ creature.role }}</div>
      </div>
      
      <!-- 内容滚动区域 -->
      <div class="content-scroll">
        <!-- 基础信息卡片 -->
        <div class="info-card basic-info">
          <div class="card-title">基础信息</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">XP</span>
              <span class="value">{{ creature.xp }}</span>
            </div>
            <div class="info-item">
              <span class="label">体型</span>
              <span class="value">{{ creature.size }}</span>
            </div>
            <div class="info-item">
              <span class="label">类型</span>
              <span class="value">{{ creature.type }}</span>
            </div>
            <div class="info-item">
              <span class="label">阵营</span>
              <span class="value">{{ creature.alignment }}</span>
            </div>
          </div>
        </div>

        <!-- 生命值和防御卡片 -->
        <div class="info-card combat-stats">
          <div class="card-title">战斗数据</div>
          <div class="hp-display">
            <div class="hp-bar">
              <div class="hp-fill" :style="{ width: (creature.hp / (creature.hp + (creature.bloodied || 0))) * 100 + '%' }"></div>
              <div class="hp-text">HP: {{ creature.hp }} (血量线: {{ creature.bloodied }})</div>
            </div>
          </div>
          <div class="defense-grid">
            <div class="defense-item ac">
              <div class="defense-label">护甲等级</div>
              <div class="defense-value">{{ creature.ac }}</div>
            </div>
            <div class="defense-item fort">
              <div class="defense-label">强韧</div>
              <div class="defense-value">{{ creature.fortitude }}</div>
            </div>
            <div class="defense-item reflex-def">
              <div class="defense-label">反射</div>
              <div class="defense-value">{{ reflex }}</div>
            </div>
            <div class="defense-item will-def">
              <div class="defense-label">意志</div>
              <div class="defense-value">{{ will }}</div>
            </div>
          </div>
        </div>

        <!-- 移动和感官卡片 -->
        <div class="info-card mobility">
          <div class="card-title">机动性</div>
          <div class="mobility-info">
            <div class="speed-item">
              <span class="speed-icon">🏃</span>
              <span>速度: {{ creature.speed }}</span>
            </div>
            <div v-if="creature.fly" class="speed-item">
              <span class="speed-icon">🦅</span>
              <span>飞行: {{ creature.fly }}</span>
            </div>
            <div class="speed-item">
              <span class="speed-icon">👁️</span>
              <span>感官: {{ creature.senses }}</span>
            </div>
            <div class="speed-item">
              <span class="speed-icon">⚡</span>
              <span>先攻: {{ creature.initiative }}</span>
            </div>
          </div>
        </div>

        <!-- 能力值卡片 -->
        <div v-if="creature.abilities" class="info-card abilities">
          <div class="card-title">能力值</div>
          <div class="abilities-grid">
            <div v-for="(ability, name) in creature.abilities" :key="name" class="ability-item">
              <div class="ability-name">{{ name }}</div>
              <div class="ability-score">{{ ability.value }}</div>
              <div class="ability-modifier">({{ ability.modifier >= 0 ? '+' : '' }}{{ ability.modifier }})</div>
            </div>
          </div>
        </div>

        <!-- 抗性和免疫卡片 -->
        <div v-if="creature.immunities.length || creature.resistances.length" class="info-card resistances">
          <div class="card-title">抗性与免疫</div>
          <div v-if="creature.immunities.length" class="resistance-group">
            <div class="resistance-type immunity">
              <span class="resistance-icon">🛡️</span>
              <span class="resistance-label">免疫:</span>
              <span class="resistance-values">{{ creature.immunities.join(', ') }}</span>
            </div>
          </div>
          <div v-if="creature.resistances.length" class="resistance-group">
            <div class="resistance-type resistance">
              <span class="resistance-icon">🔰</span>
              <span class="resistance-label">抗性:</span>
              <span class="resistance-values">
                <span v-for="r in creature.resistances" :key="r.type" class="resist-item">
                  {{ r.type }} {{ r.value }}
                </span>
              </span>
            </div>
          </div>
        </div>

        <!-- 技能卡片 -->
        <div v-if="creature.skills.length" class="info-card skills">
          <div class="card-title">技能</div>
          <div class="skills-grid">
            <div v-for="s in creature.skills" :key="s.name" class="skill-item">
              <span class="skill-name">{{ s.name }}</span>
              <span class="skill-bonus">+{{ s.bonus }}</span>
            </div>
          </div>
        </div>

        <!-- 攻击方式卡片 -->
        <div v-if="creature.attacks.length" class="info-card attacks">
          <div class="card-title">⚔️ 攻击方式</div>
          <div class="attacks-list">
            <div v-for="atk in creature.attacks" :key="atk.name" class="attack-item">
              <div class="attack-header">
                <span class="attack-name">{{ atk.name }}</span>
                <span class="attack-type">{{ atk.type }} · {{ atk.action }}</span>
              </div>
              <div class="attack-details">
                <div v-if="atk.range" class="attack-stat">
                  <span class="stat-label">范围:</span>
                  <span class="stat-value">{{ atk.range }}</span>
                </div>
                <div class="attack-stat">
                  <span class="stat-label">攻击:</span>
                  <span class="stat-value">+{{ atk.attackBonus }} vs {{ atk.target }}</span>
                </div>
                <div class="attack-stat">
                  <span class="stat-label">伤害:</span>
                  <span class="stat-value">{{ atk.damage }}</span>
                </div>
              </div>
              <div v-if="atk.effect" class="attack-effect hit-effect">
                <span class="effect-label">命中效果:</span>
                <span class="effect-text">{{ atk.effect }}</span>
              </div>
              <div v-if="atk.missEffect" class="attack-effect miss-effect">
                <span class="effect-label">失手效果:</span>
                <span class="effect-text">{{ atk.missEffect }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 特性卡片 -->
        <div v-if="creature.traits.length" class="info-card traits">
          <div class="card-title">✨ 特性</div>
          <div class="traits-list">
            <div v-for="t in creature.traits" :key="t.name" class="trait-item">
              <div class="trait-name">{{ t.displayName || t.name }}</div>
              <div v-if="t.description" class="trait-description">{{ t.description }}</div>
            </div>
          </div>
        </div>

        <!-- 威能卡片 -->
        <div v-if="creature.powers.length" class="info-card powers">
          <div class="card-title">⚡ 威能</div>
          <div class="powers-list">
            <div v-for="power in creature.powers" :key="power.name" class="power-item">
              <div class="power-name">{{ power.displayName }}</div>
            </div>
          </div>
        </div>

        <!-- 装备卡片 -->
        <div v-if="creature.equipment.length" class="info-card equipment">
          <div class="card-title">🎒 装备</div>
          <div class="equipment-list">
            <span v-for="(item, index) in creature.equipment" :key="index" class="equipment-item">
              {{ item }}
            </span>
          </div>
        </div>

        <!-- 其他信息卡片 -->
        <div v-if="creature.languages.length || creature.notes.length" class="info-card misc">
          <div class="card-title">其他信息</div>
          <div v-if="creature.languages.length" class="misc-section">
            <span class="misc-label">语言:</span>
            <span class="misc-value">{{ creature.languages.join(', ') }}</span>
          </div>
          <div v-if="creature.notes.length" class="misc-section notes">
            <div class="misc-label">备注:</div>
            <div class="notes-list">
              <div v-for="n in creature.notes" :key="n" class="note-item">{{ n }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 底部按钮 -->
      <div class="panel-footer">
        <button class="fantasy-btn export-btn" @click="exportCreature">
          <span class="btn-icon">📄</span>
          导出数据
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ModifierSystem } from '@/core/system/ModifierSystem'
import type { Creature } from '@/core/units/Creature'
import type { Unit } from '@/core/units/Unit'
import { onMounted, ref } from 'vue'

defineEmits(['close'])
const will = ref('')
const reflex = ref('')

onMounted(() => {
  // 这里可以添加一些初始化逻辑
  const getValue = (valuePath: string) => {
    if (!props.unit) return ''
    let valueStack = ModifierSystem.getInstance().getValueStack(props.unit, valuePath);
    let result;
    result = valueStack.finalValue.toString();
    if (valueStack.modifiers.length > 0) {
      result += ` (${valueStack.modifiers.map(m => (m.value + ' ' + m.type)).join(', ')})`;
    }
    return result;
  }
  setInterval(() => {
    if (props.unit) {
      will.value = getValue('will');
      reflex.value = getValue('reflex');
    }

  }, 100);


})
// 获取威能类型文本
const getPowerTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    'atwill': '随意',
    'encounter': '遭遇',
    'daily': '每日',
    'utility': '辅助'
  }
  return typeMap[type] || type
}

// 获取动作类型文本
const getActionTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    'standard': '标准动作',
    'move': '移动动作',
    'minor': '次要动作',
    'free': '自由动作',
    'immediate': '立即动作'
  }
  return typeMap[type] || type
}

const props = defineProps<{ creature: Creature | null, unit: Unit | null }>()

const exportCreature = () => {
  if (!props.creature) return

  const dataStr = JSON.stringify(props.creature, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)

  const link = document.createElement('a')
  link.href = url
  link.download = `${props.creature.name || 'creature'}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
/* 奇幻风格覆盖层 */
.creature-info-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(2px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: overlayFadeIn 0.3s ease-out;
}

@keyframes overlayFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 奇幻面板主容器 */
.creature-info-panel {
  position: relative;
  background: linear-gradient(135deg, 
    #2c1810 0%, 
    #3d2415 25%, 
    #4a2c1a 50%, 
    #3d2415 75%, 
    #2c1810 100%);
  border: 3px solid #8b4513;
  border-radius: 12px;
  box-shadow: 
    0 0 30px rgba(139, 69, 19, 0.6),
    inset 0 2px 4px rgba(255, 215, 0, 0.1),
    inset 0 -2px 4px rgba(0, 0, 0, 0.3);
  width: 90vw;
  max-width: 800px;
  max-height: 85vh;
  overflow: hidden;
  animation: panelSlideIn 0.4s ease-out;
}

@keyframes panelSlideIn {
  from {
    transform: translateY(-50px) scale(0.9);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

/* 装饰性边框角饰 */
.panel-ornament {
  position: absolute;
  width: 30px;
  height: 30px;
  background: linear-gradient(45deg, #ffd700, #ff8c00, #ffd700);
  border: 2px solid #8b4513;
  transform: rotate(45deg);
  z-index: 1;
}

.panel-ornament.top-left {
  top: -15px;
  left: -15px;
}

.panel-ornament.top-right {
  top: -15px;
  right: -15px;
}

.panel-ornament.bottom-left {
  bottom: -15px;
  left: -15px;
}

.panel-ornament.bottom-right {
  bottom: -15px;
  right: -15px;
}

/* 关闭按钮 */
.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #dc143c, #8b0000);
  color: white;
  border: 2px solid #8b4513;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  z-index: 2;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

.close-btn:hover {
  background: linear-gradient(135deg, #ff1744, #dc143c);
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(220, 20, 60, 0.6);
}

/* 生物标题区域 */
.creature-header {
  padding: 20px 30px 15px;
  border-bottom: 2px solid #8b4513;
  background: linear-gradient(135deg, 
    rgba(255, 215, 0, 0.1),
    rgba(255, 140, 0, 0.1));
}

.creature-title {
  font-size: 28px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 
    2px 2px 4px rgba(0, 0, 0, 0.8),
    0 0 10px rgba(255, 215, 0, 0.5);
  margin-bottom: 5px;
}

.creature-subtitle {
  font-size: 16px;
  color: #daa520;
  font-style: italic;
}

/* 滚动内容区域 */
.content-scroll {
  max-height: calc(85vh - 200px);
  overflow-y: auto;
  padding: 20px 30px;
  scrollbar-width: thin;
  scrollbar-color: #8b4513 #2c1810;
}

.content-scroll::-webkit-scrollbar {
  width: 8px;
}

.content-scroll::-webkit-scrollbar-track {
  background: #2c1810;
  border-radius: 4px;
}

.content-scroll::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #8b4513, #daa520);
  border-radius: 4px;
}

.content-scroll::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #daa520, #ffd700);
}

/* 信息卡片通用样式 */
.info-card {
  background: linear-gradient(135deg, 
    rgba(61, 36, 21, 0.8), 
    rgba(44, 24, 16, 0.8));
  border: 2px solid rgba(139, 69, 19, 0.8);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 
    0 4px 8px rgba(0, 0, 0, 0.3),
    inset 0 1px 2px rgba(255, 215, 0, 0.1);
}

.card-title {
  font-size: 18px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(139, 69, 19, 0.5);
}

/* 基础信息网格 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.info-item .label {
  font-size: 12px;
  color: #daa520;
  margin-bottom: 4px;
}

.info-item .value {
  font-size: 16px;
  color: #ffd700;
  font-weight: bold;
}

/* 生命值显示 */
.hp-display {
  margin-bottom: 16px;
}

.hp-bar {
  position: relative;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid #8b4513;
  border-radius: 8px;
  height: 32px;
  overflow: hidden;
}

.hp-fill {
  height: 100%;
  background: linear-gradient(135deg, #dc143c, #ff4500, #dc143c);
  transition: width 0.3s ease;
}

.hp-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  font-size: 14px;
}

/* 防御值网格 */
.defense-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.defense-item {
  text-align: center;
  padding: 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  border: 1px solid rgba(139, 69, 19, 0.5);
}

.defense-label {
  font-size: 12px;
  color: #daa520;
  margin-bottom: 4px;
}

.defense-value {
  font-size: 18px;
  color: #ffd700;
  font-weight: bold;
}

/* 机动性信息 */
.mobility-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.speed-item {
  display: flex;
  align-items: center;
  color: #e6d3b7;
  font-size: 14px;
}

.speed-icon {
  margin-right: 8px;
  font-size: 16px;
}

/* 能力值网格 */
.abilities-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}

.ability-item {
  text-align: center;
  padding: 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  border: 1px solid rgba(139, 69, 19, 0.5);
}

.ability-name {
  font-size: 12px;
  color: #daa520;
  margin-bottom: 4px;
  font-weight: bold;
}

.ability-score {
  font-size: 16px;
  color: #ffd700;
  font-weight: bold;
}

.ability-modifier {
  font-size: 12px;
  color: #e6d3b7;
  margin-top: 2px;
}

/* 抗性和免疫 */
.resistance-group {
  margin-bottom: 12px;
}

.resistance-type {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #e6d3b7;
}

.resistance-icon {
  font-size: 18px;
}

.resistance-label {
  font-weight: bold;
  color: #daa520;
  min-width: 50px;
}

.resistance-values {
  flex: 1;
}

.resist-item {
  display: inline-block;
  background: rgba(0, 0, 0, 0.3);
  padding: 2px 8px;
  border-radius: 4px;
  margin-right: 8px;
  border: 1px solid rgba(139, 69, 19, 0.5);
}

/* 技能网格 */
.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
}

.skill-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  border: 1px solid rgba(139, 69, 19, 0.5);
}

.skill-name {
  color: #e6d3b7;
  font-size: 13px;
}

.skill-bonus {
  color: #ffd700;
  font-weight: bold;
}

/* 攻击列表 */
.attacks-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.attack-item {
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(139, 69, 19, 0.5);
  border-radius: 6px;
  padding: 12px;
}

.attack-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.attack-name {
  font-size: 16px;
  font-weight: bold;
  color: #ffd700;
}

.attack-type {
  font-size: 12px;
  color: #daa520;
  font-style: italic;
}

.attack-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px;
  margin-bottom: 8px;
}

.attack-stat {
  display: flex;
  justify-content: space-between;
}

.stat-label {
  color: #daa520;
  font-size: 13px;
}

.stat-value {
  color: #e6d3b7;
  font-weight: bold;
}

.attack-effect {
  margin-top: 8px;
  padding: 8px;
  border-radius: 4px;
  font-size: 13px;
}

.hit-effect {
  background: rgba(0, 100, 0, 0.2);
  border-left: 4px solid #32cd32;
}

.miss-effect {
  background: rgba(100, 0, 0, 0.2);
  border-left: 4px solid #dc143c;
}

.effect-label {
  font-weight: bold;
  color: #ffd700;
}

.effect-text {
  color: #e6d3b7;
  margin-left: 8px;
}

/* 特性列表 */
.traits-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.trait-item {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(139, 69, 19, 0.5);
  border-radius: 4px;
  padding: 10px;
}

.trait-name {
  font-weight: bold;
  color: #ffd700;
  margin-bottom: 4px;
}

.trait-description {
  color: #e6d3b7;
  font-size: 14px;
  line-height: 1.4;
}

/* 威能列表 */
.powers-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.power-item {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(139, 69, 19, 0.5);
  border-radius: 4px;
  padding: 8px 12px;
}

.power-name {
  color: #ffd700;
  font-weight: bold;
}

/* 装备列表 */
.equipment-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.equipment-item {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(139, 69, 19, 0.5);
  border-radius: 4px;
  padding: 4px 8px;
  color: #e6d3b7;
  font-size: 13px;
}

/* 其他信息 */
.misc-section {
  margin-bottom: 12px;
  color: #e6d3b7;
}

.misc-label {
  color: #daa520;
  font-weight: bold;
  margin-right: 8px;
}

.misc-value {
  color: #e6d3b7;
}

.notes-list {
  margin-top: 8px;
}

.note-item {
  background: rgba(0, 0, 0, 0.3);
  border-left: 3px solid #8b4513;
  padding: 8px 12px;
  margin-bottom: 8px;
  border-radius: 0 4px 4px 0;
  color: #e6d3b7;
  font-size: 14px;
  line-height: 1.4;
}

/* 面板底部 */
.panel-footer {
  padding: 20px 30px;
  border-top: 2px solid #8b4513;
  background: linear-gradient(135deg, 
    rgba(255, 215, 0, 0.05),
    rgba(255, 140, 0, 0.05));
  text-align: center;
}

/* 奇幻按钮 */
.fantasy-btn {
  background: linear-gradient(135deg, #8b4513, #daa520, #8b4513);
  border: 2px solid #654321;
  border-radius: 8px;
  color: #ffd700;
  font-weight: bold;
  font-size: 14px;
  padding: 10px 20px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 
    0 4px 8px rgba(0, 0, 0, 0.3),
    inset 0 1px 2px rgba(255, 215, 0, 0.2);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.fantasy-btn:hover {
  background: linear-gradient(135deg, #daa520, #ffd700, #daa520);
  color: #2c1810;
  transform: translateY(-2px);
  box-shadow: 
    0 6px 12px rgba(0, 0, 0, 0.4),
    inset 0 1px 2px rgba(255, 215, 0, 0.3),
    0 0 15px rgba(255, 215, 0, 0.3);
}

.fantasy-btn:active {
  transform: translateY(0);
  box-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.3),
    inset 0 1px 2px rgba(255, 215, 0, 0.2);
}

.btn-icon {
  font-size: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .creature-info-panel {
    width: 95vw;
    max-height: 90vh;
  }
  
  .content-scroll {
    padding: 15px 20px;
    max-height: calc(90vh - 180px);
  }
  
  .creature-header {
    padding: 15px 20px 12px;
  }
  
  .creature-title {
    font-size: 24px;
  }
  
  .defense-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .abilities-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .attack-details {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .abilities-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>