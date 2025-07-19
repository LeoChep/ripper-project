import { tileSize } from "./../envSetting";
import type { Unit } from "../units/Unit";
import { checkPassiable } from "./AttackSystem";
import { golbalSetting } from "../golbalSetting";
import { InitiativeSheet } from "./InitiativeSystem";

export class OpportunitySystem {
  constructor() {
    // 初始化逻辑
  }
  static getOpportunityUnit(
    targetX: number,
    targetY: number,
    targetUnit: Unit
  ): Unit[] {
    const opportunityUnits = [] as Unit[];
    InitiativeSheet.forEach((checkInit) => {
      const checkUnit = checkInit.owner;
      if (checkUnit === undefined) {
        return;
      }
      if (checkUnit.party === targetUnit.party) {
        return; // 如果是同一方的单位，则跳过
      }
      // 检查单位是否可以触发借机
      const checkUnitX = Math.floor(checkUnit.x / tileSize);
      const checkUnitY = Math.floor(checkUnit.y / tileSize);
      //用一个数组矩阵来存储checkUnit的周围八个格子
      const surroundingTiles = [
        [checkUnitX - 1, checkUnitY - 1], // 左上
        [checkUnitX, checkUnitY - 1], // 上
        [checkUnitX + 1, checkUnitY - 1], // 右
        [checkUnitX - 1, checkUnitY], // 左
        [checkUnitX + 1, checkUnitY], // 右
        [checkUnitX - 1, checkUnitY + 1], // 左下
        [checkUnitX, checkUnitY + 1], // 下
        [checkUnitX + 1, checkUnitY + 1], // 右下
      ];
      // 检查目标位置是否在周围八个格子内
      let isInRangeFaze = false;
      for (const [x, y] of surroundingTiles) {
        if (x === targetX && y === targetY) {
          isInRangeFaze = true; // 如果目标位置在周围八个格子内，返回 true
        }
      }
      let isInrange = false;
      console.log(
        `检查单位 ${checkUnit.name} 是否可以触发借机: `,
        isInRangeFaze
      );
      if (isInRangeFaze) {
        isInrange = checkPassiable(
          checkUnit,
          targetUnit.x,
          targetUnit.y,
          golbalSetting.map
        );
      }
      if (isInrange) {
        opportunityUnits.push(checkUnit);
      }
    });
    return opportunityUnits;
  }
  static opportunitysHandle(targetUnit: Unit, opportunityUnits: Unit[]) {
    const promises = [] as Promise<void>[];
    opportunityUnits.forEach((opportunityUnit) => {
      const promise = OpportunitySystem.opportunityHandle(targetUnit, opportunityUnit);
      promises.push(promise);
    });
    return Promise.all(promises);
  }
  static opportunityHandle(
    targetUnit: Unit,
    opportunityUnit: Unit
  ): Promise<void> {
    if (opportunityUnit.party === "player") {
      alert(`单位 ${targetUnit.name} 触发了借机攻击！`);
      return Promise.resolve();
    } else {
      if (opportunityUnit.ai === undefined) {
        console.warn(
          `单位 ${opportunityUnit.name} 没有 AI 接口，无法执行借机攻击`
        );
        return Promise.resolve();
      }
      
      return opportunityUnit.ai?.opportunityAttack(targetUnit);
    }
  }
}
