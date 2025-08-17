export class Power {
  name: string = "";
  displayName: string = "";
  description: string = "";
  keyWords: string[] = [""];
  level: string = "";
  powersource: string = "martial";
  secondPowersource: string = "";
  subName: string = "";
  prepared: boolean = true;
  powerType: string = "class";
  powerSubtype: string = "attack ";
  useType: string = "atwill";
  actionType: string = "standard";
  requirements: string = "";
  weaponType: string = "melee";
  weaponUse: string = "default";
  rangeType: string = "weapon";
  rangeTextShort: string = "";
  rangeText: string = "";
  rangePower: string = "";
  area: number = 0;
  rechargeRoll: string = "";
  rechargeCondition: string = "";
  hitText: string = "";
  missText: string = "";
  effectText: string = "";
  damageShare: boolean = false;
  postEffect: boolean = true;
  postSpecial: boolean = true;
  autoGenChatPowerCard: boolean = true;

  target: string = "One Creature";
  trigger: string = "";
  requirement: string = "";
  hookTime: string = "";

  // 冷却系统相关属性
  cooldown: number = 0; // 基础冷却时间（回合数）
  currentCooldown: number = 0; // 当前剩余冷却时间
  maxUses: number = -1; // 最大使用次数（-1表示无限制）
  currentUses: number = 0; // 当前已使用次数
  resetType: "turn" | "encounter" | "daily" | "manual" = "turn"; // 重置类型

  owner: any;
  hook = () => {};

  constructor(obj: any) {
    if (obj) {
      Object.assign(this, obj);
      // 初始化时重置使用次数
      this.currentUses = 0;
      this.currentCooldown = 0;
    }
  }

  /**
   * 检查技能是否可以使用
   */
  canUse(): boolean {
    // 检查冷却时间
    if (this.currentCooldown > 0) {
      return false;
    }

    // 检查使用次数限制
    if (this.maxUses > 0 && this.currentUses >= this.maxUses) {
      return false;
    }

    // 检查是否已准备
    if (!this.prepared) {
      return false;
    }

    return true;
  }

  /**
   * 使用技能
   */
  use(): boolean {
    if (!this.canUse()) {
      return false;
    }

    // 增加使用次数
    this.currentUses++;

    // 设置冷却时间
    this.currentCooldown = this.cooldown;

    return true;
  }

  /**
   * 减少冷却时间（通常在回合结束时调用）
   */
  tickCooldown(): void {
    if (this.currentCooldown > 0) {
      this.currentCooldown--;
    }
  }

  /**
   * 重置冷却和使用次数
   */
  reset(type: "turn" | "encounter" | "daily" | "manual" = "manual"): void {
    if (this.resetType === type || type === "manual") {
      this.currentCooldown = 0;
      this.currentUses = 0;
    }
  }

  /**
   * 强制设置冷却时间
   */
  setCooldown(turns: number): void {
    this.currentCooldown = Math.max(0, turns);
  }

  /**
   * 获取冷却状态信息
   */
  getCooldownInfo(): {
    isOnCooldown: boolean;
    remainingTurns: number;
    usesRemaining: number;
    canUse: boolean;
  } {
    return {
      isOnCooldown: this.currentCooldown > 0,
      remainingTurns: this.currentCooldown,
      usesRemaining: this.maxUses > 0 ? this.maxUses - this.currentUses : -1,
      canUse: this.canUse(),
    };
  }

  /**
   * 序列化冷却数据（用于存档）
   */
  serializeData(): {} {
    const power = this;
    power.keyWords = power.keyWords || [];
    return {
      name: power.name,
      currentCooldown: this.currentCooldown,
      currentUses: this.currentUses,
      displayName: power.displayName,
      description: power.description,
      keyWords: [...power.keyWords],
      level: power.level,
      powersource: power.powersource,
      secondPowersource: power.secondPowersource,
      subName: power.subName,
      prepared: power.prepared,
      powerType: power.powerType,
      powerSubtype: power.powerSubtype,
      useType: power.useType,
      actionType: power.actionType,
      requirements: power.requirements,
      weaponType: power.weaponType,
      weaponUse: power.weaponUse,
      rangeType: power.rangeType,
      rangeTextShort: power.rangeTextShort,
      rangeText: power.rangeText,
      rangePower: power.rangePower,
      area: power.area,
      rechargeRoll: power.rechargeRoll,
      rechargeCondition: power.rechargeCondition,
      damageShare: power.damageShare,
      postEffect: power.postEffect,
      postSpecial: power.postSpecial,
      autoGenChatPowerCard: power.autoGenChatPowerCard,
      target: power.target,
      trigger: power.trigger,
      requirement: power.requirement,
      hookTime: power.hookTime,
      cooldown: power.cooldown,
    };
  }

  /**
   * 反序列化冷却数据（用于读档）
   */
  deserializeCooldownData(data: {
    currentCooldown: number;
    currentUses: number;
  }): void {
    this.currentCooldown = data.currentCooldown || 0;
    this.currentUses = data.currentUses || 0;
  }
}
