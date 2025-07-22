/**
 * Power系统的POJO类 - 只包含属性，不包含方法
 */

/**
 * 激活配置POJO
 */
export class PowerActivationPojo {
  type: string = "";
  cost: number = 0;
  condition: string = "";
}

/**
 * 持续时间配置POJO
 */
export class PowerDurationPojo {
  value: number | null = null;
  units: string = "";
}

/**
 * 范围配置POJO
 */
export class PowerRangePojo {
  value: number | null = null;
  long: number | null = null;
  units: string = "";
}

/**
 * 使用次数配置POJO
 */
export class PowerUsesPojo {
  value: number = 0;
  max: string = "0";
  per: string = "";
}

/**
 * 消耗配置POJO
 */
export class PowerConsumePojo {
  type: string = "";
  target: string = "";
  amount: number | null = null;
}

/**
 * 宏配置POJO
 */
export class PowerMacroPojo {
  type: string = "script";
  scope: string = "global";
  launchOrder: string = "off";
  command: string = "";
  author: string = "";
  autoanimationHook: string = "";
}

/**
 * 攻击配置POJO
 */
export class PowerAttackPojo {
  shareAttackRoll: boolean = false;
  isAttack: boolean = true;
  isBasic: boolean = true;
  isCharge: boolean = false;
  isOpp: boolean = false;
  canCharge: boolean = false;
  canOpp: boolean = false;
  ability: string = "str";
  abilityBonus: number = 0;
  def: string = "ac";
  defBonus: number = 0;
  formula: string = "@wepAttack + @powerMod + @lvhalf";
}

/**
 * 命中配置POJO
 */
export class PowerHitPojo {
  shareDamageRoll: boolean = false;
  isDamage: boolean = true;
  isHealing: boolean = false;
  healSurge: string = "";
  baseQuantity: string = "1";
  baseDiceType: string = "weapon";
  detail: string = "";
  formula: string = "@powBase + @powerMod + @wepDamage";
  critFormula: string = "@powMax + @powerMod + @wepDamage + @wepCritBonus";
  healFormula: string = "";
}

/**
 * 失手配置POJO
 */
export class PowerMissPojo {
  detail: string = "";
  formula: string = "";
}

/**
 * 效果配置POJO
 */
export class PowerEffectPojo {
  detail: string = "";
}

/**
 * 伤害部分POJO
 */
export class PowerDamagePartsPojo {
  parts: any[] = [];
}

/**
 * 伤害类型POJO
 */
export class PowerDamageTypePojo {
  damage: boolean = false;
  acid: boolean = false;
  cold: boolean = false;
  fire: boolean = false;
  force: boolean = false;
  lightning: boolean = false;
  necrotic: boolean = false;
  physical: boolean = false;
  poison: boolean = false;
  psychic: boolean = false;
  radiant: boolean = false;
  thunder: boolean = false;
}

/**
 * 效果类型POJO
 */
export class PowerEffectTypePojo {
  transmutation: boolean = false;
  polymorph: boolean = false;
  teleportation: boolean = false;
  poison: boolean = false;
  runic: boolean = false;
  enchantment: boolean = false;
  invigorating: boolean = false;
  gaze: boolean = false;
  illusion: boolean = false;
  disease: boolean = false;
  stance: boolean = false;
  spirit: boolean = false;
  reliable: boolean = false;
  augmentable: boolean = false;
  fear: boolean = false;
  rage: boolean = false;
  rattling: boolean = false;
  aura: boolean = false;
  charm: boolean = false;
  mount: boolean = false;
  zone: boolean = false;
  fullDis: boolean = false;
  sleep: boolean = false;
  necro: boolean = false;
  nether: boolean = false;
  evocation: boolean = false;
  beast: boolean = false;
  beastForm: boolean = false;
  healing: boolean = false;
  channelDiv: boolean = false;
  shadow: boolean = false;
  elemental: boolean = false;
  summoning: boolean = false;
  conjuration: boolean = false;
}

/**
 * 持续配置POJO
 */
export class PowerSustainPojo {
  actionType: string = "";
  detail: string = "";
}

/**
 * 特殊额外配置POJO
 */
export class PowerSpecialAddPojo {
  parts: any[] = [];
}

/**
 * 描述配置POJO
 */
export class PowerDescriptionPojo {
  value: string = "";
  chat: string = "";
  unidentified: string = "";
}

/**
 * 统计信息POJO
 */
export class PowerStatsPojo {
  compendiumSource: any = null;
  duplicateSource: any = null;
  coreVersion: string = "12.331";
  systemId: string = "dnd4e";
  systemVersion: string = "0.6.9";
  createdTime: number = Date.now();
  modifiedTime: number = Date.now();
  lastModifiedBy: string = "system";
}

/**
 * 所有权配置POJO
 */
export class PowerOwnershipPojo {
  default: number = 0;
  [userId: string]: number;
}

/**
 * Power系统配置POJO
 */
export class PowerSystemPojo {
  description: PowerDescriptionPojo = new PowerDescriptionPojo();
  descriptionGM: PowerDescriptionPojo = new PowerDescriptionPojo();
  source: string = "";
  activation: PowerActivationPojo = new PowerActivationPojo();
  duration: PowerDurationPojo = new PowerDurationPojo();
  target: string = "One Creature";
  range: PowerRangePojo = new PowerRangePojo();
  uses: PowerUsesPojo = new PowerUsesPojo();
  consume: PowerConsumePojo = new PowerConsumePojo();
  macro: PowerMacroPojo = new PowerMacroPojo();
  attack: PowerAttackPojo = new PowerAttackPojo();
  hit: PowerHitPojo = new PowerHitPojo();
  miss: PowerMissPojo = new PowerMissPojo();
  effect: PowerEffectPojo = new PowerEffectPojo();
  damage: PowerDamagePartsPojo = new PowerDamagePartsPojo();
  damageCrit: PowerDamagePartsPojo = new PowerDamagePartsPojo();
  damageImp: PowerDamagePartsPojo = new PowerDamagePartsPojo();
  damageCritImp: PowerDamagePartsPojo = new PowerDamagePartsPojo();
  damageType: PowerDamageTypePojo = new PowerDamageTypePojo();
  keyWords: string[] = [];
  level: string = "1";
  powersource: string = "martial";
  secondPowersource: string = "martial";
  powersourceName: string = "";
  subName: string = "";
  prepared: boolean = true;
  powerType: string = "class";
  powerSubtype: string = "attack";
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
  damageShare: boolean = false;
  postEffect: boolean = true;
  postSpecial: boolean = true;
  autoGenChatPowerCard: boolean = true;
  sustain: PowerSustainPojo = new PowerSustainPojo();
  trigger: string = "";
  requirement: string = "";
  special: string = "";
  specialAdd: PowerSpecialAddPojo = new PowerSpecialAddPojo();
  effectType: PowerEffectTypePojo = new PowerEffectTypePojo();
  keywordsCustom: string = "";
  tooltip: string = "";
  type: string = "atwill";
  effectHTML: boolean = false;
  chatFlavor: string = "";
}

/**
 * Power主POJO
 */
export class PowerDataPojo {
  name: string = "";
  type: string = "power";
  system: PowerSystemPojo = new PowerSystemPojo();
  _id: string = "";
  img: string = "icons/svg/combat.svg";
  effects: any[] = [];
  folder: any = null;
  sort: number = 0;
  ownership: PowerOwnershipPojo = new PowerOwnershipPojo();
  flags: Record<string, any> = {};
  _stats: PowerStatsPojo = new PowerStatsPojo();
}

/**
 * 基础Power POJO
 */
export class PowerPojo {
  id: string = "";
  name: string = "";
  type: string = "power";
  img: string = "icons/svg/combat.svg";
  system: PowerSystemPojo = new PowerSystemPojo();
  
  // 计算属性的简化版本
  level: number = 1;
  isAttack: boolean = true;
  isDaily: boolean = false;
  isEncounter: boolean = false;
  isAtWill: boolean = true;
  actionType: string = "standard";
  range: number = 1;
  weaponType: string = "melee";
}

/**
 * 攻击型Power POJO
 */
export class AttackPowerPojo extends PowerPojo {
  // 攻击相关的额外属性
  attackBonus: number = 0;
  primaryAbility: string = "str";
  targetDefense: string = "ac";
  damageFormula: string = "";
  critDamageFormula: string = "";
  keywords: string[] = [];
  attackablePositions: Array<{x: number, y: number}> = [];
}
