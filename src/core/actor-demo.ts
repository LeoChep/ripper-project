/**
 * Actor系统使用演示
 */

import { Actor } from './class/Actor';
import { ActorConverter } from './converter/ActorConverter';

/**
 * 演示Actor系统的各种功能
 */
export function demonstrateActorSystem() {
  console.log('=== D&D 4E Actor系统演示 ===\n');

  // 1. 创建基础角色
  console.log('1. 创建基础角色:');
  const warrior = ActorConverter.createDefaultCharacter('勇敢的战士');
  warrior.race = '人类';
  warrior.characterClass = '战士';
  warrior.level = 3;
  
  // 设置属性
  warrior.setAbilityScore('str', 16);
  warrior.setAbilityScore('con', 14);
  warrior.setAbilityScore('dex', 12);
  warrior.setAbilityScore('wis', 10);
  warrior.setAbilityScore('int', 8);
  warrior.setAbilityScore('cha', 13);
  
  // 设置生命值
  warrior.maxHP = 35;
  warrior.currentHP = 35;
  
  // 训练技能
  warrior.trainSkill('ath', 'trained'); // 运动
  warrior.trainSkill('end', 'trained'); // 耐力
  warrior.trainSkill('hea', 'trained'); // 医疗
  
  console.log(warrior.getSummary());
  console.log(`先攻修正: +${warrior.initiativeModifier}`);
  console.log(`移动力: ${warrior.speed} 格`);
  console.log(`运动技能: +${warrior.getSkillModifier('ath')}`);
  console.log();

  // 2. 从乌金模板创建角色
  console.log('2. 从乌金模板创建角色:');
  const wukin = ActorConverter.createFromWukinTemplate();
  console.log(wukin.getSummary());
  console.log(`先攻修正: +${wukin.initiativeModifier}`);
  console.log(`感知技能: +${wukin.getSkillModifier('prc')}`);
  console.log();

  // 3. 演示战斗系统
  console.log('3. 战斗演示:');
  const enemy = ActorConverter.createDefaultCharacter('骷髅兵');
  enemy.race = '不死族';
  enemy.characterClass = '士兵';
  enemy.maxHP = 25;
  enemy.currentHP = 25;
  enemy.setAbilityScore('str', 14);
  enemy.setAbilityScore('dex', 10);
  
  console.log(`${warrior.name} vs ${enemy.name}`);
  console.log(`${warrior.name}: HP ${warrior.currentHP}/${warrior.maxHP}, AC ${warrior.ac}`);
  console.log(`${enemy.name}: HP ${enemy.currentHP}/${enemy.maxHP}, AC ${enemy.ac}`);
  
  // 先攻投骰
  const warriorInit = warrior.rollInitiative();
  const enemyInit = enemy.rollInitiative();
  console.log(`先攻: ${warrior.name} ${warriorInit}, ${enemy.name} ${enemyInit}`);
  
  const firstActor = warriorInit >= enemyInit ? warrior : enemy;
  const secondActor = warriorInit >= enemyInit ? enemy : warrior;
  console.log(`${firstActor.name} 先行动!`);
  
  // 模拟攻击
  const damage = 8; // 假设攻击命中造成8点伤害
  const actualDamage = secondActor.takeDamage(damage);
  console.log(`${firstActor.name} 攻击 ${secondActor.name}, 造成 ${actualDamage} 点伤害!`);
  console.log(`${secondActor.name} 剩余HP: ${secondActor.currentHP}/${secondActor.maxHP}`);
  
  if (secondActor.isBloodied) {
    console.log(`${secondActor.name} 进入重伤状态!`);
  }
  console.log();

  // 4. 演示抗性系统
  console.log('4. 抗性系统演示:');
  const elementalist = ActorConverter.createDefaultCharacter('元素法师');
  elementalist.setResistance('fire', 5); // 火焰抗性5
  elementalist.setVulnerability('cold', 3); // 冰冷易伤3
  elementalist.setImmunity('force', true); // 力场免疫
  
  console.log(`${elementalist.name} 的抗性:`);
  console.log(`- 火焰抗性: ${elementalist.getResistance('fire')}`);
  console.log(`- 冰冷易伤: ${elementalist.getVulnerability('cold')}`);
  console.log(`- 力场免疫: ${elementalist.isImmuneTo('force')}`);
  
  // 测试不同类型的伤害
  const fireDamage = elementalist.applyDamageModifiers(10, 'fire');
  const coldDamage = elementalist.applyDamageModifiers(10, 'cold');
  const forceDamage = elementalist.applyDamageModifiers(10, 'force');
  
  console.log(`受到10点火焰伤害 → 实际伤害: ${fireDamage}`);
  console.log(`受到10点冰冷伤害 → 实际伤害: ${coldDamage}`);
  console.log(`受到10点力场伤害 → 实际伤害: ${forceDamage}`);
  console.log();

  // 5. 演示升级系统
  console.log('5. 升级系统演示:');
  const originalLevel = warrior.level;
  const originalHP = warrior.maxHP;
  
  console.log(`升级前: ${warrior.name} ${originalLevel}级, 最大HP ${originalHP}`);
  warrior.levelUp();
  console.log(`升级后: ${warrior.name} ${warrior.level}级, 最大HP ${warrior.maxHP}`);
  console.log();

  // 6. 演示技能系统
  console.log('6. 技能系统演示:');
  const rogue = ActorConverter.createDefaultCharacter('盗贼');
  rogue.setAbilityScore('dex', 18); // 高敏捷
  rogue.trainSkill('stl', 'expertise'); // 专精潜行
  rogue.trainSkill('thi', 'trained'); // 训练盗贼技艺
  rogue.trainSkill('acr', 'trained'); // 训练杂技
  
  console.log(`${rogue.name} 的技能:`);
  console.log(`- 潜行(专精): +${rogue.getSkillModifier('stl')}`);
  console.log(`- 盗贼技艺(训练): +${rogue.getSkillModifier('thi')}`);
  console.log(`- 杂技(训练): +${rogue.getSkillModifier('acr')}`);
  console.log(`- 运动(未训练): +${rogue.getSkillModifier('ath')}`);
  console.log();

  // 7. 演示数据导出和导入
  console.log('7. 数据序列化演示:');
  const originalData = warrior.getData();
  const jsonString = warrior.toJSON();
  const restoredActor = Actor.fromJSON(jsonString);
  
  console.log(`原始角色: ${warrior.name}, 等级 ${warrior.level}`);
  console.log(`恢复角色: ${restoredActor.name}, 等级 ${restoredActor.level}`);
  console.log(`数据一致性: ${warrior.name === restoredActor.name && warrior.level === restoredActor.level ? '✓' : '✗'}`);
  console.log();

  // 8. 演示数据验证和修复
  console.log('8. 数据验证演示:');
  const invalidData = { name: '', system: {} };
  const validationResult = ActorConverter.validateActorData(invalidData);
  
  console.log(`无效数据验证结果:`);
  console.log(`- 是否有效: ${validationResult.isValid}`);
  console.log(`- 错误列表: ${validationResult.errors.join(', ')}`);
  
  const repairedData = ActorConverter.repairActorData(invalidData);
  const repairedValidation = ActorConverter.validateActorData(repairedData);
  
  console.log(`修复后验证结果:`);
  console.log(`- 是否有效: ${repairedValidation.isValid}`);
  console.log(`- 修复后角色名: ${repairedData.name}`);
  console.log();

  console.log('=== 演示完成 ===');
}

/**
 * 创建一个完整的冒险队伍
 */
export function createAdventureParty(): Actor[] {
  console.log('创建冒险队伍...\n');

  // 人类战士
  const fighter = ActorConverter.createDefaultCharacter('艾丹');
  fighter.race = '人类';
  fighter.characterClass = '战士';
  fighter.level = 4;
  fighter.setAbilityScore('str', 18);
  fighter.setAbilityScore('con', 16);
  fighter.setAbilityScore('dex', 12);
  fighter.maxHP = 45;
  fighter.currentHP = 45;
  fighter.trainSkill('ath', 'trained');
  fighter.trainSkill('end', 'trained');

  // 精灵法师
  const wizard = ActorConverter.createDefaultCharacter('艾莉雅');
  wizard.race = '精灵';
  wizard.characterClass = '法师';
  wizard.level = 4;
  wizard.setAbilityScore('int', 18);
  wizard.setAbilityScore('dex', 14);
  wizard.setAbilityScore('wis', 13);
  wizard.maxHP = 28;
  wizard.currentHP = 28;
  wizard.trainSkill('arc', 'trained');
  wizard.trainSkill('his', 'trained');

  // 半身人盗贼
  const rogue = ActorConverter.createDefaultCharacter('芬恩');
  rogue.race = '半身人';
  rogue.characterClass = '盗贼';
  rogue.level = 4;
  rogue.setAbilityScore('dex', 18);
  rogue.setAbilityScore('cha', 14);
  rogue.setAbilityScore('int', 13);
  rogue.maxHP = 35;
  rogue.currentHP = 35;
  rogue.trainSkill('stl', 'expertise');
  rogue.trainSkill('thi', 'trained');
  rogue.trainSkill('acr', 'trained');

  // 矮人牧师
  const cleric = ActorConverter.createDefaultCharacter('索林');
  cleric.race = '矮人';
  cleric.characterClass = '牧师';
  cleric.level = 4;
  cleric.setAbilityScore('wis', 18);
  cleric.setAbilityScore('str', 14);
  cleric.setAbilityScore('con', 15);
  cleric.maxHP = 38;
  cleric.currentHP = 38;
  cleric.trainSkill('hea', 'trained');
  cleric.trainSkill('rel', 'trained');

  const party = [fighter, wizard, rogue, cleric];

  console.log('冒险队伍成员:');
  party.forEach((member, index) => {
    console.log(`${index + 1}. ${member.getSummary()}`);
  });

  return party;
}

/**
 * 模拟一场简单的战斗
 */
export function simulateCombat(party: Actor[], enemies: Actor[]): void {
  console.log('\n=== 战斗开始! ===');
  
  // 计算先攻
  const allCombatants = [...party, ...enemies];
  const initiatives = allCombatants.map(actor => ({
    actor,
    initiative: actor.rollInitiative()
  }));
  
  // 按先攻排序
  initiatives.sort((a, b) => b.initiative - a.initiative);
  
  console.log('\n先攻顺序:');
  initiatives.forEach((combatant, index) => {
    console.log(`${index + 1}. ${combatant.actor.name} (先攻: ${combatant.initiative})`);
  });

  console.log('\n第1轮战斗:');
  
  // 简单的战斗模拟
  for (let i = 0; i < Math.min(initiatives.length, 4); i++) {
    const current = initiatives[i];
    const isPartyMember = party.includes(current.actor);
    const targets = isPartyMember ? enemies : party;
    const target = targets.find(t => t.currentHP > 0);
    
    if (target && current.actor.currentHP > 0) {
      const damage = Math.floor(Math.random() * 8) + 3; // 3-10伤害
      const actualDamage = target.takeDamage(damage);
      
      console.log(`${current.actor.name} 攻击 ${target.name}, 造成 ${actualDamage} 点伤害!`);
      console.log(`${target.name} HP: ${target.currentHP}/${target.maxHP}${target.isBloodied ? ' (重伤)' : ''}${target.isDying ? ' (倒下)' : ''}`);
    }
  }
  
  console.log('\n=== 战斗结束 ===');
}

// 如果直接运行此文件，执行演示
if (require.main === module) {
  demonstrateActorSystem();
  console.log('\n');
  const party = createAdventureParty();
  
  // 创建一些敌人
  const enemies = [
    ActorConverter.createDefaultCharacter('兽人战士'),
    ActorConverter.createDefaultCharacter('兽人弓手')
  ];
  
  enemies.forEach(enemy => {
    enemy.race = '兽人';
    enemy.characterClass = '士兵';
    enemy.maxHP = 30;
    enemy.currentHP = 30;
    enemy.setAbilityScore('str', 15);
    enemy.setAbilityScore('dex', 12);
  });
  
  simulateCombat(party, enemies);
}
