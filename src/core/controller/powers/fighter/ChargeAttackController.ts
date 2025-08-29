import { UnitSystem } from "../../../system/UnitSystem";
import { Unit } from "@/core/units/Unit";
import { AbstractPwoerController } from "../AbstractPwoerController";

import { golbalSetting } from "@/core/golbalSetting";

import { checkPassiable as attackCheckPassiable } from "@/core/system/AttackSystem";
import { tileSize } from "@/core/envSetting";
import { generateWays } from "@/core/utils/PathfinderUtil";
import { BasicSelector } from "@/core/selector/BasicSelector";

import { MessageTipSystem } from "@/core/system/MessageTipSystem";

import {
  BasicLineSelector,
  type ScanData,
} from "@/core/selector/BasicLineSelector";
import { moveMovement } from "@/core/action/UnitMove";
import {
  attackMovementToXY,
} from "@/core/action/UnitAttack";
import { segmentsIntersect } from "@/core/utils/MathUtil";
import type { TiledMap } from "@/core/MapClass";
import { useAction } from "@/core/system/InitiativeSystem";
import * as AttackSystem from "@/core/system/AttackSystem";

export class ChargeAttackController extends AbstractPwoerController {
  public static isUse: boolean = false;
  public static instense: ChargeAttackController | null = null;
  powerName='ChargeAttack'
  selectedCharacter: Unit | null = null;

  constructor() {
    super();
  }
  getAttack = (unit: Unit, num: number) => {
    const weapon = unit.creature?.weapons?.[num - 1];
    const attackParams={attackFormula:'[STR]', damageFormula:'[W]+[STR]', keyWords:[], weapon:weapon, unit:unit}
    const attack = AttackSystem.createAttack(attackParams);

    return attack;
  };
  doSelect = async (): Promise<any> => {
    if (!this.preFix()) return Promise.resolve();
    const { x, y } = this.getXY();
    const unit = this.selectedCharacter as Unit;
    const mainAttack1 = this.getAttack(unit, 1);
    const speed = unit.creature?.speed;

    console.log("unit speed", speed);
    const grids = generateWays({
      start: { x, y },
      range: (speed ? speed : 0) + 1,
      checkFunction: (nx: number, ny: number, prex: number, prey: number) => {
        return checkPassiable(
          unit,
          prex * tileSize,
          prey * tileSize,
          nx * tileSize,
          ny * tileSize,
          golbalSetting.map
        );
      }
    });
    let canCharge = false;
    const scanFunction = (scanData: ScanData) => {
      let outSpeedFlag = false;
      let tooShortFlag = false;
      let beBlockFlag = false;
      const linePath = scanData.linePathGrid;
      if (!linePath) return;
      const gridx = scanData.gridx;
      const gridy = scanData.gridy;
      Object.keys(linePath).forEach((key) => {
        const [x, y] = key.split(",").map(Number);
        if (linePath[key] && linePath[key].step > (speed ?? 0)+1) {
          outSpeedFlag = true;
        }
        const unitInGrid=UnitSystem.getInstance().findUnitByGridxy(x, y);
        if (unitInGrid && unitInGrid !== unit&&unitInGrid.party!=unit.party&&unitInGrid.state !== "dead") {
          const finalChargeTarget=UnitSystem.getInstance().findUnitByGridxy(gridx, gridy);
          if (unitInGrid!=finalChargeTarget) {
            console.log('unitInGrid at charge',unitInGrid,finalChargeTarget)
            beBlockFlag = true;
          }
        }
      })

      const targetGrid = linePath[`${gridx},${gridy}`];
      if (targetGrid && targetGrid.step <= 2) {
        tooShortFlag = true;
      }
      if (targetGrid){
         const noBeblockByWall=attackCheckPassiable(unit, targetGrid.x , targetGrid.y );
         if (!noBeblockByWall)
          beBlockFlag = true;
        }
       
      if (outSpeedFlag) {
        MessageTipSystem.getInstance().setMessage("超出冲锋范围");
        canCharge = false;
        return;
      }
      if (tooShortFlag) {
        MessageTipSystem.getInstance().setMessage("冲锋需要至少移动2格");
        canCharge = false;
        return;
      }
      if (beBlockFlag) {
        MessageTipSystem.getInstance().setMessage("冲锋路径被阻挡");
        canCharge = false;
        return;
      }
      MessageTipSystem.getInstance().clearMessage();
      canCharge = true;
    };
    // 执行攻击选择逻辑
    const basicAttackSelector = BasicLineSelector.getInstance().selectBasic(
      grids,
      1,
      "blue",
      true,
      () => {return canCharge},
      scanFunction,
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
      this.removeFunction();
      resolveCallback({});
    } else {
      MessageTipSystem.getInstance().clearMessage();
      useAction(unit, "standard");
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
