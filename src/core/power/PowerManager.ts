import { Power } from './Power';
import { AttackPower } from './AttackPower';
import type { PowerData } from './PowerInterface';

/**
 * PowerFactory - 根据Power数据创建相应的Power实例
 */
export class PowerFactory {
  
  /**
   * 从JSON数据创建Power实例
   * 根据power的类型自动选择合适的类
   */
  static createPower(data: PowerData): Power {
    // 检查是否是攻击类技能
    if (data.system.attack.isAttack) {
      return new AttackPower(data);
    }
    
    // 其他类型的技能可以在这里扩展
    // 比如治疗技能、增益技能等
    
    // 默认返回基础Power
    return new Power(data);
  }

  /**
   * 从JSON文件路径加载Power
   */
  static async loadPowerFromFile(filePath: string): Promise<Power> {
    try {
      const response = await fetch(filePath);
      const data: PowerData = await response.json();
      return this.createPower(data);
    } catch (error) {
      console.error(`Failed to load power from ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * 批量创建Powers
   */
  static createPowers(dataArray: PowerData[]): Power[] {
    return dataArray.map(data => this.createPower(data));
  }
}

/**
 * PowerManager - 管理单位的所有技能
 */
export class PowerManager {
  private powers: Map<string, Power> = new Map();
  
  constructor(private owner: import('../units/Unit').Unit) {}

  /**
   * 添加技能
   */
  addPower(power: Power): void {
    this.powers.set(power.id, power);
  }

  /**
   * 移除技能
   */
  removePower(powerId: string): boolean {
    return this.powers.delete(powerId);
  }

  /**
   * 获取技能
   */
  getPower(powerId: string): Power | undefined {
    return this.powers.get(powerId);
  }

  /**
   * 获取所有技能
   */
  getAllPowers(): Power[] {
    return Array.from(this.powers.values());
  }

  /**
   * 根据使用类型获取技能
   */
  getPowersByUseType(useType: 'atwill' | 'encounter' | 'daily'): Power[] {
    return this.getAllPowers().filter(power => power.system.useType === useType);
  }

  /**
   * 根据动作类型获取技能
   */
  getPowersByActionType(actionType: 'standard' | 'move' | 'minor'): Power[] {
    return this.getAllPowers().filter(power => power.system.actionType === actionType);
  }

  /**
   * 获取所有攻击技能
   */
  getAttackPowers(): AttackPower[] {
    return this.getAllPowers().filter(power => power instanceof AttackPower) as AttackPower[];
  }

  /**
   * 获取当前可用的技能
   */
  getAvailablePowers(): Power[] {
    return this.getAllPowers().filter(power => power.canUse(this.owner));
  }

  /**
   * 根据关键词搜索技能
   */
  searchPowersByKeyword(keyword: string): Power[] {
    return this.getAllPowers().filter(power => 
      power.name.toLowerCase().includes(keyword.toLowerCase()) ||
      power.hasKeyword(keyword)
    );
  }

  /**
   * 清空所有技能
   */
  clear(): void {
    this.powers.clear();
  }

  /**
   * 从JSON数组批量加载技能
   */
  loadPowersFromData(dataArray: PowerData[]): void {
    const powers = PowerFactory.createPowers(dataArray);
    powers.forEach(power => this.addPower(power));
  }
}

/**
 * PowerUtils - 技能相关的工具函数
 */
export class PowerUtils {
  
  /**
   * 解析攻击公式中的变量
   */
  static parseAttackFormula(formula: string, caster: import('../units/Unit').Unit): number {
    // 这里可以实现复杂的公式解析
    // 暂时返回简单的计算结果
    return 0;
  }

  /**
   * 解析伤害公式中的变量
   */
  static parseDamageFormula(formula: string, caster: import('../units/Unit').Unit): string {
    // 这里可以实现复杂的公式解析
    // 暂时返回原公式
    return formula;
  }

  /**
   * 获取能力值名称映射
   */
  static getAbilityNameMap(): Record<string, string> {
    return {
      'str': 'Strength',
      'dex': 'Dexterity',
      'con': 'Constitution',
      'int': 'Intelligence',
      'wis': 'Wisdom',
      'cha': 'Charisma'
    };
  }

  /**
   * 获取防御类型名称映射
   */
  static getDefenseNameMap(): Record<string, string> {
    return {
      'ac': 'AC',
      'fortitude': 'Fortitude',
      'reflex': 'Reflex',
      'will': 'Will'
    };
  }
}
