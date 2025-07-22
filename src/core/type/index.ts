/**
 * POJO类统一导出文件
 * 这里导出所有只包含属性、不包含方法的纯数据对象类
 */

// Power系统POJO类
export * from './PowerPojo';

// Unit系统POJO类  
export * from './UnitPojo';

// 游戏系统POJO类
export * from './GameSystemPojo';

// Actor系统POJO类
export * from './ActorPojo';

// 导入所需的类用于工厂方法
import { 
  PowerDataPojo, 
  PowerPojo, 
  AttackPowerPojo, 
  PowerSystemPojo
} from './PowerPojo';

import { 
  UnitPojo, 
  CreaturePojo 
} from './UnitPojo';

import { 
  CombatStatePojo, 
  GameSettingsPojo, 
  PlayerStatePojo 
} from './GameSystemPojo';

import {
  ActorPojo,
  ActorSystemPojo
} from './ActorPojo';

/**
 * 创建默认实例的工厂函数
 */
export class PojoFactory {
  
  /**
   * 创建默认的Power POJO
   */
  static createDefaultPowerPojo(): PowerPojo {
    return new PowerPojo();
  }
  
  /**
   * 创建默认的AttackPower POJO
   */
  static createDefaultAttackPowerPojo(): AttackPowerPojo {
    return new AttackPowerPojo();
  }
  
  /**
   * 创建默认的Unit POJO
   */
  static createDefaultUnitPojo(): UnitPojo {
    return new UnitPojo();
  }
  
  /**
   * 创建默认的Creature POJO
   */
  static createDefaultCreaturePojo(): CreaturePojo {
    return new CreaturePojo();
  }
  
  /**
   * 创建默认的CombatState POJO
   */
  static createDefaultCombatStatePojo(): CombatStatePojo {
    return new CombatStatePojo();
  }
  
  /**
   * 创建默认的GameSettings POJO
   */
  static createDefaultGameSettingsPojo(): GameSettingsPojo {
    return new GameSettingsPojo();
  }
  
  /**
   * 创建默认的PlayerState POJO
   */
  static createDefaultPlayerStatePojo(): PlayerStatePojo {
    return new PlayerStatePojo();
  }

  /**
   * 创建默认的Actor POJO
   */
  static createDefaultActorPojo(): ActorPojo {
    return new ActorPojo();
  }

  /**
   * 创建默认的ActorSystem POJO
   */
  static createDefaultActorSystemPojo(): ActorSystemPojo {
    return new ActorSystemPojo();
  }
}

/**
 * POJO验证器 - 验证POJO对象的有效性
 */
export class PojoValidator {
  
  /**
   * 验证Power POJO
   */
  static validatePowerPojo(pojo: PowerPojo): boolean {
    return pojo.name !== "" && pojo.id !== "" && pojo.level > 0;
  }
  
  /**
   * 验证Unit POJO
   */
  static validateUnitPojo(pojo: UnitPojo): boolean {
    return pojo.name !== "" && pojo.id >= 0 && pojo.x >= 0 && pojo.y >= 0;
  }
  
  /**
   * 验证Creature POJO
   */
  static validateCreaturePojo(pojo: CreaturePojo): boolean {
    return pojo.name !== "" && 
      pojo.level > 0 && 
      pojo.hp > 0 && 
      pojo.ac >= 0;
  }
  
  /**
   * 验证GameSettings POJO
   */
  static validateGameSettingsPojo(pojo: GameSettingsPojo): boolean {
    return pojo.gridSize > 0 && 
           pojo.animationSpeed > 0;
  }

  /**
   * 验证Actor POJO
   */
  static validateActorPojo(pojo: ActorPojo): boolean {
    return pojo.name !== "" && 
           pojo.system.details.level > 0 &&
           pojo.system.attributes.hp.max > 0;
  }
}

/**
 * POJO转换器 - 在POJO和其他格式之间转换
 */
export class PojoConverter {
  
  /**
   * 从普通对象转换为Power POJO
   */
  static toPowerPojo(obj: any): PowerPojo {
    const pojo = new PowerPojo();
    Object.assign(pojo, obj);
    return pojo;
  }
  
  /**
   * 从普通对象转换为Unit POJO
   */
  static toUnitPojo(obj: any): UnitPojo {
    const pojo = new UnitPojo();
    Object.assign(pojo, obj);
    return pojo;
  }
  
  /**
   * 从普通对象转换为Creature POJO
   */
  static toCreaturePojo(obj: any): CreaturePojo {
    const pojo = new CreaturePojo();
    Object.assign(pojo, obj);
    return pojo;
  }

  /**
   * 从普通对象转换为Actor POJO
   */
  static toActorPojo(obj: any): ActorPojo {
    const pojo = new ActorPojo();
    Object.assign(pojo, obj);
    return pojo;
  }
  
  /**
   * 将POJO转换为普通对象
   */
  static toPlainObject(pojo: any): any {
    return JSON.parse(JSON.stringify(pojo));
  }
  
  /**
   * 深拷贝POJO
   */
  static clonePojo<T>(pojo: T): T {
    return JSON.parse(JSON.stringify(pojo));
  }
}
