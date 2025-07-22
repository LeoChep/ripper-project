/**
 * Unit单位系统的POJO类 - 只包含属性，不包含方法
 */

/**
 * 生物攻击POJO
 */
export class CreatureAttackPojo {
  name: string = "";
  type: string = "Melee";
  action: string = "";
  range: number = 1;
  attackBonus: number = 0;
  target: string = "ac";
  damage: string = "";
  effect?: string;
  missEffect?: string;
}

/**
 * 生物技能POJO
 */
export class CreatureSkillPojo {
  name: string = "";
  bonus: number = 0;
}

/**
 * 生物能力值POJO
 */
export class CreatureAbilityPojo {
  name: string = "";
  value: number = 10;
  modifier: number = 0;
}

/**
 * 生物抗性POJO
 */
export class CreatureResistancePojo {
  type: string = "";
  value: number = 0;
}

/**
 * 生物配置选项POJO
 */
export class CreatureOptionsPojo {
  name: string = "";
  level: number = 1;
  role: string = "";
  xp: number = 0;
  size: string = "Medium";
  type: string = "humanoid";
  hp: number = 1;
  bloodied: number = 1;
  ac: number = 10;
  fortitude: number = 10;
  reflex: number = 10;
  will: number = 10;
  speed: number = 6;
  fly?: number;
  initiative: number = 0;
  senses?: string;
  immunities: string[] = [];
  resistances: CreatureResistancePojo[] = [];
  alignment?: string;
  languages: string[] = [];
  skills: CreatureSkillPojo[] = [];
  abilities: CreatureAbilityPojo[] = [];
  equipment: string[] = [];
  attacks: CreatureAttackPojo[] = [];
  traits: string[] = [];
  notes: string[] = [];
}

/**
 * 生物POJO
 */
export class CreaturePojo {
  name: string = "";
  level: number = 1;
  role: string = "";
  xp: number = 0;
  size: string = "Medium";
  type: string = "humanoid";
  hp: number = 1;
  bloodied: number = 1;
  ac: number = 10;
  fortitude: number = 10;
  reflex: number = 10;
  will: number = 10;
  speed: number = 6;
  fly?: number;
  initiative: number = 0;
  senses?: string;
  immunities: string[] = [];
  resistances: CreatureResistancePojo[] = [];
  alignment?: string;
  languages: string[] = [];
  skills: CreatureSkillPojo[] = [];
  abilities: CreatureAbilityPojo[] = [];
  equipment: string[] = [];
  attacks: CreatureAttackPojo[] = [];
  traits: string[] = [];
  notes: string[] = [];
}

/**
 * AI接口POJO
 */
export class AIInterfacePojo {
  owner?: UnitPojo;
}

/**
 * 动作POJO
 */
export class ActionPojo {
  fn: (...args: any[]) => any = () => {};
  args: any[] = [];
}

/**
 * 先攻类POJO
 */
export class InitiativeClassPojo {
  standerActionNumber: number = 1;
  minorActionNumber: number = 1;
  moveActionNumber: number = 1;
  ready: boolean = true;
  owner?: UnitPojo;
}

/**
 * 状态机包POJO
 */
export class StateMachinePackPojo {
  machines: Map<string, any> = new Map();
}

/**
 * 单位配置选项POJO
 */
export class UnitOptionsPojo {
  id: number = 0;
  name: string = "";
  party: string = "neutral";
  unitTypeName: string = "";
  gid?: number;
  x: number = 0;
  y: number = 0;
  width: number = 64;
  height: number = 64;
  direction: number = 0;
}

/**
 * 单位POJO
 */
export class UnitPojo {
  ai?: AIInterfacePojo;
  actions: ActionPojo[] = [];
  id: number = 0;
  name: string = "";
  party: string = "neutral";
  unitTypeName: string = "";
  gid?: number;
  x: number = 0;
  y: number = 0;
  width: number = 64;
  height: number = 64;
  animUnit?: any; // UnitAnimSpirite的POJO版本可以后续创建
  initiative?: InitiativeClassPojo;
  state: string = "idle";
  stateMachinePack: StateMachinePackPojo = new StateMachinePackPojo();
  creature?: CreaturePojo;
  direction: number = 0;
}

/**
 * 单位动画精灵POJO
 */
export class UnitAnimSpritePojo {
  x: number = 0;
  y: number = 0;
  state: string = "idle";
  direction: number = 0;
  anims: Record<string, any> = {};
  animationCallback?: () => void;
}
