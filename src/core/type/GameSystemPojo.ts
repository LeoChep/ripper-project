/**
 * 游戏系统相关的POJO类 - 只包含属性，不包含方法
 */

/**
 * 地图层POJO
 */
export class RLayersPojo {
  basicLayer?: any;
  spriteLayer?: any;
  lineLayer?: any;
  fogLayer?: any;
  selectLayer?: any;
  controllerLayer?: any;
}

/**
 * 地图边缘POJO
 */
export class MapEdgePojo {
  x1: number = 0;
  y1: number = 0;
  x2: number = 0;
  y2: number = 0;
  useable: boolean = true;
}

/**
 * 地图对象POJO
 */
export class MapObjectPojo {
  id: number = 0;
  name: string = "";
  type: string = "";
  x: number = 0;
  y: number = 0;
  width: number = 0;
  height: number = 0;
  properties: Record<string, any> = {};
}

/**
 * 瓦片地图POJO
 */
export class TiledMapPojo {
  width: number = 0;
  height: number = 0;
  tilewidth: number = 64;
  tileheight: number = 64;
  layers: any[] = [];
  sprites: UnitPojo[] = [];
  edges?: MapEdgePojo[];
  objects?: MapObjectPojo[];
}

/**
 * 骰子投掷结果POJO
 */
export class DiceRollResultPojo {
  result: number = 0;
  rolls: number[] = [];
  formula: string = "";
  total: number = 0;
}

/**
 * 战斗状态POJO
 */
export class CombatStatePojo {
  isInCombat: boolean = false;
  currentTurn: number = 0;
  currentRound: number = 1;
  initiativeOrder: UnitPojo[] = [];
}

/**
 * 移动路径节点POJO
 */
export class PathNodePojo {
  x: number = 0;
  y: number = 0;
  g: number = 0; // 从起点到当前节点的成本
  h: number = 0; // 从当前节点到终点的启发式估计成本
  f: number = 0; // g + h
  parent?: PathNodePojo;
}

/**
 * 移动路径POJO
 */
export class MovementPathPojo {
  nodes: PathNodePojo[] = [];
  totalCost: number = 0;
  isValid: boolean = true;
}

/**
 * 攻击结果POJO
 */
export class AttackResultPojo {
  isHit: boolean = false;
  damage: number = 0;
  damageType: string = "physical";
  isCritical: boolean = false;
  effects: string[] = [];
  attackRoll: number = 0;
  targetAC: number = 10;
}

/**
 * 治疗结果POJO
 */
export class HealingResultPojo {
  healAmount: number = 0;
  healType: string = "normal";
  isMaxHeal: boolean = false;
  effects: string[] = [];
}

/**
 * 状态效果POJO
 */
export class StatusEffectPojo {
  id: string = "";
  name: string = "";
  description: string = "";
  duration: number = -1; // -1表示永久
  type: string = ""; // buff, debuff, neutral
  effects: Record<string, any> = {};
  source?: UnitPojo;
  target?: UnitPojo;
}

/**
 * 游戏设置POJO
 */
export class GameSettingsPojo {
  gridSize: number = 64;
  mapContainer?: any;
  rlayers: RLayersPojo = new RLayersPojo();
  map?: TiledMapPojo;
  debugMode: boolean = false;
  animationSpeed: number = 1.0;
  soundEnabled: boolean = true;
  musicEnabled: boolean = true;
}

/**
 * 玩家状态POJO
 */
export class PlayerStatePojo {
  selectedUnit?: UnitPojo;
  selectedPowers: PowerPojo[] = [];
  actionPoints: {
    standard: number;
    move: number;
    minor: number;
  } = {
    standard: 1,
    move: 1,
    minor: 1
  };
  inventory: string[] = [];
  experience: number = 0;
  level: number = 1;
}

/**
 * 技能使用记录POJO
 */
export class PowerUsageRecordPojo {
  powerId: string = "";
  powerName: string = "";
  caster: UnitPojo = new UnitPojo();
  target?: UnitPojo;
  targetPosition: { x: number; y: number } = { x: 0, y: 0 };
  timestamp: number = Date.now();
  result: AttackResultPojo | HealingResultPojo | null = null;
  success: boolean = false;
}

/**
 * 回合记录POJO
 */
export class TurnRecordPojo {
  unit: UnitPojo = new UnitPojo();
  turnNumber: number = 0;
  roundNumber: number = 1;
  actionsUsed: {
    standard: number;
    move: number;
    minor: number;
  } = {
    standard: 0,
    move: 0,
    minor: 0
  };
  powersUsed: PowerUsageRecordPojo[] = [];
  damageDealt: number = 0;
  damageTaken: number = 0;
  healingGiven: number = 0;
  healingReceived: number = 0;
  statusEffectsApplied: StatusEffectPojo[] = [];
  statusEffectsRemoved: StatusEffectPojo[] = [];
}

/**
 * 战斗记录POJO
 */
export class CombatRecordPojo {
  combatId: string = "";
  startTime: number = Date.now();
  endTime?: number;
  participants: UnitPojo[] = [];
  turns: TurnRecordPojo[] = [];
  winner?: string; // party name
  totalRounds: number = 0;
  totalDamage: number = 0;
  totalHealing: number = 0;
}

// 重新导入需要的类型
import { UnitPojo } from './UnitPojo';
import { PowerPojo } from './PowerPojo';
