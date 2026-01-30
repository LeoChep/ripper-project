import { tileSize } from "./../envSetting";
import type { Unit } from "../units/Unit";
import { checkPassiable } from "./AttackSystem";
import { golbalSetting } from "../golbalSetting";
import { MessageTipSystem } from "./MessageTipSystem";
import { InitiativeSheet } from "./InitiativeSystem";
import { attackMovementToUnit } from "../action/UnitAttack";
import { WeaponSystem } from "./WeaponSystem";
import type { Weapon } from "../units/Weapon";
import { UnitSystem } from "./UnitSystem";

export class OpportunitySystem {
  constructor() {
    // 初始化逻辑
  }
  static getOpportunityUnit(
    startMoveGrids: { x: number; y: number }[],
    targetUnit: Unit,
  ): Unit[] {
    const opportunityUnits = [] as Unit[];
    InitiativeSheet.forEach((checkInit) => {
      const checkUnit = checkInit.owner;
      if (checkUnit === undefined) {
        return;
      }
      if (checkUnit == null || checkUnit.id === targetUnit.id) {
        return; // 如果是目标单位本身，则跳过
      }
      if (checkUnit.party === targetUnit.party) {
        return; // 如果是同一方的单位，则跳过
      }
      // 检查单位是否可以触发借机
      //用一个数组矩阵来存储checkUnit的周围格子
      const arroundGrids = UnitSystem.getInstance().getGridsArround(checkUnit);
      // const surroundingTiles = [
      //   [checkUnitX - 1, checkUnitY - 1], // 左上
      //   [checkUnitX, checkUnitY - 1], // 上
      //   [checkUnitX + 1, checkUnitY - 1], // 右
      //   [checkUnitX - 1, checkUnitY], // 左
      //   [checkUnitX + 1, checkUnitY], // 右
      //   [checkUnitX - 1, checkUnitY + 1], // 左下
      //   [checkUnitX, checkUnitY + 1], // 下
      //   [checkUnitX + 1, checkUnitY + 1], // 右下
      // ];
      // 检查目标位置是否在周围八个格子内
      let isInRangeFaze = false;
      for (const { x, y } of arroundGrids) {
        for (let startMoveGrid of startMoveGrids) {
          const moveStartGridx = startMoveGrid.x;
          const moveStartGridy = startMoveGrid.y;
          if (moveStartGridx === x && moveStartGridy === y) {
            isInRangeFaze = true; // 如果目标位置在周围八个格子内，返回 true
            //  console.log("目标位置在单位周围格子内", x, y);
            break;
          }
        }
      }
      let isInrange = false;
      console.log(
        `检查单位 ${checkUnit.name} 是否可以触发借机: `,
        isInRangeFaze,
      );
      const grids = startMoveGrids;
      if (isInRangeFaze) {
        for (let { x, y } of grids) {
          let isthePointInRangeCheck = checkPassiable(checkUnit, x, y);
          if (isthePointInRangeCheck) {
            isInrange = true;
            break;
          }
        }
      }
      if (isInrange) {
        opportunityUnits.push(checkUnit);
      }
    });
    return opportunityUnits;
  }
  static opportunitysHandle(targetUnit: Unit, opportunityUnits: Unit[]) {
    const promise = new Promise<void>(async (resolve) => {
      for (let i = 0; i < opportunityUnits.length; i++) {
        await OpportunitySystem.opportunityHandle(
          targetUnit,
          opportunityUnits[i],
        );
      }
      resolve();
    });
    return promise;
  }
  static opportunityHandle(
    targetUnit: Unit,
    opportunityUnit: Unit,
  ): Promise<void> {
    if (opportunityUnit.party === "player") {
      return new Promise<void>(async (resolve) => {
        const attack = WeaponSystem.getInstance().createWeaponAttack(
          opportunityUnit,
          opportunityUnit.creature?.weapons?.[0] as Weapon,
        );
        if (attack) {
          // alert(`单位 ${opportunityUnit.name} 可以对 ${targetUnit.name} 触发借机攻击`);
          const confirm = MessageTipSystem.getInstance().confirm(
            `单位 ${opportunityUnit.name} 可以触发借机攻击，是否执行？`,
          );
          confirm.then((res) => {
            if (res) {
              // 执行借机攻击

              attackMovementToUnit(
                targetUnit,
                opportunityUnit,
                attack,
                golbalSetting.map,
              ).then(() => {
                resolve();
              });
            } else {
              // 用户选择不执行借机攻击
              console.log(`单位 ${opportunityUnit.name} 未执行借机攻击`);
              resolve();
            }
          });
        } else {
          // 没有有效攻击动作，直接 resolve
          resolve();
        }
      });
    } else {
      if (opportunityUnit.ai === undefined) {
        console.warn(
          `单位 ${opportunityUnit.name} 没有 AI 接口，无法执行借机攻击`,
        );
        return Promise.resolve();
      }
      return opportunityUnit.ai?.opportunityAttack(targetUnit);
    }
  }
}
