import { StateMachinePack } from "./../stateMachine/StateMachinePack";
import { Trait } from "../trait/Trait";

import type { UnitAnimSpirite } from "../anim/UnitAnimSprite";
import type { Creature } from "@/core/units/Creature";
import type { InitiativeClass } from "../type/InitiativeClass";
import type { AIInterface } from "../type/AIInterface";
import { NormalAI } from "../ai/NormalAI";
import type { Action } from "../type/Action";
import { WalkStateMachine } from "../stateMachine/WalkStateMachine";
import { TriatSystem } from "../system/TraitSystem";

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

    this.stateMachinePack = new StateMachinePack(this); // 初始化状态机包
    this.stateMachinePack.addMachine("walk", new WalkStateMachine(this)); // 添加默认的 AI 状态机
  }
}

export async function loadTraits(unit: Unit,unitCreated: Creature) {
  if (unitCreated.traits.length > 0) {
    for (let i = 0; i < unitCreated.traits.length; i++) {
      const loadTrait = await TriatSystem.getInstance().createTrait(
        unitCreated.traits[i].name,
        unit
      );
      if (loadTrait) {
        unit.traits[i] = loadTrait; // 替换为加载后的 Trait 实例
      } else {
        console.warn(`Trait ${unit.traits[i].name} could not be loaded.`);
      }
    }
  }
}
// 工厂函数：根据 map.sprites 生成 Unit 实例数组
export function createUnitsFromMapSprites(sprites: any[]): Unit[] {
  return sprites.map((obj) => {
    const partyProp = obj.properties?.find((p: any) => p.name === "party");
    const unitTypeNameProp = obj.properties?.find(
      (p: any) => p.name === "unitTypeName"
    );
    const directionProp = obj.properties?.find(
      (p: any) => p.name === "direction"
    );
    const unit = new Unit({
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
    });
    if (unit.party !== "player") {
      unit.ai = new NormalAI();
      unit.ai.owner = unit;
    }

    return unit;
  });
}

// 工厂函数：根据单个 sprite 对象生成 Unit 实例
export function createUnitFromSprite(obj: any): Unit {
  const partyProp = obj.properties?.find((p: any) => p.name === "party");
  const unitTypeNameProp = obj.properties?.find(
    (p: any) => p.name === "unitTypeName"
  );
  const directionProp = obj.properties?.find(
    (p: any) => p.name === "direction"
  );
  return new Unit({
    id: obj.id,
    name: obj.name,
    x: obj.x,
    y: obj.y,
    width: obj.width,
    height: obj.height,
    party: partyProp ? partyProp.value : "",
    unitTypeName: unitTypeNameProp ? unitTypeNameProp.value : "",
    direction: directionProp ? directionProp.value : 2, // 默认方向为 0
    gid: obj.gid,
  });
}
