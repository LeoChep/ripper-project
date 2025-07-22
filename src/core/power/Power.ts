import type { PowerData, PowerSystem, PowerAttack, PowerHit, PowerDamageType, PowerEffectType } from './PowerInterface';
import type { Unit } from '../units/Unit';
import type { TiledMap } from '../MapClass';

/**
 * Power基础类，表示游戏中的技能/能力
 */
export class Power {
  // 基础属性
  public id: string;
  public name: string;
  public type: string;
  public img: string;
  public system: PowerSystem;
  
  // 计算属性
  public get level(): number {
    return parseInt(this.system.level) || 1;
  }
  
  public get isAttack(): boolean {
    return this.system.attack.isAttack;
  }
  
  public get isDaily(): boolean {
    return this.system.useType === 'daily';
  }
  
  public get isEncounter(): boolean {
    return this.system.useType === 'encounter';
  }
  
  public get isAtWill(): boolean {
    return this.system.useType === 'atwill';
  }

  public get actionType(): string {
    return this.system.actionType;
  }

  public get range(): number {
    return this.system.range.value || 1;
  }

  public get weaponType(): string {
    return this.system.weaponType;
  }

  constructor(data: PowerData) {
    this.id = data._id;
    this.name = data.name;
    this.type = data.type;
    this.img = data.img;
    this.system = data.system;
  }

  /**
   * 静态方法：从JSON数据创建Power实例
   */
  static fromJSON(jsonData: PowerData): Power {
    return new Power(jsonData);
  }

  /**
   * 检查是否可以使用该技能
   */
  canUse(caster: Unit): boolean {
    // 检查行动点数
    if (!caster.initiative) return false;
    
    switch (this.actionType) {
      case 'standard':
        return (caster.initiative.standerActionNumber || 0) > 0;
      case 'move':
        return (caster.initiative.moveActionNumber || 0) > 0;
      case 'minor':
        return (caster.initiative.minorActionNumber || 0) > 0;
      default:
        return true;
    }
  }

  /**
   * 获取技能描述文本
   */
  getDescription(): string {
    return this.system.description.value || '';
  }

  /**
   * 获取技能的HTML描述
   */
  getHTMLDescription(): string {
    const desc = this.getDescription();
    // 简单的HTML清理，移除<p>标签
    return desc.replace(/<\/?p>/g, '').replace(/<br\/?>/g, '\n');
  }

  /**
   * 获取攻击加值计算公式
   */
  getAttackFormula(): string {
    return this.system.attack.formula || '';
  }

  /**
   * 获取伤害计算公式
   */
  getDamageFormula(): string {
    return this.system.hit.formula || '';
  }

  /**
   * 获取暴击伤害公式
   */
  getCritDamageFormula(): string {
    return this.system.hit.critFormula || '';
  }

  /**
   * 获取目标防御类型
   */
  getTargetDefense(): string {
    return this.system.attack.def || 'ac';
  }

  /**
   * 获取主要能力值
   */
  getPrimaryAbility(): string {
    return this.system.attack.ability || 'str';
  }

  /**
   * 检查是否有特定的关键词
   */
  hasKeyword(keyword: string): boolean {
    return this.system.keyWords.some(kw => 
      kw.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  /**
   * 检查是否造成特定类型的伤害
   */
  hasDamageType(damageType: keyof PowerDamageType): boolean {
    return this.system.damageType[damageType] || false;
  }

  /**
   * 检查是否有特定的效果类型
   */
  hasEffectType(effectType: keyof PowerEffectType): boolean {
    return this.system.effectType[effectType] || false;
  }

  /**
   * 获取技能的所有关键词
   */
  getKeywords(): string[] {
    return this.system.keyWords.filter(kw => kw.trim() !== '');
  }

  /**
   * 检查技能是否可以充能
   */
  isRecharge(): boolean {
    return this.system.rechargeRoll !== '';
  }

  /**
   * 获取充能条件
   */
  getRechargeCondition(): string {
    return this.system.rechargeRoll || '';
  }

  /**
   * 消耗行动点数
   */
  consumeActionPoints(caster: Unit): boolean {
    if (!caster.initiative) return false;
    
    switch (this.actionType) {
      case 'standard':
        if ((caster.initiative.standerActionNumber || 0) > 0) {
          caster.initiative.standerActionNumber = (caster.initiative.standerActionNumber || 1) - 1;
          return true;
        }
        break;
      case 'move':
        if ((caster.initiative.moveActionNumber || 0) > 0) {
          caster.initiative.moveActionNumber = (caster.initiative.moveActionNumber || 1) - 1;
          return true;
        }
        break;
      case 'minor':
        if ((caster.initiative.minorActionNumber || 0) > 0) {
          caster.initiative.minorActionNumber = (caster.initiative.minorActionNumber || 1) - 1;
          return true;
        }
        break;
    }
    return false;
  }

  /**
   * 转换为JSON格式
   */
  toJSON(): PowerData {
    return {
      _id: this.id,
      name: this.name,
      type: this.type,
      img: this.img,
      system: this.system,
      effects: [],
      folder: null,
      sort: 0,
      ownership: { default: 0 },
      flags: {},
      _stats: {
        compendiumSource: null,
        duplicateSource: null,
        coreVersion: "12.331",
        systemId: "dnd4e",
        systemVersion: "0.6.9",
        createdTime: Date.now(),
        modifiedTime: Date.now(),
        lastModifiedBy: "system"
      }
    };
  }

  /**
   * 创建技能的深拷贝
   */
  clone(): Power {
    return Power.fromJSON(this.toJSON());
  }
}
