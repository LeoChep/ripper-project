/**
 * Power系统相关的接口定义
 */

// 激活配置
export interface PowerActivation {
  type: string;
  cost: number;
  condition: string;
}

// 持续时间配置
export interface PowerDuration {
  value: number | null;
  units: string;
}

// 范围配置
export interface PowerRange {
  value: number | null;
  long: number | null;
  units: string;
}

// 使用次数配置
export interface PowerUses {
  value: number;
  max: string;
  per: string;
}

// 消耗配置
export interface PowerConsume {
  type: string;
  target: string;
  amount: number | null;
}

// 宏配置
export interface PowerMacro {
  type: string;
  scope: string;
  launchOrder: string;
  command: string;
  author: string;
  autoanimationHook: string;
}

// 攻击配置
export interface PowerAttack {
  shareAttackRoll: boolean;
  isAttack: boolean;
  isBasic: boolean;
  isCharge: boolean;
  isOpp: boolean;
  canCharge: boolean;
  canOpp: boolean;
  ability: string; // 能力值简称，如 "str", "dex", "con" 等
  abilityBonus: number;
  def: string; // 防御类型，如 "ac", "fortitude", "reflex", "will"
  defBonus: number;
  formula: string; // 攻击公式
}

// 命中配置
export interface PowerHit {
  shareDamageRoll: boolean;
  isDamage: boolean;
  isHealing: boolean;
  healSurge: string;
  baseQuantity: string;
  baseDiceType: string;
  detail: string;
  formula: string;
  critFormula: string;
  healFormula: string;
}

// 失手配置
export interface PowerMiss {
  detail: string;
  formula: string;
}

// 效果配置
export interface PowerEffect {
  detail: string;
}

// 伤害部分
export interface PowerDamagePart {
  [key: string]: any;
}

// 伤害类型
export interface PowerDamageType {
  damage: boolean;
  acid: boolean;
  cold: boolean;
  fire: boolean;
  force: boolean;
  lightning: boolean;
  necrotic: boolean;
  physical: boolean;
  poison: boolean;
  psychic: boolean;
  radiant: boolean;
  thunder: boolean;
}

// 效果类型
export interface PowerEffectType {
  transmutation: boolean;
  polymorph: boolean;
  teleportation: boolean;
  poison: boolean;
  runic: boolean;
  enchantment: boolean;
  invigorating: boolean;
  gaze: boolean;
  illusion: boolean;
  disease: boolean;
  stance: boolean;
  spirit: boolean;
  reliable: boolean;
  augmentable: boolean;
  fear: boolean;
  rage: boolean;
  rattling: boolean;
  aura: boolean;
  charm: boolean;
  mount: boolean;
  zone: boolean;
  fullDis: boolean;
  sleep: boolean;
  necro: boolean;
  nether: boolean;
  evocation: boolean;
  beast: boolean;
  beastForm: boolean;
  healing: boolean;
  channelDiv: boolean;
  shadow: boolean;
  elemental: boolean;
  summoning: boolean;
  conjuration: boolean;
}

// 持续配置
export interface PowerSustain {
  actionType: string;
  detail: string;
}

// 特殊额外配置
export interface PowerSpecialAdd {
  parts: any[];
}

// 描述配置
export interface PowerDescription {
  value: string;
  chat: string;
  unidentified: string;
}

// 统计信息
export interface PowerStats {
  compendiumSource: any;
  duplicateSource: any;
  coreVersion: string;
  systemId: string;
  systemVersion: string;
  createdTime: number;
  modifiedTime: number;
  lastModifiedBy: string;
}

// 所有权配置
export interface PowerOwnership {
  default: number;
  [userId: string]: number;
}

// Power系统配置
export interface PowerSystem {
  description: PowerDescription;
  descriptionGM: PowerDescription;
  source: string;
  activation: PowerActivation;
  duration: PowerDuration;
  target: string;
  range: PowerRange;
  uses: PowerUses;
  consume: PowerConsume;
  macro: PowerMacro;
  attack: PowerAttack;
  hit: PowerHit;
  miss: PowerMiss;
  effect: PowerEffect;
  damage: { parts: PowerDamagePart[] };
  damageCrit: { parts: PowerDamagePart[] };
  damageImp: { parts: PowerDamagePart[] };
  damageCritImp: { parts: PowerDamagePart[] };
  damageType: PowerDamageType;
  keyWords: string[];
  level: string;
  powersource: string;
  secondPowersource: string;
  powersourceName: string;
  subName: string;
  prepared: boolean;
  powerType: string;
  powerSubtype: string;
  useType: string;
  actionType: string;
  requirements: string;
  weaponType: string;
  weaponUse: string;
  rangeType: string;
  rangeTextShort: string;
  rangeText: string;
  rangePower: string;
  area: number;
  rechargeRoll: string;
  rechargeCondition: string;
  damageShare: boolean;
  postEffect: boolean;
  postSpecial: boolean;
  autoGenChatPowerCard: boolean;
  sustain: PowerSustain;
  trigger: string;
  requirement: string;
  special: string;
  specialAdd: PowerSpecialAdd;
  effectType: PowerEffectType;
  keywordsCustom: string;
  tooltip: string;
  type: string;
  effectHTML: boolean;
  chatFlavor: string;
}

// Power主接口
export interface PowerData {
  name: string;
  type: string;
  system: PowerSystem;
  _id: string;
  img: string;
  effects: any[];
  folder: any;
  sort: number;
  ownership: PowerOwnership;
  flags: Record<string, any>;
  _stats: PowerStats;
}
