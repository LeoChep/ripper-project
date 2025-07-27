<template>
  <div class="creature-info" v-if="creature">
    <h2>{{ creature.name }}</h2>
    <div>等级：{{ creature.level }}　职业：{{ creature.role }}　XP：{{ creature.xp }}</div>
    <div>体型：{{ creature.size }}　类型：{{ creature.type }}</div>
    <div>HP：{{ creature.hp }}（血量线：{{ creature.bloodied }}）</div>
    <div>AC：{{ creature.ac }}　强韧：{{ creature.fortitude }}　反射：{{ creature.reflex }}　意志：{{ creature.will }}</div>
    <div>速度：{{ creature.speed }} <span v-if="creature.fly">飞行：{{ creature.fly }}</span></div>
    <div>先攻：{{ creature.initiative }}　感官：{{ creature.senses }}</div>
    <div v-if="creature.immunities.length">免疫：{{ creature.immunities.join('，') }}</div>
    <div v-if="creature.resistances.length">
      抗性：
      <span v-for="r in creature.resistances" :key="r.type">{{ r.type }} {{ r.value }}　</span>
    </div>
    <div v-if="creature.alignment">阵营：{{ creature.alignment }}</div>
    <div v-if="creature.languages.length">语言：{{ creature.languages.join('，') }}</div>
    <div v-if="creature.skills.length">
      技能：
      <span v-for="s in creature.skills" :key="s.name">{{ s.name }}+{{ s.bonus }}　</span>
    </div>
    <div v-if="creature.abilities.length">
      能力值：
      <span v-for="a in creature.abilities" :key="String(a.name)">{{ a.name }} {{ a.value }} ({{ a.modifier >= 0 ? '+' : ''}}{{ a.modifier }})　</span>
    </div>
    <div v-if="creature.equipment.length">装备：{{ creature.equipment.join('，') }}</div>
    <div v-if="creature.weapons && creature.weapons.length">
      <h3>武器</h3>
      <div v-for="weapon in creature.weapons" :key="weapon.name" class="weapon-item">
        <div>
          <b>{{ weapon.name }}</b>　类型：{{ weapon.type }}
        </div>
        <div>伤害：{{ weapon.damage }}　攻击加值：+{{ weapon.bonus }}</div>
        <div v-if="weapon.range">射程：{{ weapon.range }}</div>
        <div v-if="weapon.properties && weapon.properties.length">
          属性：{{ weapon.properties.join('，') }}
        </div>
        <div v-if="weapon.weight">重量：{{ weapon.weight }}</div>
        <div v-if="weapon.cost">价格：{{ weapon.cost }}</div>
        <div v-if="weapon.description">描述：{{ weapon.description }}</div>
      </div>
    </div>
    <div v-if="creature.attacks.length">
      <h3>攻击方式</h3>
      <ul>
        <li v-for="atk in creature.attacks" :key="atk.name">
          <b>{{ atk.name }}</b>（{{ atk.type }}，{{ atk.action }}）<br>
          <span v-if="atk.range">范围：{{ atk.range }}　</span>
          攻击加值：+{{ atk.attackBonus }} vs {{ atk.target }}<br>
          伤害：{{ atk.damage }}<br>
          <span v-if="atk.effect">效果：{{ atk.effect }}<br></span>
          <span v-if="atk.missEffect">失手：{{ atk.missEffect }}<br></span>
        </li>
      </ul>
    </div>
    <div v-if="creature.traits.length">
      <h3>特性</h3>
      <ul>
        <li v-for="t in creature.traits" :key="t.name">
          <b>{{ t.displayName || t.name }}</b>
          <span v-if="t.description">: {{ t.description }}</span>
        </li>
      </ul>
    </div>
    <div v-if="creature.powers.length">
      <h3>威能</h3>
      <ul>
        <li v-for="power in creature.powers" :key="power.name">
          <b>{{ power.displayName }}</b>
          <!-- <span v-if="power.subName"> ({{ power.subName }})</span>
          <br>
          <span>等级：{{ power.level }}　</span>
          <span>类型：{{ getPowerTypeText(power.useType) }}　</span>
          <span>动作：{{ getActionTypeText(power.actionType) }}　</span>
          <span v-if="power.powersource">能量源：{{ power.powersource }}</span>
          <br>
          <span v-if="power.rangeText">范围：{{ power.rangeText }}　</span>
          <span v-if="power.target">目标：{{ power.target }}　</span>
          <span v-if="power.area">区域：{{ power.area }}</span>
          <br>
          <span v-if="power.description">{{ power.description }}</span>
          <span v-if="power.keyWords&&power.keyWords.length && power.keyWords[0]">
            <br>关键词：{{ power.keyWords.join('，') }}
          </span> -->
        </li>
      </ul>
    </div>
    <div v-if="creature.notes.length">
      <h3>备注</h3>
      <ul>
        <li v-for="n in creature.notes" :key="n">{{ n }}</li>
      </ul>
    </div>
    <div class="button-group">
      <button @click="exportCreature">导出JSON</button>
      <button @click="$emit('close')">关闭</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Creature } from '@/core/units/Creature'

defineEmits(['close'])


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

const props = defineProps<{ creature: Creature | null }>()

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
.creature-info {
  position: fixed;
  top: 40px;
  right: 40px;
  background: #fff;
  border: 1px solid #888;
  border-radius: 8px;
  box-shadow: 0 2px 12px #0002;
  padding: 24px 32px;
  min-width: 350px;
  max-width: 500px;
  z-index: 1000;
  font-size: 15px;
}
.creature-info h2 {
  margin: 0 0 8px 0;
}
.creature-info h3 {
  margin: 12px 0 4px 0;
}
.creature-info ul {
  margin: 0 0 0 18px;
  padding: 0;
}
.creature-info button {
  margin-top: 16px;
}
.button-group {
  margin-top: 16px;
}
.button-group button {
  margin-top: 0;
  margin-right: 8px;
}
.weapon-item {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}
.weapon-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}
</style>