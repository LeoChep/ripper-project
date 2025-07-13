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
        <li v-for="t in creature.traits" :key="t">{{ t }}</li>
      </ul>
    </div>
    <div v-if="creature.notes.length">
      <h3>备注</h3>
      <ul>
        <li v-for="n in creature.notes" :key="n">{{ n }}</li>
      </ul>
    </div>
    <button @click="$emit('close')">关闭</button>
  </div>
</template>

<script setup lang="ts">
import type { Creature } from '@/core/units/Creature'
defineProps<{ creature: Creature | null }>()
defineEmits(['close'])
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
</style>