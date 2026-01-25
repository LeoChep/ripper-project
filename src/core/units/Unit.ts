import { StateMachinePack } from "./../stateMachine/StateMachinePack";
import { Trait } from "../trait/Trait";
import { Power } from "../power/Power";

import type { UnitAnimSpirite } from "../anim/UnitAnimSprite";
import type { Creature } from "@/core/units/Creature";
import type { InitiativeClass } from "../type/InitiativeClass";
import type { AIInterface } from "../type/AIInterface";
import { NormalAI } from "../ai/NormalAI";
import type { Action } from "../type/Action";
import { WalkStateMachine } from "../stateMachine/WalkStateMachine";
import { TriatSystem } from "../system/TraitSystem";
import { PowerSystem } from "../system/PowerSystem";

export interface UnitOptions {
  id: number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  party: string;
  unitTypeName: string;
  gid?: number;
  direction: number; // 方向，0-3 分别表示上、右、下、左
  traits?: Trait[];
  powers?: Power[];
}

export class Unit {
  ai: AIInterface | undefined; // AI 接口，可能是 AI 实例
  actions = [] as Action[];
  id: number;
  name: string;
  party: string;
  unitTypeName: string;
  gid?: number;
  x: number;
  y: number;
  width: number;
  height: number;
  effects: any[] = []; // 特效数组
  traits: Trait[];
  powers: Power[];

  animUnit: UnitAnimSpirite | undefined;
  initiative?: InitiativeClass;
  state: string = "idle"; // 状态，默认为 "idle"
  stateMachinePack: StateMachinePack; // 状态机包
  creature: Creature | undefined; // 可能是 Creature 实例
  direction: number = 0; // 方向，0-3 分别表示上、右、下、左
  constructor(options: UnitOptions) {
    this.id = options.id;
    this.name = options.name;
    this.x = options.x;
    this.y = options.y;
    this.width = options.width;
    this.height = options.height;
    this.party = options.party;
    this.direction = options.direction;
    this.unitTypeName = options.unitTypeName;
    this.gid = options.gid;
    this.traits = options.traits || [];
    this.powers = options.powers || [];

    this.stateMachinePack = new StateMachinePack(this); // 初始化状态机包
    this.stateMachinePack.addMachine("walk", new WalkStateMachine(this)); // 添加默认的 AI 状态机
  }
}

export async function loadTraits(unit: Unit, unitCreature: Creature) {
  if (unitCreature.traits.length > 0) {
    for (let i = 0; i < unitCreature.traits.length; i++) {
      const loadTrait = await TriatSystem.getInstance().createTrait(
        unitCreature.traits[i],
        unit,
      );
      if (loadTrait) {
        unitCreature.traits[i] = loadTrait; // 替换为加载后的 Trait 实例
      } else {
        console.warn(`Trait ${unit.traits[i].name} could not be loaded.`);
      }
    }
  }
  if (unitCreature.feats.length > 0) {
    for (let i = 0; i < unitCreature.feats.length; i++) {
      const loadTrait = await TriatSystem.getInstance().createTrait(
        unitCreature.feats[i],
        unit,
        "feat",
      );
      if (loadTrait) {
        unitCreature.feats[i] = loadTrait; // 替换为加载后的 Trait 实例
      } else {
        console.warn(
          `Trait ${unitCreature.feats[i].name} could not be loaded.`,
        );
      }
    }
  }
}
export async function loadPowers(unit: Unit, unitCreature: Creature) {
  if (unitCreature.powers.length > 0) {
    for (let i = 0; i < unitCreature.powers.length; i++) {
      const powerName = unitCreature.powers[i].name;
      if (!powerName) {
        console.warn("powerName is required.");
        return null;
      }
      const power = await PowerSystem.getInstance().createPower(
        powerName,
        unit,
      );
      if (!power) {
        console.warn(`Power class not found for: ${powerName}`);
        continue;
      }

      unitCreature.powers[i] = power; // 替换为加载后的 Power 实例
    }
  }
}
// 工厂函数：根据 map.sprites 生成 Unit 实例数组
export function createUnitsFromMapSprites(sprites: any[]): Unit[] {
  return sprites.map((obj) => {
    return createUnitFromMapSprite(obj);
  });
}

// 工厂函数：根据单个 sprite 对象生成 Unit 实例
export function createUnitFromMapSprite(obj: any): Unit {
  const partyProp = obj.properties?.find((p: any) => p.name === "party");
  const unitTypeNameProp = obj.properties?.find(
    (p: any) => p.name === "unitTypeName",
  );
  const directionProp = obj.properties?.find(
    (p: any) => p.name === "direction",
  );
  const unitInfo = {
    id: obj.id,
    name: obj.name,
    x: obj.x,
    y: obj.y,
    width: obj.width,
    height: obj.height,
    party: partyProp ? partyProp.value : "",
    unitTypeName: unitTypeNameProp ? unitTypeNameProp.value : "",
    gid: obj.gid,
    direction: directionProp ? directionProp.value : 2, // 默认方向为 0
  };
  const unit = new Unit(unitInfo);

  return unit;
}
export function createUnitFromUnitInfo(obj: any): Unit {
  const unit = new Unit({
    id: obj.id,
    name: obj.name,
    x: obj.x,
    y: obj.y,
    width: obj.width,
    height: obj.height,
    party: obj.party,
    unitTypeName: obj.unitTypeName,
    gid: obj.gid,
    direction: obj.direction, // 默认方向为 0
  });
  if (unit.party !== "player") {
    unit.ai = new NormalAI();
    unit.ai.owner = unit;
  }
  return unit;
}
