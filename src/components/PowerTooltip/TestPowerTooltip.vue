<template>
  <div class="test-container">
    <h2>威能详情悬浮窗测试</h2>
    
    <div class="test-powers">
      <button 
        v-for="power in testPowers" 
        :key="power.name"
        class="test-power-btn"
        @mouseenter="showTooltip(power, $event)"
        @mouseleave="hideTooltip"
        @mousemove="updateTooltipPosition($event)">
        {{ power.displayName }}
      </button>
    </div>
    
    <PowerTooltip 
      :power="tooltipPower" 
      :visible="tooltipVisible" 
      :mouseX="mouseX" 
      :mouseY="mouseY" 
    />
  </div>
</template>

<script setup>
import PowerTooltip from '@/components/PowerTooltip/PowerTooltip.vue'
import { ref } from 'vue'

// 悬浮窗相关数据
const tooltipVisible = ref(false)
const tooltipPower = ref(null)
const mouseX = ref(0)
const mouseY = ref(0)

// 测试威能数据
const testPowers = ref([
  {
    name: "IceRays",
    displayName: "冰冻射线",
    description: "你发射出一道寒冷的射线，对目标造成冰霜伤害并减缓其行动。",
    actionType: "standard",
    useType: "encounter",
    level: "1",
    powersource: "arcane",
    keyWords: ["cold", "implement"],
    rangeText: "远程 20",
    target: "一个生物",
    area: 0,
    requirements: "法器",
    cooldown: 0,
    currentCooldown: 0,
    maxUses: 1,
    currentUses: 0,
    prepared: true,
    hitText: "1d6+4点寒冷伤害，目标减速（豁免终止）",
    missText: "一半伤害，无额外效果",
    effectText: "攻击前，你可以移动1格而不引发借机攻击",
    canUse: () => true
  },
  {
    name: "ChargeAttack",
    displayName: "冲锋攻击",
    description: "你向敌人发起强力冲锋，造成额外伤害并可能击倒目标。",
    actionType: "standard",
    useType: "atwill",
    level: "1",
    powersource: "martial",
    keyWords: ["weapon"],
    rangeText: "近战 武器",
    target: "一个生物",
    area: 0,
    requirements: "近战武器",
    cooldown: 0,
    currentCooldown: 0,
    maxUses: -1,
    currentUses: 0,
    prepared: true,
    hitText: "1d8+4点伤害，目标后退1格，如果撞到障碍则倒地",
    missText: null,
    effectText: "此攻击的伤害骰获得+2加值",
    canUse: () => true
  },
  {
    name: "HealingWord",
    displayName: "治疗之言",
    description: "你说出充满治疗力量的话语，为盟友恢复生命值。",
    actionType: "minor",
    useType: "encounter",
    level: "1",
    powersource: "divine",
    keyWords: ["healing"],
    rangeText: "远程 5",
    target: "一个盟友",
    area: 0,
    requirements: "",
    cooldown: 0,
    currentCooldown: 2,
    maxUses: 1,
    currentUses: 1,
    prepared: true,
    hitText: "目标恢复1d4+4点生命值并可立即进行一次豁免",
    missText: null,
    canUse: () => false
  },
  {
    name: "ComplexSpell",
    displayName: "复杂威能测试",
    description: "这是一个用于测试高度计算的复杂威能，包含了大量的描述文本来验证悬浮窗的位置调整是否正确工作。它应该能够根据内容的多少自动调整位置，避免超出屏幕边界。",
    actionType: "standard",
    useType: "daily",
    level: "5",
    powersource: "arcane",
    keyWords: ["fire", "thunder", "implement", "zone"],
    rangeText: "远程 20",
    target: "区域爆发3，目标区域内所有敌人",
    area: 3,
    requirements: "奥法法器",
    cooldown: 0,
    currentCooldown: 0,
    maxUses: 1,
    currentUses: 0,
    prepared: true,
    hitText: "3d6+5点火焰伤害和2d4点雷鸣伤害，目标被击倒并着火（持续伤害5，豁免终止）。在目标区域创建一个火焰地带，持续到遭遇结束，任何进入或在地带内开始回合的敌人受到5点火焰伤害。",
    missText: "一半火焰伤害，无雷鸣伤害，目标不被击倒，但仍然着火（持续伤害3，豁免终止）。仍然创建火焰地带但持续时间减半。",
    effectText: "施放此威能时，你获得抗火5直到遭遇结束，并且可以无视火焰地带的伤害",
    canUse: () => true
  }
])

// 悬浮窗方法
const showTooltip = (power, event) => {
  tooltipPower.value = power
  tooltipVisible.value = true
  updateTooltipPosition(event)
}

const hideTooltip = () => {
  tooltipVisible.value = false
  tooltipPower.value = null
}

const updateTooltipPosition = (event) => {
  mouseX.value = event.clientX
  mouseY.value = event.clientY
}
</script>

<style scoped>
.test-container {
  padding: 20px;
  background: #2c3e50;
  color: #fff;
  min-height: 100vh;
}

.test-powers {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
}

.test-power-btn {
  padding: 10px 15px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid #666;
  border-radius: 5px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.test-power-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}
</style>
