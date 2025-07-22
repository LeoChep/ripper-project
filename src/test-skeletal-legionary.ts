import { ActorConverter } from './core/converter/ActorConverter';
import skeletalLegionaryData from './assets/skeleton/Skeletal-Legionary-Complete.json';

// 测试骷髅士兵JSON转换
console.log('=== 骷髅士兵 Actor 转换测试 ===');

try {
  // 从JSON创建Actor对象
  const skeletalLegionary = ActorConverter.fromJSON(skeletalLegionaryData);
  
  console.log('✓ JSON转换成功');
  console.log('角色名称:', skeletalLegionary.name);
  console.log('等级:', skeletalLegionary.level);
  console.log('角色类型:', skeletalLegionary.type);
  console.log('生命值:', `${skeletalLegionary.currentHP}/${skeletalLegionary.maxHP}`);
  console.log('防御值:', {
    AC: skeletalLegionary.ac,
    强韧: skeletalLegionary.fortitude,
    反射: skeletalLegionary.reflex,
    意志: skeletalLegionary.will
  });
  console.log('属性调整值:', {
    力量: skeletalLegionary.getAbilityModifier('str'),
    体质: skeletalLegionary.getAbilityModifier('con'),
    敏捷: skeletalLegionary.getAbilityModifier('dex'),
    智力: skeletalLegionary.getAbilityModifier('int'),
    感知: skeletalLegionary.getAbilityModifier('wis'),
    魅力: skeletalLegionary.getAbilityModifier('cha')
  });
  console.log('速度:', skeletalLegionary.speed);
  console.log('先攻修正:', skeletalLegionary.initiativeModifier);
  console.log('侦查修正:', skeletalLegionary.getSkillModifier('prc'));
  
  // 测试基础状态
  console.log('\n=== 基础状态测试 ===');
  console.log('当前HP:', skeletalLegionary.currentHP);
  console.log('最大HP:', skeletalLegionary.maxHP);
  console.log('角色是否有效:', skeletalLegionary.isValid());
  
  // 测试抗性和免疫
  console.log('\n=== 抗性和免疫测试 ===');
  console.log('对疾病免疫:', skeletalLegionary.isImmuneTo('disease'));
  console.log('对毒素免疫:', skeletalLegionary.isImmuneTo('poison'));
  console.log('黯蚀抗性:', skeletalLegionary.getResistance('necrotic'));
  
  // 测试伤害
  console.log('\n=== 伤害测试 ===');
  console.log('受到1点伤害前 HP:', skeletalLegionary.currentHP);
  skeletalLegionary.takeDamage(1);
  console.log('受到1点伤害后 HP:', skeletalLegionary.currentHP);
  
  // 测试物品和威能
  console.log('\n=== 物品和威能测试 ===');
  console.log('威能数量:', skeletalLegionary.getPowers().length);
  console.log('装备数量:', skeletalLegionary.getEquippedItems().length);
  console.log('特质数量:', skeletalLegionary.getFeatures().length);
  
  // 显示角色摘要
  console.log('\n=== 角色摘要 ===');
  console.log(skeletalLegionary.getSummary());
  
} catch (error) {
  console.error('❌ 转换失败:', error);
}
