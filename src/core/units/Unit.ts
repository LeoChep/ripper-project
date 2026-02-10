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
import type { Item } from "../item/Item";

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
  friendly?: boolean; // 是否友好（用于NPC互动等）
  isSceneHidden?: boolean; // 是否在场景中隐藏（不参与渲染和碰撞）
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
  friendly: boolean = false; // 是否友好
  isSceneHidden?: boolean; // 是否在场景中隐藏（不参与渲染和碰撞）
  traits: Trait[];
  powers: Power[];
  inventory: Item[] = []; // 背包系统

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
    // 如果party是player，默认friendly为true；否则使用传入的值或false
    this.friendly =
      options.party === "player" ? true : options.friendly ?? false;
    this.isSceneHidden = options.isSceneHidden ?? false;
    this.traits = options.traits || [];
    this.powers = options.powers || [];

    this.stateMachinePack = new StateMachinePack(this); // 初始化状态机包
    this.stateMachinePack.addMachine("walk", new WalkStateMachine(this)); // 添加默认的 AI 状态机
  }

  /**
   * 添加道具到背包
   * @param item 要添加的道具
   * @returns 是否成功添加
   */
  addItem(item: Item): boolean {
    // 检查是否可以与现有道具堆叠
    const existingItem = this.inventory.find((i) => i.canStackWith(item));
    if (existingItem) {
      const addAmount = Math.min(
        item.stackCount,
        existingItem.maxStack - existingItem.stackCount
      );
      console.log("addAmount", addAmount);
      if (addAmount > 0) {
        existingItem.addStack(addAmount);
        item.removeStack(addAmount);
        // 如果道具全部堆叠，返回true；否则继续添加剩余部分
        if (item.stackCount === 0) {
          return true;
        }
      }
    }

    // 如果无法堆叠或堆叠后还有剩余，添加为新物品
    if (item.stackCount > 0) {
      this.inventory.push(item);
    }
    return true;
  }

  /**
   * 从背包移除道具
   * @param itemUid 道具的uid
   * @param amount 移除数量（默认全部）
   * @returns 移除的道具，如果失败返回null
   */
  removeItem(itemUid: string, amount?: number): Item | null {
    const itemIndex = this.inventory.findIndex((i) => i.uid === itemUid);
    if (itemIndex === -1) {
      return null;
    }

    const item = this.inventory[itemIndex];
    const removeAmount = amount ?? item.stackCount;

    if (removeAmount >= item.stackCount) {
      // 移除整个道具
      return this.inventory.splice(itemIndex, 1)[0];
    } else {
      // 只移除部分
      const removedItem = item.clone();
      removedItem.stackCount = removeAmount;
      item.removeStack(removeAmount);
      return removedItem;
    }
  }

  /**
   * 根据uid获取道具
   * @param itemUid 道具uid
   * @returns 道具实例或null
   */
  getItem(itemUid: string): Item | null {
    return this.inventory.find((i) => i.uid === itemUid) || null;
  }

  /**
   * 根据名称查找道具
   * @param itemName 道具名称
   * @returns 道具数组
   */
  findItemsByName(itemName: string): Item[] {
    return this.inventory.filter((i) => i.name === itemName);
  }

  /**
   * 获取背包总重量
   * @returns 总重量
   */
  getInventoryWeight(): number {
    return this.inventory.reduce(
      (total, item) => total + item.getTotalWeight(),
      0
    );
  }

  /**
   * 获取背包总价值
   * @returns 总价值
   */
  getInventoryValue(): number {
    return this.inventory.reduce(
      (total, item) => total + item.getTotalValue(),
      0
    );
  }

  /**
   * 清空背包
   */
  clearInventory(): void {
    this.inventory = [];
  }
}

export async function loadTraits(unit: Unit, unitCreature: Creature) {
  if (unitCreature.traits.length > 0) {
    for (let i = 0; i < unitCreature.traits.length; i++) {
      const loadTrait = await TriatSystem.getInstance().createTrait(
        unitCreature.traits[i],
        unit
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
        "feat"
      );
      if (loadTrait) {
        unitCreature.feats[i] = loadTrait; // 替换为加载后的 Trait 实例
      } else {
        console.warn(
          `Trait ${unitCreature.feats[i].name} could not be loaded.`
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
        unit
      );
      power?.deserializeCooldownData(unitCreature.powers[i]);

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
    (p: any) => p.name === "unitTypeName"
  );
  const directionProp = obj.properties?.find(
    (p: any) => p.name === "direction"
  );
  const isHiddenProp = obj.properties?.find(
    (p: any) => p.name === "isSceneHidden"
  );
  const friendlyProp = obj.properties?.find((p: any) => p.name === "friendly");
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
    friendly: friendlyProp ? friendlyProp.value : false, // 默认不友好
    isSceneHidden: isHiddenProp ? isHiddenProp.value : false, // 默认不隐藏
  };
  const unit = createUnitFromUnitInfo(unitInfo);

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
    friendly: obj.friendly ?? false, // 默认不友好
    isSceneHidden: obj.isSceneHidden ?? false, // 默认不隐藏
  });
  if (unit.party !== "player") {
    unit.ai = new NormalAI();
    unit.ai.owner = unit;
  }
  return unit;
}
