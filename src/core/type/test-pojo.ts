/**
 * POJO类测试文件
 * 验证所有POJO类的创建和使用
 */

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

/**
 * 测试Power POJO
 */
function testPowerPojo() {
  console.log('=== 测试Power POJO ===');
  
  // 创建基础Power POJO
  const powerPojo = new PowerPojo();
  powerPojo.name = "魔法石";
  powerPojo.id = "magic-stone";
  powerPojo.level = 1;
  powerPojo.actionType = "minor";
  powerPojo.isAtWill = true;
  powerPojo.range = 20;
  powerPojo.weaponType = "ranged";
  
  console.log('Power POJO:', powerPojo);
  console.log('验证结果:', PojoValidator.validatePowerPojo(powerPojo));
  
  // 创建Attack Power POJO
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
  
  console.log('Attack Power POJO:', attackPowerPojo);
  console.log();
}

/**
 * 测试Unit POJO
 */
function testUnitPojo() {
  console.log('=== 测试Unit POJO ===');
  
  // 创建Unit POJO
  const unitPojo = new UnitPojo();
  unitPojo.name = "战士";
  unitPojo.id = 1;
  unitPojo.x = 5;
  unitPojo.y = 3;
  unitPojo.direction = 0;
  unitPojo.party = "player";
  unitPojo.unitTypeName = "fighter";
  unitPojo.state = "idle";
  
  console.log('Unit POJO:', unitPojo);
  console.log('验证结果:', PojoValidator.validateUnitPojo(unitPojo));
  
  // 创建Creature POJO
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
  
  console.log('Creature POJO:', creaturePojo);
  console.log('验证结果:', PojoValidator.validateCreaturePojo(creaturePojo));
  console.log();
}

/**
 * 测试Game System POJO
 */
function testGameSystemPojo() {
  console.log('=== 测试Game System POJO ===');
  
  // 创建CombatState POJO
  const combatStatePojo = new CombatStatePojo();
  combatStatePojo.isInCombat = true;
  combatStatePojo.currentTurn = 1;
  combatStatePojo.currentRound = 1;
  combatStatePojo.initiativeOrder = [];
  
  console.log('CombatState POJO:', combatStatePojo);
  
  // 创建GameSettings POJO
  const gameSettingsPojo = new GameSettingsPojo();
  gameSettingsPojo.gridSize = 32;
  gameSettingsPojo.animationSpeed = 1.0;
  gameSettingsPojo.soundEnabled = true;
  gameSettingsPojo.musicEnabled = true;
  gameSettingsPojo.debugMode = false;
  
  console.log('GameSettings POJO:', gameSettingsPojo);
  console.log('验证结果:', PojoValidator.validateGameSettingsPojo(gameSettingsPojo));
  console.log();
}

/**
 * 测试工厂方法
 */
function testPojoFactory() {
  console.log('=== 测试POJO工厂 ===');
  
  const defaultPower = PojoFactory.createDefaultPowerPojo();
  console.log('默认Power POJO:', defaultPower);
  
  const defaultUnit = PojoFactory.createDefaultUnitPojo();
  console.log('默认Unit POJO:', defaultUnit);
  
  const defaultCreature = PojoFactory.createDefaultCreaturePojo();
  console.log('默认Creature POJO:', defaultCreature);
  console.log();
}

/**
 * 测试转换器
 */
function testPojoConverter() {
  console.log('=== 测试POJO转换器 ===');
  
  // 从普通对象转换
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
  console.log('从普通对象转换的Power POJO:', powerPojo);
  
  // 转回普通对象
  const backToPlain = PojoConverter.toPlainObject(powerPojo);
  console.log('转回普通对象:', backToPlain);
  
  // 深拷贝
  const clonedPojo = PojoConverter.clonePojo(powerPojo);
  console.log('深拷贝的POJO:', clonedPojo);
  console.log('是同一个对象?', clonedPojo === powerPojo); // 应该是false
  console.log();
}

/**
 * 运行所有测试
 */
export function runPojoTests() {
  console.log('开始POJO类测试...\n');
  
  testPowerPojo();
  testUnitPojo();
  testGameSystemPojo();
  testPojoFactory();
  testPojoConverter();
  
  console.log('POJO类测试完成!');
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  runPojoTests();
}
