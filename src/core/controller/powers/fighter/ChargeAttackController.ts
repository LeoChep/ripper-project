import { UnitSystem } from "../../../system/UnitSystem";
import { Weapon } from "../../../units/Weapon";
import { Unit } from "@/core/units/Unit";
import { AbstractPwoerController } from "../AbstractPwoerController";
import type { CreatureAttack } from "@/core/units/Creature";

import { golbalSetting } from "@/core/golbalSetting";

import { checkPassiable as moveGridsCheckPassiable } from "@/core/system/UnitMoveSystem";
import { tileSize } from "@/core/envSetting";
import { generateWays } from "@/core/utils/PathfinderUtil";
import { BasicSelector } from "@/core/selector/BasicSelector";
import { ShiftAnim } from "@/core/anim/ShiftAnim";
import { MessageTipSystem } from "@/core/system/MessageTipSystem";
import { AbilityValueSystem } from "@/core/system/AbilitiyValueSystem";
import { BasicLineSelector } from "@/core/selector/BasicLineSelector";
import { moveMovement } from "@/core/action/UnitMove";
import {
  attackMovementToUnit,
  attackMovementToXY,
  playerSelectAttackMovement,
} from "@/core/action/UnitAttack";
import { WeaponSystem } from "@/core/system/WeaponSystem";
import { segmentsIntersect } from "@/core/utils/MathUtil";
import type { TiledMap } from "@/core/MapClass";
import { useAction, useStandAction } from "@/core/system/InitiativeSystem";

export class ChargeAttackController extends AbstractPwoerController {
  public static isUse: boolean = false;
  public static instense: ChargeAttackController | null = null;

  selectedCharacter: Unit | null = null;

  constructor() {
    super();
  }

  doSelect = async (): Promise<any> => {
    if (!this.preFix()) return Promise.resolve();
    const { x, y } = this.getXY();
    const unit = this.selectedCharacter as Unit;
    const mainAttack1 = this.getAttack(unit, 1);
    const speed = unit.creature?.speed;
    console.log("unit speed", speed);
    const grids = generateWays(x, y, speed ? speed : 0, (x, y, prex, prey) => {
      return checkPassiable(
        unit,
        prex * tileSize,
        prey * tileSize,
        x * tileSize,
        y * tileSize,
        golbalSetting.map
      );
    });

    // 执行攻击选择逻辑
    const basicAttackSelector = BasicLineSelector.getInstance().selectBasic(
      grids,
      1,
      "blue",
      true,
      () => true,
      { x: x, y: y }
    );
    MessageTipSystem.getInstance().setMessage("请选择主目标");
    this.graphics = BasicSelector.getInstance().graphics;
    this.removeFunction = basicAttackSelector.removeFunction;
    let resolveCallback = (result: any) => {};
    const promise = new Promise((resolve) => {
      resolveCallback = resolve;
    });

    const result = await basicAttackSelector.promise;

    const linePathGrid = result.linePathGrid;
    const moveEnd =
      linePathGrid[`${result.selected[0].x},${result.selected[0].y}`];
    if (moveEnd.step <= 2) {
      MessageTipSystem.getInstance().setMessage("冲锋需要至少移动2格");
      this.removeFunction();
      resolveCallback({});
    } else {
      useAction(unit,'standard');
      await moveMovement(moveEnd.x, moveEnd.y, unit, linePathGrid);
      await attackMovementToXY(
        result.selected[0].x,
        result.selected[0].y,
        unit,
        mainAttack1,
        golbalSetting.map
      ).then(() => {
        console.log("resolveCallback", {});
        resolveCallback({});
      });
    }

    console.log("resolveCallback", {});
    return promise;
  };
  getAttack = (unit: Unit, num: number) => {
    const weapon = unit.creature?.weapons?.[num - 1];
    const attack = {} as CreatureAttack;
    const range = weapon?.range ?? 1; // 默认攻击范围为1
    const modifer = AbilityValueSystem.getInstance().getAbilityModifier(
      unit,
      "STR"
    );
    attack.attackBonus =
      AbilityValueSystem.getInstance().getLevelModifier(unit);
    attack.attackBonus += modifer;
    attack.attackBonus += weapon?.bonus ?? 0; // 添加武器加值
    attack.attackBonus += 1 + 3 + 1; // 武器大师、擅长加值、战斗专长
    attack.damage = weapon?.damage ?? "1d6"; // 默认伤害为1d6
    attack.damage += `+${weapon?.bonus ?? 0}+${modifer}+1`; // 添加攻击加值到伤害
    attack.name = "Funneling Flurry";
    attack.type = "melee";
    attack.range = range;
    return attack;
  };
}
export const checkPassiable = (
  unit: Unit,
  prex: number,
  prey: number,
  x: number,
  y: number,
  mapPassiable: TiledMap | null
) => {
  if (!mapPassiable) {
    return false;
  }
  const mapWidth = mapPassiable.width * mapPassiable.tilewidth;
  const mapHeight = mapPassiable.height * mapPassiable.tileheight;
  if (x < 0 || y < 0 || x >= mapWidth || y >= mapHeight) {
    return false;
  }

  // console.log(`检查通行性: 单位位置 (${prey}, ${prey}), 目标位置 (${x}, ${y})`);
  // 检查单位是否在地图上
  let passiable = true;
  if (mapPassiable) {
    const edges = mapPassiable.edges;
    console.log(
      "检查通行性: 单位位置",
      prex,
      prey,
      "目标位置",
      x,
      y,
      mapPassiable
    );
    // 检查是否穿过边
    if (edges) {
      // console.log(edges)
      // 检查是否有对象在指定位置
      // 遍历对象组中的所有对象
      edges.forEach(
        (edge: {
          useable: boolean;
          x1: number;
          y1: number;
          x2: number;
          y2: number;
        }) => {
          if (edge.useable === false) {
            return; // 如果边不可用，则跳过
          }
          let testx = x;
          let testy = y;

          // 获取两个格子的四个顶点和中点
          const pointsA = [
            { x: prex + 32, y: prey + 32 },
            { x: prex, y: prey },
            { x: prex + 64, y: prey },
            { x: prex + 64, y: prey + 64 },
            { x: prex, y: prey + 64 },
          ];
          const pointsB = [
            { x: testx + 32, y: testy + 32 },
            { x: testx, y: testy },
            { x: testx + 64, y: testy },
            { x: testx + 64, y: testy + 64 },
            { x: testx, y: testy + 64 },
          ];
          // 检查所有中点的连线
          let intersectCount = 0;
          for (let i = 0; i < 1; i++) {
            if (
              segmentsIntersect(
                pointsA[i].x,
                pointsA[i].y,
                pointsB[i].x,
                pointsB[i].y,
                edge.x1,
                edge.y1,
                edge.x2,
                edge.y2
              )
            ) {
              intersectCount++;
            }
          }
          if (intersectCount >= 1) {
            passiable = false;
            return;
          }
        }
      );
    }
    // 检查是否被敌人阻挡
    const units = mapPassiable.sprites as Unit[];
    if (units) {
      units.forEach((checkUnit) => {
        if (checkUnit.x != prex || checkUnit.y != prey || unit == checkUnit) {
          return;
        }
        if (unit.party == checkUnit.party || checkUnit.state === "dead") {
          return; // 如果是同一方的单位，则跳过
        }
        passiable = false; // 如果有敌人阻挡，则不可通行
        // 检查是否与敌人相交
      });
    }
  }

  return passiable;
};
