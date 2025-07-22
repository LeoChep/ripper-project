/**
 * Actor类和ActorConverter的测试
 */

import { describe, it, expect } from 'vitest';
import { Actor } from './class/Actor';
import { ActorConverter } from './converter/ActorConverter';
import { ActorPojo } from './type/ActorPojo';

describe('Actor System', () => {
  describe('Actor Class', () => {
    it('应该能创建默认Actor实例', () => {
      const actor = new Actor();
      
      expect(actor.name).toBe('');
      expect(actor.type).toBe('Player Character');
      expect(actor.level).toBe(1);
    });

    it('应该能设置和获取基础属性', () => {
      const actor = new Actor();
      
      actor.name = '测试角色';
      actor.level = 5;
      actor.race = '精灵';
      actor.characterClass = '法师';
      
      expect(actor.name).toBe('测试角色');
      expect(actor.level).toBe(5);
      expect(actor.race).toBe('精灵');
      expect(actor.characterClass).toBe('法师');
    });

    it('应该能正确计算属性修正值', () => {
      const actor = new Actor();
      
      actor.setAbilityScore('str', 16);
      actor.setAbilityScore('dex', 14);
      actor.setAbilityScore('con', 12);
      actor.setAbilityScore('int', 10);
      actor.setAbilityScore('wis', 8);
      actor.setAbilityScore('cha', 6);
      
      expect(actor.getAbilityModifier('str')).toBe(3);
      expect(actor.getAbilityModifier('dex')).toBe(2);
      expect(actor.getAbilityModifier('con')).toBe(1);
      expect(actor.getAbilityModifier('int')).toBe(0);
      expect(actor.getAbilityModifier('wis')).toBe(-1);
      expect(actor.getAbilityModifier('cha')).toBe(-2);
    });

    it('应该能正确管理生命值', () => {
      const actor = new Actor();
      actor.maxHP = 30;
      actor.currentHP = 30;
      
      // 测试受伤
      const damage = actor.takeDamage(10);
      expect(damage).toBe(10);
      expect(actor.currentHP).toBe(20);
      expect(actor.isBloodied).toBe(false); // 20 > 15 (30/2)
      
      // 受更多伤害到重伤状态
      actor.takeDamage(5);
      expect(actor.currentHP).toBe(15);
      expect(actor.isBloodied).toBe(true); // 15 <= 15
      
      // 测试治疗
      const healing = actor.heal(5);
      expect(healing).toBe(5);
      expect(actor.currentHP).toBe(20);
      expect(actor.isBloodied).toBe(false); // 不再重伤
      
      // 测试临时生命值
      actor.tempHP = 5;
      const tempDamage = actor.takeDamage(3);
      expect(tempDamage).toBe(0); // 临时HP承受了伤害
      expect(actor.tempHP).toBe(2);
      expect(actor.currentHP).toBe(20);
    });

    it('应该能正确计算防御值', () => {
      const actor = new Actor();
      actor.level = 5;
      actor.setAbilityScore('dex', 16); // +3修正
      
      // AC计算应该包含等级的一半
      const expectedLevelBonus = Math.ceil(5 / 2); // 3
      const minAC = 10 + expectedLevelBonus; // 基础AC + 等级奖励
      
      expect(actor.ac).toBeGreaterThanOrEqual(minAC);
    });

    it('应该能正确处理技能', () => {
      const actor = new Actor();
      actor.level = 3;
      actor.setAbilityScore('dex', 16); // +3修正
      
      // 训练杂技技能
      actor.trainSkill('acr', 'trained');
      
      const skillMod = actor.getSkillModifier('acr');
      const expectedMin = 3 + 5 + Math.floor(3 / 2); // 敏捷修正 + 训练 + 等级的一半
      
      expect(skillMod).toBeGreaterThanOrEqual(expectedMin);
      expect(actor.isSkillTrained('acr')).toBe(true);
    });

    it('应该能正确计算先攻', () => {
      const actor = new Actor();
      actor.level = 4;
      actor.setAbilityScore('dex', 14); // +2修正
      
      const initMod = actor.initiativeModifier;
      const expectedMin = 2 + Math.floor(4 / 2); // 敏捷修正 + 等级的一半
      
      expect(initMod).toBeGreaterThanOrEqual(expectedMin);
      
      // 测试先攻投骰
      const roll = actor.rollInitiative();
      expect(roll).toBeGreaterThanOrEqual(1 + initMod);
      expect(roll).toBeLessThanOrEqual(20 + initMod);
    });

    it('应该能正确处理行动点', () => {
      const actor = new Actor();
      
      expect(actor.actionPoints).toBe(1);
      
      const spent = actor.spendActionPoint();
      expect(spent).toBe(true);
      expect(actor.actionPoints).toBe(0);
      
      const spentAgain = actor.spendActionPoint();
      expect(spentAgain).toBe(false);
      expect(actor.actionPoints).toBe(0);
      
      actor.restoreActionPoint();
      expect(actor.actionPoints).toBe(1);
    });

    it('应该能正确处理抗性和易伤', () => {
      const actor = new Actor();
      
      // 设置火焰抗性
      actor.setResistance('fire', 5);
      actor.setVulnerability('cold', 3);
      actor.setImmunity('force', true);
      
      expect(actor.getResistance('fire')).toBe(5);
      expect(actor.getVulnerability('cold')).toBe(3);
      expect(actor.isImmuneTo('force')).toBe(true);
      
      // 测试伤害修正
      expect(actor.applyDamageModifiers(10, 'fire')).toBe(5); // 10 - 5抗性
      expect(actor.applyDamageModifiers(10, 'cold')).toBe(13); // 10 + 3易伤
      expect(actor.applyDamageModifiers(10, 'force')).toBe(0); // 免疫
    });

    it('应该能正确处理移动力', () => {
      const actor = new Actor();
      
      expect(actor.speed).toBeGreaterThanOrEqual(6); // 默认基础移动力
      expect(actor.walkSpeed).toBe(actor.speed);
      expect(actor.runSpeed).toBe(actor.speed + 2);
      expect(actor.climbSpeed).toBe(Math.floor(actor.speed / 2));
      expect(actor.swimSpeed).toBe(Math.floor(actor.speed / 2));
    });

    it('应该能正确处理升级', () => {
      const actor = new Actor();
      const originalLevel = actor.level;
      const originalMaxHP = actor.maxHP;
      
      actor.levelUp();
      
      expect(actor.level).toBe(originalLevel + 1);
      expect(actor.maxHP).toBeGreaterThan(originalMaxHP);
    });

    it('应该能正确验证角色有效性', () => {
      const actor = new Actor();
      
      expect(actor.isValid()).toBe(false); // 缺少必要信息
      
      actor.name = '测试角色';
      actor.race = '人类';
      actor.characterClass = '战士';
      actor.level = 1;
      actor.maxHP = 20;
      
      expect(actor.isValid()).toBe(true);
    });

    it('应该能正确导出和导入JSON', () => {
      const actor = new Actor();
      actor.name = '测试角色';
      actor.level = 5;
      actor.setAbilityScore('str', 16);
      
      const json = actor.toJSON();
      const newActor = Actor.fromJSON(json);
      
      expect(newActor.name).toBe('测试角色');
      expect(newActor.level).toBe(5);
      expect(newActor.getAbilityScore('str')).toBe(16);
    });
  });

  describe('ActorConverter', () => {
    it('应该能从JSON数据创建Actor', () => {
      const jsonData = {
        name: '转换器测试',
        type: 'Player Character',
        system: {
          details: {
            level: 3,
            race: '矮人',
            class: '圣武士'
          },
          abilities: {
            str: { value: 18, chat: '@name uses @label.' }
          }
        }
      };
      
      const actor = ActorConverter.fromJSON(jsonData);
      
      expect(actor.name).toBe('转换器测试');
      expect(actor.level).toBe(3);
      expect(actor.race).toBe('矮人');
      expect(actor.characterClass).toBe('圣武士');
      expect(actor.getAbilityScore('str')).toBe(18);
    });

    it('应该能创建默认角色', () => {
      const actor = ActorConverter.createDefaultCharacter('默认角色');
      
      expect(actor.name).toBe('默认角色');
      expect(actor.type).toBe('Player Character');
      expect(actor.level).toBe(1);
      expect(actor.race).toBe('人类');
      expect(actor.characterClass).toBe('战士');
      expect(actor.isValid()).toBe(true);
    });

    it('应该能从乌金模板创建角色', () => {
      const actor = ActorConverter.createFromWukinTemplate();
      
      expect(actor.name).toBe('乌金');
      expect(actor.level).toBe(2);
      expect(actor.race).toBe('人类');
      expect(actor.characterClass).toBe('德鲁伊');
      expect(actor.getAbilityScore('wis')).toBe(20);
      expect(actor.getAbilityScore('dex')).toBe(14);
    });

    it('应该能验证Actor数据', () => {
      const validData = {
        name: '有效角色',
        system: {
          details: {
            level: 1,
            race: '人类',
            class: '战士'
          },
          abilities: {
            str: { value: 10 },
            con: { value: 10 },
            dex: { value: 10 },
            int: { value: 10 },
            wis: { value: 10 },
            cha: { value: 10 }
          },
          attributes: {
            hp: { max: 20 }
          }
        }
      };
      
      const invalidData = {
        name: '',
        system: {}
      };
      
      const validResult = ActorConverter.validateActorData(validData);
      const invalidResult = ActorConverter.validateActorData(invalidData);
      
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);
      
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });

    it('应该能修复不完整的数据', () => {
      const incompleteData = {
        name: '不完整角色'
      };
      
      const repairedData = ActorConverter.repairActorData(incompleteData);
      const validationResult = ActorConverter.validateActorData(repairedData);
      
      expect(validationResult.isValid).toBe(true);
      expect(repairedData.name).toBe('不完整角色');
      expect(repairedData.system.details.race).toBe('人类');
      expect(repairedData.system.abilities.str.value).toBe(10);
    });

    it('应该能比较两个Actor的差异', () => {
      const actor1 = ActorConverter.createDefaultCharacter('角色1');
      const actor2 = ActorConverter.createDefaultCharacter('角色2');
      
      actor2.level = 5;
      actor2.setAbilityScore('str', 16);
      actor2.currentHP = 15;
      
      const differences = ActorConverter.compareActors(actor1, actor2);
      
      expect(differences.name).toBeDefined();
      expect(differences.level).toBeDefined();
      expect(differences.strScore).toBeDefined();
      expect(differences.currentHP).toBeDefined();
    });

    it('应该能转换Actor为JSON和普通对象', () => {
      const actor = ActorConverter.createDefaultCharacter('测试');
      actor.setAbilityScore('str', 15);
      
      const json = ActorConverter.toJSON(actor);
      const plainObject = ActorConverter.toPlainObject(actor);
      
      expect(typeof json).toBe('string');
      expect(JSON.parse(json).name).toBe('测试');
      
      expect(plainObject.name).toBe('测试');
      expect(plainObject.system.abilities.str.value).toBe(15);
    });
  });
});
