/**
 * D&D 4E Actor类 - 基于wukin.json结构的完整实现
 */

import { ActorPojo, ActorSystemPojo, AbilitiesPojo, DefensesPojo, SkillsPojo } from '../type/ActorPojo';

/**
 * D&D 4E Actor类
 * 代表一个完整的角色，包含所有属性、技能、装备和能力
 */
export class Actor {
  private _data: ActorPojo;

  constructor(data?: Partial<ActorPojo>) {
    this._data = new ActorPojo();
    if (data) {
      Object.assign(this._data, data);
    }
  }

  // ==================== 基础属性 ====================

  /**
   * 角色名称
   */
  get name(): string {
    return this._data.name;
  }

  set name(value: string) {
    this._data.name = value;
  }

  /**
   * 角色类型
   */
  get type(): string {
    return this._data.type;
  }

  set type(value: string) {
    this._data.type = value;
  }

  /**
   * 角色头像
   */
  get img(): string {
    return this._data.img;
  }

  set img(value: string) {
    this._data.img = value;
  }

  /**
   * 角色等级
   */
  get level(): number {
    return this._data.system.details.level;
  }

  set level(value: number) {
    this._data.system.details.level = value;
  }

  /**
   * 角色种族
   */
  get race(): string {
    return this._data.system.details.race;
  }

  set race(value: string) {
    this._data.system.details.race = value;
  }

  /**
   * 角色职业
   */
  get characterClass(): string {
    return this._data.system.details.class;
  }

  set characterClass(value: string) {
    this._data.system.details.class = value;
  }

  // ==================== 六围属性 ====================

  /**
   * 获取属性值
   */
  getAbilityScore(ability: keyof AbilitiesPojo): number {
    return this._data.system.abilities[ability].value;
  }

  /**
   * 设置属性值
   */
  setAbilityScore(ability: keyof AbilitiesPojo, value: number): void {
    this._data.system.abilities[ability].value = value;
    // 自动计算修正值
    this._data.system.abilities[ability].mod = this.calculateAbilityModifier(value);
  }

  /**
   * 获取属性修正值
   */
  getAbilityModifier(ability: keyof AbilitiesPojo): number {
    const mod = this._data.system.abilities[ability].mod;
    if (mod !== undefined) {
      return mod;
    }
    return this.calculateAbilityModifier(this._data.system.abilities[ability].value);
  }

  /**
   * 计算属性修正值
   */
  private calculateAbilityModifier(score: number): number {
    return Math.floor((score - 10) / 2);
  }

  // ==================== 生命值系统 ====================

  /**
   * 当前生命值
   */
  get currentHP(): number {
    return this._data.system.attributes.hp.value;
  }

  set currentHP(value: number) {
    this._data.system.attributes.hp.value = Math.max(0, Math.min(value, this.maxHP));
  }

  /**
   * 最大生命值
   */
  get maxHP(): number {
    return this._data.system.attributes.hp.max;
  }

  set maxHP(value: number) {
    this._data.system.attributes.hp.max = value;
  }

  /**
   * 临时生命值
   */
  get tempHP(): number {
    return this._data.system.attributes.temphp.value || 0;
  }

  set tempHP(value: number) {
    this._data.system.attributes.temphp.value = value;
  }

  /**
   * 是否处于濒死状态
   */
  get isDying(): boolean {
    return this.currentHP <= 0;
  }

  /**
   * 是否处于重伤状态
   */
  get isBloodied(): boolean {
    return this.currentHP <= Math.floor(this.maxHP / 2);
  }

  /**
   * 治疗
   */
  heal(amount: number): number {
    const oldHP = this.currentHP;
    this.currentHP += amount;
    return this.currentHP - oldHP;
  }

  /**
   * 受到伤害
   */
  takeDamage(amount: number): number {
    // 先消耗临时生命值
    if (this.tempHP > 0) {
      const tempDamage = Math.min(amount, this.tempHP);
      this.tempHP -= tempDamage;
      amount -= tempDamage;
    }

    // 再消耗正常生命值
    if (amount > 0) {
      const oldHP = this.currentHP;
      this.currentHP -= amount;
      return oldHP - this.currentHP;
    }

    return 0;
  }

  // ==================== 防御系统 ====================

  /**
   * 获取防御值
   */
  getDefense(defense: keyof DefensesPojo): number {
    const def = this._data.system.defences[defense];
    let total = def.value + def.armour + def.class + def.feat + def.item + 
                def.power + def.race + def.untyped + def.enhance + 
                def.shield + def.temp;

    // 添加等级的一半（向上取整）
    total += Math.ceil(this.level / 2);

    // 添加相关属性修正值
    if (def.ability) {
      total += this.getAbilityModifier(def.ability as keyof AbilitiesPojo);
    }

    return total;
  }

  /**
   * AC（护甲等级）
   */
  get ac(): number {
    return this.getDefense('ac');
  }

  /**
   * 强韧防御
   */
  get fortitude(): number {
    return this.getDefense('fort');
  }

  /**
   * 反射防御
   */
  get reflex(): number {
    return this.getDefense('ref');
  }

  /**
   * 意志防御
   */
  get will(): number {
    return this.getDefense('wil');
  }

  // ==================== 技能系统 ====================

  /**
   * 获取技能修正值
   */
  getSkillModifier(skill: keyof SkillsPojo): number {
    const skillData = this._data.system.skills[skill];
    let total = skillData.value + skillData.base + skillData.feat + 
                skillData.item + skillData.power + skillData.training + 
                skillData.race + skillData.untyped;

    // 添加相关属性修正值
    if (skillData.ability) {
      total += this.getAbilityModifier(skillData.ability as keyof AbilitiesPojo);
    }

    // 添加等级的一半（向下取整）
    total += Math.floor(this.level / 2);

    return total;
  }

  /**
   * 检查技能是否受训
   */
  isSkillTrained(skill: keyof SkillsPojo): boolean {
    return this._data.system.skills[skill].training > 0;
  }

  /**
   * 训练技能
   */
  trainSkill(skill: keyof SkillsPojo, level: 'trained' | 'expertise' = 'trained'): void {
    const trainingValue = level === 'trained' ? 
      this._data.system.skillTraining.trained.value : 
      this._data.system.skillTraining.expertise.value;
    
    this._data.system.skills[skill].training = trainingValue;
  }

  // ==================== 先攻系统 ====================

  /**
   * 先攻修正值
   */
  get initiativeModifier(): number {
    const init = this._data.system.attributes.init;
    let total = init.value + init.feat + init.item + init.power + 
                init.race + init.untyped;

    // 添加敏捷修正值
    if (init.ability === 'dex') {
      total += this.getAbilityModifier('dex');
    }

    // 添加等级的一半（向下取整）
    total += Math.floor(this.level / 2);

    return total;
  }

  /**
   * 投先攻
   */
  rollInitiative(): number {
    const roll = Math.floor(Math.random() * 20) + 1;
    return roll + this.initiativeModifier;
  }

  // ==================== 移动力系统 ====================

  /**
   * 基础移动力
   */
  get speed(): number {
    const movement = this._data.system.movement;
    const base = movement.base.base || 6;
    const armour = movement.base.armour || 0;
    return base + armour + movement.base.feat + 
           movement.base.item + movement.base.power + movement.base.race + 
           movement.base.untyped + movement.base.temp;
  }

  /**
   * 行走移动力
   */
  get walkSpeed(): number {
    return this.speed;
  }

  /**
   * 奔跑移动力
   */
  get runSpeed(): number {
    return this.speed + 2;
  }

  /**
   * 攀爬移动力
   */
  get climbSpeed(): number {
    return Math.floor(this.speed / 2);
  }

  /**
   * 游泳移动力
   */
  get swimSpeed(): number {
    return Math.floor(this.speed / 2);
  }

  // ==================== 行动点系统 ====================

  /**
   * 当前行动点
   */
  get actionPoints(): number {
    return this._data.system.actionpoints.value;
  }

  set actionPoints(value: number) {
    this._data.system.actionpoints.value = value;
  }

  /**
   * 消耗行动点
   */
  spendActionPoint(): boolean {
    if (this.actionPoints > 0) {
      this.actionPoints--;
      return true;
    }
    return false;
  }

  /**
   * 恢复行动点
   */
  restoreActionPoint(): void {
    this.actionPoints++;
  }

  // ==================== 抗性系统 ====================

  /**
   * 检查是否对伤害类型免疫
   */
  isImmuneTo(damageType: string): boolean {
    const resistance = this._data.system.resistances[damageType as keyof typeof this._data.system.resistances];
    return resistance ? resistance.immune : false;
  }

  /**
   * 获取伤害抗性值
   */
  getResistance(damageType: string): number {
    const resistance = this._data.system.resistances[damageType as keyof typeof this._data.system.resistances];
    return resistance ? resistance.res : 0;
  }

  /**
   * 获取伤害易伤值
   */
  getVulnerability(damageType: string): number {
    const resistance = this._data.system.resistances[damageType as keyof typeof this._data.system.resistances];
    return resistance ? resistance.vuln : 0;
  }

  /**
   * 设置伤害抗性
   */
  setResistance(damageType: string, value: number): void {
    const resistance = this._data.system.resistances[damageType as keyof typeof this._data.system.resistances];
    if (resistance) {
      resistance.res = value;
    }
  }

  /**
   * 设置伤害易伤
   */
  setVulnerability(damageType: string, value: number): void {
    const resistance = this._data.system.resistances[damageType as keyof typeof this._data.system.resistances];
    if (resistance) {
      resistance.vuln = value;
    }
  }

  /**
   * 设置伤害免疫
   */
  setImmunity(damageType: string, immune: boolean): void {
    const resistance = this._data.system.resistances[damageType as keyof typeof this._data.system.resistances];
    if (resistance) {
      resistance.immune = immune;
    }
  }

  /**
   * 应用伤害抗性和易伤
   */
  applyDamageModifiers(damage: number, damageType: string): number {
    if (this.isImmuneTo(damageType)) {
      return 0;
    }

    const resistance = this.getResistance(damageType);
    const vulnerability = this.getVulnerability(damageType);

    let finalDamage = damage;
    
    // 应用抗性
    if (resistance > 0) {
      finalDamage = Math.max(0, finalDamage - resistance);
    }
    
    // 应用易伤
    if (vulnerability > 0) {
      finalDamage += vulnerability;
    }

    return finalDamage;
  }

  // ==================== 数据管理 ====================

  /**
   * 获取完整的角色数据
   */
  getData(): ActorPojo {
    return JSON.parse(JSON.stringify(this._data));
  }

  /**
   * 设置角色数据
   */
  setData(data: Partial<ActorPojo>): void {
    Object.assign(this._data, data);
  }

  /**
   * 导出为JSON
   */
  toJSON(): string {
    return JSON.stringify(this._data, null, 2);
  }

  /**
   * 从JSON导入
   */
  static fromJSON(json: string): Actor {
    const data = JSON.parse(json);
    return new Actor(data);
  }

  /**
   * 克隆角色
   */
  clone(): Actor {
    return new Actor(this.getData());
  }

  /**
   * 重置为满血满状态
   */
  fullRest(): void {
    this.currentHP = this.maxHP;
    this.tempHP = 0;
    this.actionPoints = 1; // 通常每次遭遇开始时有1个行动点
    
    // 重置死亡豁免
    this._data.system.details.deathsavefail = 0;
    
    // 清除临时效果
    this._data.effects = [];
  }

  /**
   * 短休
   */
  shortRest(): void {
    // 可以使用治疗涌现
    // 恢复遭遇威能
    // 其他短休恢复的资源
  }

  /**
   * 升级
   */
  levelUp(): void {
    this.level++;
    
    // 根据职业和等级提升HP
    const hpGain = this.calculateHPGainOnLevelUp();
    this.maxHP += hpGain;
    this.currentHP += hpGain;
    
    // 其他升级奖励
    this.handleLevelUpBonuses();
  }

  /**
   * 计算升级时的HP增长
   */
  private calculateHPGainOnLevelUp(): number {
    // 简化版本，实际应该根据职业来计算
    const conMod = this.getAbilityModifier('con');
    return Math.max(1, 4 + conMod); // 假设为d8生命骰的职业
  }

  /**
   * 处理升级奖励
   */
  private handleLevelUpBonuses(): void {
    // 根据等级获得的奖励
    // 如：每偶数等级获得专长、每4级提升属性等
  }

  // ==================== 实用方法 ====================

  /**
   * 获取角色摘要信息
   */
  getSummary(): string {
    return `${this.name} - ${this.level}级 ${this.race} ${this.characterClass}\n` +
           `HP: ${this.currentHP}/${this.maxHP} AC: ${this.ac}\n` +
           `Fort: ${this.fortitude} Ref: ${this.reflex} Will: ${this.will}`;
  }

  /**
   * 检查角色是否有效
   */
  isValid(): boolean {
    return this.name.length > 0 && 
           this.level > 0 && 
           this.maxHP > 0 &&
           this.race.length > 0 &&
           this.characterClass.length > 0;
  }

  /**
   * 获取所有装备的物品
   */
  getEquippedItems(): any[] {
    return this._data.items.filter(item => 
      item.system && item.system.equipped === true
    );
  }

  /**
   * 获取所有威能
   */
  getPowers(): any[] {
    return this._data.items.filter(item => item.type === 'power');
  }

  /**
   * 获取所有专长
   */
  getFeatures(): any[] {
    return this._data.items.filter(item => item.type === 'feature');
  }

  /**
   * 添加物品
   */
  addItem(item: any): void {
    this._data.items.push(item);
  }

  /**
   * 移除物品
   */
  removeItem(itemId: string): boolean {
    const index = this._data.items.findIndex(item => item._id === itemId);
    if (index !== -1) {
      this._data.items.splice(index, 1);
      return true;
    }
    return false;
  }
}
