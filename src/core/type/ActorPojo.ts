/**
 * D&D 4E Actor系统的POJO类 - 只包含属性，不包含方法
 * 基于wukin.json结构设计
 */

/**
 * 奖励系统POJO - 用于各种修正值
 */
export class BonusSystemPojo {
  bonus: any[] = [];
  feat: number = 0;
  item: number = 0;
  power: number = 0;
  race: number = 0;
  untyped: number = 0;
  value: number = 0;
}

/**
 * 人物详细信息POJO
 */
export class CharacterDetailsPojo {
  size: string = "med";
  origin: string = "natural";
  type: string = "humanoid";
  other: string = "";
  race: string = "";
  age: string = "";
  gender: string = "";
  height: string = "";
  weight: string = "";
  alignment: string = "";
  deity: string = "";
  level: number = 1;
  tier: number = 1;
  exp: number = 0;
  bloodied: number = 0;
  surgeValue: number = 0;
  surgeBon: BonusSystemPojo = new BonusSystemPojo();
  surges: BonusSystemPojo & { max: number } = Object.assign(new BonusSystemPojo(), { max: 0 });
  surgeEnv: BonusSystemPojo = new BonusSystemPojo();
  saves: BonusSystemPojo = new BonusSystemPojo();
  class: string = "";
  paragon: string = "";
  epic: string = "";
  secondwind: boolean = false;
  secondwindEffect: any = {};
  deathsaves: number = 3;
  deathsavefail: number = 0;
  deathsaveCrit: number = 20;
  deathsavebon: BonusSystemPojo = new BonusSystemPojo();
  secondwindbon: BonusSystemPojo & { custom: string } = Object.assign(new BonusSystemPojo(), { custom: "" });
  weaponProf: { value: string[], custom: string } = { value: [], custom: "" };
  armourProf: { value: string[], custom: string } = { value: [], custom: "" };
}

/**
 * 语言系统POJO
 */
export class LanguagesPojo {
  spoken: { value: string[], custom: string } = { value: [], custom: "" };
  script: { value: string[], custom: string } = { value: [], custom: "" };
}

/**
 * 感官系统POJO
 */
export class SensesPojo {
  vision: { value: string[], custom: string } = { value: [], custom: "" };
  special: { value: string[], custom: string } = { value: [], custom: "" };
  notes: string = "";
}

/**
 * 单个属性POJO
 */
export class AbilityPojo {
  value: number = 10;
  chat: string = "@name uses @label.";
  mod?: number;
}

/**
 * 六围属性POJO
 */
export class AbilitiesPojo {
  str: AbilityPojo = new AbilityPojo();
  con: AbilityPojo = new AbilityPojo();
  dex: AbilityPojo = new AbilityPojo();
  int: AbilityPojo = new AbilityPojo();
  wis: AbilityPojo = new AbilityPojo();
  cha: AbilityPojo = new AbilityPojo();
}

/**
 * 生命值属性POJO
 */
export class HitPointsPojo {
  value: number = 1;
  min: number = 0;
  max: number = 1;
  starting: number = 0;
  perlevel: number = 0;
  feat: number = 0;
  item: number = 0;
  power: number = 0;
  race: number = 0;
  untyped: number = 0;
  misc: number = 0;
  autototal: boolean = false;
  temprest: boolean = false;
}

/**
 * 临时生命值POJO
 */
export class TempHitPointsPojo {
  value: number | null = null;
  max: number = 0;
}

/**
 * 先攻POJO
 */
export class InitiativePojo {
  value: number = 0;
  ability: string = "dex";
  bonus: any[] = [];
  feat: number = 0;
  item: number = 0;
  power: number = 0;
  race: number = 0;
  untyped: number = 0;
  notes: string = "";
}

/**
 * 属性集合POJO
 */
export class AttributesPojo {
  hp: HitPointsPojo = new HitPointsPojo();
  temphp: TempHitPointsPojo = new TempHitPointsPojo();
  init: InitiativePojo = new InitiativePojo();
}

/**
 * 行动点POJO
 */
export class ActionPointsPojo {
  value: number = 1;
  encounteruse: boolean = false;
  effects: string = "";
  notes: string = "";
  custom: string = "";
}

/**
 * 单个防御POJO
 */
export class DefensePojo {
  value: number = 10;
  ability: string = "";
  armour: number = 0;
  class: number = 0;
  feat: number = 0;
  item: number = 0;
  power: number = 0;
  race: number = 0;
  untyped: number = 0;
  enhance: number = 0;
  shield: number = 0;
  bonus: any[] = [];
  temp: number = 0;
  light?: boolean;
  altability?: string;
  condition: string = "Conditional Bonuses.";
  chat: string = "";
}

/**
 * 防御系统POJO
 */
export class DefensesPojo {
  ac: DefensePojo = Object.assign(new DefensePojo(), { 
    light: false, 
    altability: "", 
    chat: "@name defends with armour." 
  });
  fort: DefensePojo = Object.assign(new DefensePojo(), { 
    chat: "@name defends with fortitude." 
  });
  ref: DefensePojo = Object.assign(new DefensePojo(), { 
    chat: "@name defends with reflexes." 
  });
  wil: DefensePojo = Object.assign(new DefensePojo(), { 
    chat: "@name defends with willpower." 
  });
}

/**
 * 修正值系统POJO
 */
export class ModifiersPojo {
  attack: BonusSystemPojo = new BonusSystemPojo();
  damage: BonusSystemPojo = new BonusSystemPojo();
  skills: BonusSystemPojo = new BonusSystemPojo();
  defences: BonusSystemPojo = new BonusSystemPojo();
}

/**
 * 单个技能POJO
 */
export class SkillPojo {
  value: number = 0;
  base: number = 0;
  feat: number = 0;
  item: number = 0;
  power: number = 0;
  training: number = 0;
  race: number = 0;
  untyped: number = 0;
  bonus: any[] = [];
  ability: string = "";
  armourCheck: boolean = false;
  chat: string = "@name uses @label.";
}

/**
 * 技能系统POJO
 */
export class SkillsPojo {
  acr: SkillPojo = Object.assign(new SkillPojo(), { ability: "dex", armourCheck: true }); // 杂技
  arc: SkillPojo = Object.assign(new SkillPojo(), { ability: "int", armourCheck: false }); // 神秘学
  ath: SkillPojo = Object.assign(new SkillPojo(), { ability: "str", armourCheck: true }); // 运动
  blu: SkillPojo = Object.assign(new SkillPojo(), { ability: "cha", armourCheck: false }); // 虚张声势
  dip: SkillPojo = Object.assign(new SkillPojo(), { ability: "cha", armourCheck: false }); // 外交
  dun: SkillPojo = Object.assign(new SkillPojo(), { ability: "wis", armourCheck: false }); // 地牢学
  end: SkillPojo = Object.assign(new SkillPojo(), { ability: "con", armourCheck: true }); // 耐力
  hea: SkillPojo = Object.assign(new SkillPojo(), { ability: "wis", armourCheck: false }); // 医疗
  his: SkillPojo = Object.assign(new SkillPojo(), { ability: "int", armourCheck: false }); // 历史
  ins: SkillPojo = Object.assign(new SkillPojo(), { ability: "wis", armourCheck: false }); // 洞察
  itm: SkillPojo = Object.assign(new SkillPojo(), { ability: "cha", armourCheck: false }); // 威吓
  nat: SkillPojo = Object.assign(new SkillPojo(), { ability: "wis", armourCheck: false }); // 自然
  prc: SkillPojo = Object.assign(new SkillPojo(), { ability: "wis", armourCheck: false }); // 感知
  rel: SkillPojo = Object.assign(new SkillPojo(), { ability: "int", armourCheck: false }); // 宗教
  stl: SkillPojo = Object.assign(new SkillPojo(), { ability: "dex", armourCheck: true }); // 潜行
  stw: SkillPojo = Object.assign(new SkillPojo(), { ability: "cha", armourCheck: false }); // 街头智慧
  thi: SkillPojo = Object.assign(new SkillPojo(), { ability: "dex", armourCheck: true }); // 盗贼技艺
}

/**
 * 技能训练等级POJO
 */
export class SkillTrainingPojo {
  untrained: BonusSystemPojo = new BonusSystemPojo();
  trained: BonusSystemPojo = Object.assign(new BonusSystemPojo(), { value: 5 });
  expertise: BonusSystemPojo = Object.assign(new BonusSystemPojo(), { value: 8 });
}

/**
 * 被动技能POJO
 */
export class PassiveSkillPojo {
  value: number = 0;
  feat: number = 0;
  item: number = 0;
  power: number = 0;
  race: number = 0;
  untyped: number = 0;
  skill: string = "";
  bonus: any[] = [];
}

/**
 * 被动技能系统POJO
 */
export class PassiveSkillsPojo {
  pasprc: PassiveSkillPojo = Object.assign(new PassiveSkillPojo(), { skill: "prc" });
  pasins: PassiveSkillPojo = Object.assign(new PassiveSkillPojo(), { skill: "ins" });
}

/**
 * 抗性POJO
 */
export class ResistancePojo {
  value: number = 0;
  res: number = 0;
  vuln: number = 0;
  armour: number = 0;
  immune: boolean = false;
  bonus: any[] = [];
}

/**
 * 抗性系统POJO
 */
export class ResistancesPojo {
  damage: ResistancePojo = new ResistancePojo();
  physical: ResistancePojo = new ResistancePojo();
  ongoing: ResistancePojo = new ResistancePojo();
  acid: ResistancePojo = new ResistancePojo();
  cold: ResistancePojo = new ResistancePojo();
  fire: ResistancePojo = new ResistancePojo();
  force: ResistancePojo = new ResistancePojo();
  lightning: ResistancePojo = new ResistancePojo();
  necrotic: ResistancePojo = new ResistancePojo();
  poison: ResistancePojo = new ResistancePojo();
  psychic: ResistancePojo = new ResistancePojo();
  radiant: ResistancePojo = new ResistancePojo();
  thunder: ResistancePojo = new ResistancePojo();
}

/**
 * 未分类抗性POJO
 */
export class UntypedResistancesPojo {
  resistances: string[] = [];
  vulnerabilities: string[] = [];
  immunities: string[] = [];
}

/**
 * 通用攻击奖励POJO
 */
export class CommonAttackBonusesPojo {
  comAdv: BonusSystemPojo = Object.assign(new BonusSystemPojo(), { value: 2 });
  charge: BonusSystemPojo = Object.assign(new BonusSystemPojo(), { value: 1 });
  conceal: BonusSystemPojo = Object.assign(new BonusSystemPojo(), { value: -2 });
  concealTotal: BonusSystemPojo = Object.assign(new BonusSystemPojo(), { value: -5 });
  cover: BonusSystemPojo = Object.assign(new BonusSystemPojo(), { value: -2 });
  coverSup: BonusSystemPojo = Object.assign(new BonusSystemPojo(), { value: -5 });
  longRange: BonusSystemPojo = Object.assign(new BonusSystemPojo(), { value: -2 });
  prone: BonusSystemPojo = Object.assign(new BonusSystemPojo(), { value: -2 });
  restrained: BonusSystemPojo = Object.assign(new BonusSystemPojo(), { value: -2 });
  running: BonusSystemPojo = Object.assign(new BonusSystemPojo(), { value: -5 });
  squeez: BonusSystemPojo = Object.assign(new BonusSystemPojo(), { value: -5 });
}

/**
 * 货币POJO
 */
export class CurrencyPojo {
  ad: number = 0; // 阿斯特拉钻石
  pp: number = 0; // 白金币
  gp: number = 0; // 金币
  sp: number = 0; // 银币
  cp: number = 0; // 铜币
}

/**
 * 仪式组件POJO
 */
export class RitualComponentsPojo {
  ar: number = 0; // 奥术残留
  ms: number = 0; // 神秘符文
  rh: number = 0; // 稀有草药
  si: number = 0; // 特殊香料
  rs: number = 0; // 残基
}

/**
 * 移动力单项POJO
 */
export class MovementTypePojo {
  value: number = 0;
  formula?: string;
  bonus: any[] = [];
  feat: number = 0;
  item: number = 0;
  power: number = 0;
  race: number = 0;
  untyped: number = 0;
  temp: number = 0;
  base?: number;
  armour?: number;
  misc?: number;
}

/**
 * 移动力系统POJO
 */
export class MovementPojo {
  base: MovementTypePojo = Object.assign(new MovementTypePojo(), { 
    base: 6, 
    armour: 0 
  });
  walk: MovementTypePojo = Object.assign(new MovementTypePojo(), { 
    formula: "@base + @armour" 
  });
  charge: MovementTypePojo = Object.assign(new MovementTypePojo(), { 
    formula: "@base + @armour" 
  });
  run: MovementTypePojo = Object.assign(new MovementTypePojo(), { 
    formula: "@base + @armour + 2",
    misc: 0
  });
  climb: MovementTypePojo = Object.assign(new MovementTypePojo(), { 
    formula: "(@base + @armour)/2" 
  });
  shift: MovementTypePojo = Object.assign(new MovementTypePojo(), { 
    formula: "1" 
  });
  swim: MovementTypePojo = Object.assign(new MovementTypePojo(), { 
    formula: "(@base + @armour)/2" 
  });
  notes: string = "";
}

/**
 * 资源POJO
 */
export class ResourcePojo {
  value: string = "";
  max: number | null = null;
  sr: boolean = false; // 短休恢复
  lr: boolean = false; // 长休恢复
  label: string = "";
}

/**
 * 资源系统POJO
 */
export class ResourcesPojo {
  primary: ResourcePojo = new ResourcePojo();
  secondary: ResourcePojo = new ResourcePojo();
  tertiary: ResourcePojo = new ResourcePojo();
}

/**
 * 魔法物品使用POJO
 */
export class MagicItemUsePojo {
  perDay: number = 1;
  bonusValue: number = 0;
  milestone: number = 0;
  dailyuse: number = 1;
  encounteruse: boolean = false;
}

/**
 * 负重POJO
 */
export class EncumbrancePojo {
  value: number | null = null;
  max: number | null = null;
  formulaNorm: string = "@abilities.str.value * 10";
  formulaHeavy: string = "@abilities.str.value * 20";
  formulaMax: string = "@abilities.str.value * 50";
}

/**
 * D&D 4E角色系统数据POJO
 */
export class ActorSystemPojo {
  biography: string = "";
  details: CharacterDetailsPojo = new CharacterDetailsPojo();
  languages: LanguagesPojo = new LanguagesPojo();
  senses: SensesPojo = new SensesPojo();
  abilities: AbilitiesPojo = new AbilitiesPojo();
  attributes: AttributesPojo = new AttributesPojo();
  actionpoints: ActionPointsPojo = new ActionPointsPojo();
  defences: DefensesPojo = new DefensesPojo();
  modifiers: ModifiersPojo = new ModifiersPojo();
  skills: SkillsPojo = new SkillsPojo();
  skillTraining: SkillTrainingPojo = new SkillTrainingPojo();
  passive: PassiveSkillsPojo = new PassiveSkillsPojo();
  resistances: ResistancesPojo = new ResistancesPojo();
  untypedResistances: UntypedResistancesPojo = new UntypedResistancesPojo();
  commonAttackBonuses: CommonAttackBonusesPojo = new CommonAttackBonusesPojo();
  currency: CurrencyPojo = new CurrencyPojo();
  ritualcomp: RitualComponentsPojo = new RitualComponentsPojo();
  movement: MovementPojo = new MovementPojo();
  resources: ResourcesPojo = new ResourcesPojo();
  magicItemUse: MagicItemUsePojo = new MagicItemUsePojo();
  encumbrance: EncumbrancePojo = new EncumbrancePojo();
  featureSortTypes: string = "name";
  powerGroupTypes: string = "usage";
  powerSortTypes: string = "name";
  ritualSortTypes: string = "name";
}

/**
 * Token纹理POJO
 */
export class TokenTexturePojo {
  src: string = "icons/svg/mystery-man.svg";
  anchorX: number = 0.5;
  anchorY: number = 0.5;
  offsetX: number = 0;
  offsetY: number = 0;
  fit: string = "contain";
  scaleX: number = 1;
  scaleY: number = 1;
  rotation: number = 0;
  tint: string = "#ffffff";
  alphaThreshold: number = 0.75;
}

/**
 * Token动画POJO
 */
export class TokenAnimationPojo {
  type: string | null = null;
  speed: number = 5;
  intensity: number = 5;
  reverse: boolean = false;
}

/**
 * Token光照黑暗POJO
 */
export class TokenDarknessPojo {
  min: number = 0;
  max: number = 1;
}

/**
 * Token光照POJO
 */
export class TokenLightPojo {
  negative: boolean = false;
  priority: number = 0;
  alpha: number = 0.5;
  angle: number = 360;
  bright: number = 0;
  color: string | null = null;
  coloration: number = 1;
  dim: number = 0;
  attenuation: number = 0.5;
  luminosity: number = 0.5;
  saturation: number = 0;
  contrast: number = 0;
  shadows: number = 0;
  animation: TokenAnimationPojo = new TokenAnimationPojo();
  darkness: TokenDarknessPojo = new TokenDarknessPojo();
}

/**
 * Token视觉POJO
 */
export class TokenSightPojo {
  enabled: boolean = false;
  range: number = 0;
  angle: number = 360;
  visionMode: string = "basic";
  color: string | null = null;
  attenuation: number = 0.1;
  brightness: number = 0;
  saturation: number = 0;
  contrast: number = 0;
}

/**
 * Token遮挡POJO
 */
export class TokenOccludablePojo {
  radius: number = 0;
}

/**
 * Token环形颜色POJO
 */
export class TokenRingColorsPojo {
  ring: string | null = null;
  background: string | null = null;
}

/**
 * Token环形主体POJO
 */
export class TokenRingSubjectPojo {
  scale: number = 1;
  texture: string | null = null;
}

/**
 * Token环形POJO
 */
export class TokenRingPojo {
  enabled: boolean = false;
  colors: TokenRingColorsPojo = new TokenRingColorsPojo();
  effects: number = 1;
  subject: TokenRingSubjectPojo = new TokenRingSubjectPojo();
}

/**
 * Token属性栏POJO
 */
export class TokenBarPojo {
  attribute?: string;
}

/**
 * 原型Token POJO
 */
export class PrototypeTokenPojo {
  name: string = "角色";
  displayName: number = 0;
  actorLink: boolean = true;
  appendNumber: boolean = false;
  prependAdjective: boolean = false;
  width: number = 1;
  height: number = 1;
  texture: TokenTexturePojo = new TokenTexturePojo();
  hexagonalShape: number = 0;
  lockRotation: boolean = false;
  rotation: number = 0;
  alpha: number = 1;
  disposition: number = 1;
  displayBars: number = 0;
  bar1: TokenBarPojo = { attribute: "attributes.hp" };
  bar2: TokenBarPojo = { attribute: "attributes.temphp" };
  light: TokenLightPojo = new TokenLightPojo();
  sight: TokenSightPojo = new TokenSightPojo();
  detectionModes: any[] = [];
  occludable: TokenOccludablePojo = new TokenOccludablePojo();
  ring: TokenRingPojo = new TokenRingPojo();
  flags: any = {};
  randomImg: boolean = false;
}

/**
 * D&D 4E Actor POJO - 完整的角色数据结构
 */
export class ActorPojo {
  name: string = "";
  type: string = "Player Character";
  img: string = "icons/svg/mystery-man.svg";
  system: ActorSystemPojo = new ActorSystemPojo();
  prototypeToken: PrototypeTokenPojo = new PrototypeTokenPojo();
  items: any[] = []; // 物品和技能列表
  effects: any[] = []; // 效果列表
  folder: string | null = null;
  flags: any = {};
  _stats?: any;
}
