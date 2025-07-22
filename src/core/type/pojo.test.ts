/**
 * POJO类测试文件
 * 验证所有POJO类的创建和使用
 */

import { describe, it, expect } from 'vitest';
import { 
  PowerPojo, 
  AttackPowerPojo, 
  UnitPojo, 
  CreaturePojo,
  CombatStatePojo,
  GameSettingsPojo,
  PojoFactory,
  PojoValidator,
  PojoConverter
} from './index';

describe('POJO Classes', () => {
  
  describe('PowerPojo', () => {
    it('应该能创建基础Power POJO', () => {
      const powerPojo = new PowerPojo();
      powerPojo.name = "魔法石";
      powerPojo.id = "magic-stone";
      powerPojo.level = 1;
      powerPojo.actionType = "minor";
      powerPojo.isAtWill = true;
      powerPojo.range = 20;
      powerPojo.weaponType = "ranged";
      
      expect(powerPojo.name).toBe("魔法石");
      expect(powerPojo.id).toBe("magic-stone");
      expect(powerPojo.level).toBe(1);
      expect(powerPojo.isAtWill).toBe(true);
      expect(PojoValidator.validatePowerPojo(powerPojo)).toBe(true);
    });
    
    it('应该能创建AttackPower POJO', () => {
      const attackPowerPojo = new AttackPowerPojo();
      attackPowerPojo.name = "基础攻击";
      attackPowerPojo.id = "basic-attack";
      attackPowerPojo.level = 1;
      attackPowerPojo.actionType = "standard";
      attackPowerPojo.weaponType = "melee";
      attackPowerPojo.range = 1;
      attackPowerPojo.attackBonus = 5;
      attackPowerPojo.primaryAbility = "str";
      attackPowerPojo.targetDefense = "ac";
      attackPowerPojo.damageFormula = "1d8+3";
      attackPowerPojo.keywords = ["weapon"];
      
      expect(attackPowerPojo.name).toBe("基础攻击");
      expect(attackPowerPojo.attackBonus).toBe(5);
      expect(attackPowerPojo.keywords).toContain("weapon");
    });
  });
  
  describe('UnitPojo', () => {
    it('应该能创建Unit POJO', () => {
      const unitPojo = new UnitPojo();
      unitPojo.name = "战士";
      unitPojo.id = 1;
      unitPojo.x = 5;
      unitPojo.y = 3;
      unitPojo.direction = 0;
      unitPojo.party = "player";
      unitPojo.unitTypeName = "fighter";
      unitPojo.state = "idle";
      
      expect(unitPojo.name).toBe("战士");
      expect(unitPojo.id).toBe(1);
      expect(unitPojo.x).toBe(5);
      expect(unitPojo.y).toBe(3);
      expect(PojoValidator.validateUnitPojo(unitPojo)).toBe(true);
    });
    
    it('应该能创建Creature POJO', () => {
      const creaturePojo = new CreaturePojo();
      creaturePojo.name = "人类战士";
      creaturePojo.level = 3;
      creaturePojo.hp = 35;
      creaturePojo.bloodied = 17;
      creaturePojo.ac = 18;
      creaturePojo.fortitude = 15;
      creaturePojo.reflex = 13;
      creaturePojo.will = 12;
      creaturePojo.speed = 6;
      creaturePojo.initiative = 2;
      creaturePojo.type = "humanoid";
      creaturePojo.size = "Medium";
      creaturePojo.role = "Defender";
      
      expect(creaturePojo.name).toBe("人类战士");
      expect(creaturePojo.level).toBe(3);
      expect(creaturePojo.hp).toBe(35);
      expect(PojoValidator.validateCreaturePojo(creaturePojo)).toBe(true);
    });
  });
  
  describe('GameSystemPojo', () => {
    it('应该能创建CombatState POJO', () => {
      const combatStatePojo = new CombatStatePojo();
      combatStatePojo.isInCombat = true;
      combatStatePojo.currentTurn = 1;
      combatStatePojo.currentRound = 1;
      combatStatePojo.initiativeOrder = [];
      
      expect(combatStatePojo.isInCombat).toBe(true);
      expect(combatStatePojo.currentTurn).toBe(1);
      expect(combatStatePojo.currentRound).toBe(1);
    });
    
    it('应该能创建GameSettings POJO', () => {
      const gameSettingsPojo = new GameSettingsPojo();
      gameSettingsPojo.gridSize = 32;
      gameSettingsPojo.animationSpeed = 1.0;
      gameSettingsPojo.soundEnabled = true;
      gameSettingsPojo.musicEnabled = true;
      gameSettingsPojo.debugMode = false;
      
      expect(gameSettingsPojo.gridSize).toBe(32);
      expect(gameSettingsPojo.animationSpeed).toBe(1.0);
      expect(gameSettingsPojo.soundEnabled).toBe(true);
      expect(PojoValidator.validateGameSettingsPojo(gameSettingsPojo)).toBe(true);
    });
  });
  
  describe('PojoFactory', () => {
    it('应该能通过工厂创建默认POJO', () => {
      const defaultPower = PojoFactory.createDefaultPowerPojo();
      expect(defaultPower).toBeInstanceOf(PowerPojo);
      expect(defaultPower.name).toBe("");
      expect(defaultPower.level).toBe(1);
      
      const defaultUnit = PojoFactory.createDefaultUnitPojo();
      expect(defaultUnit).toBeInstanceOf(UnitPojo);
      expect(defaultUnit.id).toBe(0);
      
      const defaultCreature = PojoFactory.createDefaultCreaturePojo();
      expect(defaultCreature).toBeInstanceOf(CreaturePojo);
      expect(defaultCreature.level).toBe(1);
    });
  });
  
  describe('PojoConverter', () => {
    it('应该能从普通对象转换为POJO', () => {
      const plainObject = {
        name: "火球术",
        id: "fireball",
        level: 3,
        actionType: "standard",
        isAtWill: false,
        isEncounter: true,
        weaponType: "ranged",
        range: 10
      };
      
      const powerPojo = PojoConverter.toPowerPojo(plainObject);
      expect(powerPojo.name).toBe("火球术");
      expect(powerPojo.id).toBe("fireball");
      expect(powerPojo.level).toBe(3);
    });
    
    it('应该能转换为普通对象', () => {
      const powerPojo = new PowerPojo();
      powerPojo.name = "测试技能";
      powerPojo.id = "test-power";
      
      const plainObject = PojoConverter.toPlainObject(powerPojo);
      expect(plainObject.name).toBe("测试技能");
      expect(plainObject.id).toBe("test-power");
    });
    
    it('应该能深拷贝POJO', () => {
      const original = new PowerPojo();
      original.name = "原始技能";
      
      const cloned = PojoConverter.clonePojo(original);
      expect(cloned.name).toBe("原始技能");
      expect(cloned).not.toBe(original); // 不是同一个对象
      
      // 修改克隆对象不应影响原始对象
      cloned.name = "修改后的技能";
      expect(original.name).toBe("原始技能");
    });
  });
  
  describe('PojoValidator', () => {
    it('应该能验证Power POJO的有效性', () => {
      const validPower = new PowerPojo();
      validPower.name = "有效技能";
      validPower.id = "valid-power";
      validPower.level = 1;
      
      expect(PojoValidator.validatePowerPojo(validPower)).toBe(true);
      
      const invalidPower = new PowerPojo();
      // 缺少必要属性
      expect(PojoValidator.validatePowerPojo(invalidPower)).toBe(false);
    });
    
    it('应该能验证Unit POJO的有效性', () => {
      const validUnit = new UnitPojo();
      validUnit.name = "有效单位";
      validUnit.id = 1;
      validUnit.x = 0;
      validUnit.y = 0;
      
      expect(PojoValidator.validateUnitPojo(validUnit)).toBe(true);
      
      const invalidUnit = new UnitPojo();
      invalidUnit.id = -1; // 无效ID
      expect(PojoValidator.validateUnitPojo(invalidUnit)).toBe(false);
    });
    
    it('应该能验证Creature POJO的有效性', () => {
      const validCreature = new CreaturePojo();
      validCreature.name = "有效生物";
      validCreature.level = 1;
      validCreature.hp = 10;
      validCreature.ac = 10;
      
      expect(PojoValidator.validateCreaturePojo(validCreature)).toBe(true);
      
      const invalidCreature = new CreaturePojo();
      invalidCreature.hp = 0; // 无效HP
      expect(PojoValidator.validateCreaturePojo(invalidCreature)).toBe(false);
    });
  });
});
