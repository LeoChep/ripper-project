import * as InitiativeSystem from "../../system/InitiativeSystem";
import { ModifierSystem } from "../../system/ModifierSystem";
import { UnitSystem } from "../../system/UnitSystem";
import * as UnitMoveSystem from "../../system/UnitMoveSystem";
import { generateWaysAsync } from "../../utils/PathfinderUtil";
import * as UnitMove from "../../action/UnitMove";
import type { TiledMap } from "../../MapClass";
import { Unit } from "../../units/Unit";
import { ActionAI, type ActionAIResult } from "./ActionAI";
import type { ActionType } from "./ActionAI";
import { tileSize } from "../../envSetting";

/**
 * 远程攻击位置AI（风筝战术AI）
 * 在可以攻击到敌人的情况下，尽量保持自己离敌人更远
 * 适用于远程单位或需要放风筝的单位
 * 消耗 move 动作
 */
export class FarAwayAttackPositionAI extends ActionAI {
  public priority: number = 100; // 比普通攻击位置AI优先级稍低
  public actionType: ActionType = "move";

  getName(): string {
    return "FarAwayAttackPosition";
  }

  canExecute(unit: Unit, _map: TiledMap): boolean {
    // 检查是否有攻击能力
    if (!unit.creature?.attacks || unit.creature.attacks.length === 0) {
      return false;
    }

    // 检查是否可以使用移动动作
    return InitiativeSystem.checkActionUseful(unit, "move");
  }

  async execute(unit: Unit, map: TiledMap): Promise<ActionAIResult> {
    const unitX = Math.floor(unit.x / tileSize);
    const unitY = Math.floor(unit.y / tileSize);

    console.log(`AI: ${unit.name} 寻找远程攻击位置（风筝战术），当前位置:`, unitX, unitY);

    // 记录当前位置与敌人的距离，用于比较
    const currentResult: any = { canAttack: false, bestDistance: -1 };
    this.findAttackTargetByUnit(unitX, unitY, unitX, unitY, unit, map, currentResult);
    const currentDistance = currentResult.bestDistance ?? -1;

    const result: any = { canAttack: false, bestDistance: currentDistance, bestX: unitX, bestY: unitY };
    let path: any = {};

    // 寻找可攻击的位置，遍历完所有格子找到距离敌人最远的位置
    path = await generateWaysAsync({
      start: { x: unitX, y: unitY },
      range: 20,
      checkFunction: (nx: number, ny: number, x: number, y: number) => {
        return this.findAttackTargetByUnit(nx, ny, x, y, unit, map, result);
      },
    });

    // 只有找到比当前位置更远的位置时才移动
    if (result.canAttack && result.bestDistance > currentDistance) {
      result.x = result.bestX;
      result.y = result.bestY;

      await this.moveToPosition(unit, path, result);

      return {
        executed: true,
        description: `移动到远程攻击位置(距离${result.bestDistance})，目标: ${result.target?.name}`,
      };
    }

    console.log(`AI: ${unit.name} 没有找到更远的攻击位置，当前距离: ${currentDistance}`);
    return {
      executed: false,
      description: "没有比当前位置更远的攻击位置",
    };
  }

  /**
   * 移动到目标位置
   */
  private async moveToPosition(unit: Unit, path: any, result: any) {
    let lastStep = path[`${result.x},${result.y}`] as unknown as {
      x: number;
      y: number;
      step: number;
    } | undefined;
    let stepnum = 0;
    if (lastStep?.step) stepnum = lastStep.step;
    let rc: { x: number; y: number; step: number } | null = {
      x: result.x,
      y: result.y,
      step: stepnum
    };

    console.log(`AI: ${unit.name} 目标路径点:`, rc);

    // 消耗移动动作
    if (!InitiativeSystem.useMoveAction(unit)) {
      console.log(`AI: ${unit.name} 无法使用移动动作`);
      return;
    }

    let speed = ModifierSystem.getInstance()
      .getValueStack(unit, "speed")
      .finalValue;

    // 处理拥堵位置
    rc = await this.handleCongestedPosition(unit, path, rc);

    // 检查是否还有有效位置
    if (!rc) {
      console.log(`AI: ${unit.name} 没有找到可用位置`);
      return;
    }

    // 根据速度限制调整位置
    let least = rc.step - speed;
    // if (least > 0 && InitiativeSystem.useStandAction(unit)) {
    //   least = least - speed;
    // }

    while (least > 0 && rc) {
      rc = path[`${rc.x},${rc.y}`] as unknown as {
        x: number;
        y: number;
        step: number;
      } | null;
      if (!rc) break;
      least--;
    }

    if (rc) {
      result.x = rc.x;
      result.y = rc.y;
      await UnitMove.moveMovement(result.x, result.y, unit, path);
    }
  }

  /**
   * 处理拥堵位置
   */
  private async handleCongestedPosition(
    unit: Unit,
    path: any,
    rc: { x: number; y: number; step: number }
  ): Promise<{ x: number; y: number; step: number } | null> {
    let noUnit = false;
    let currentRc: { x: number; y: number; step: number } | null = rc;

    while (!noUnit && currentRc) {
      const moveEndGrids = UnitSystem.getInstance().getGridsBySize(
        currentRc.x,
        currentRc.y,
        unit.creature?.size ?? "middle"
      );
      noUnit = true;

      for (let grid of moveEndGrids) {
        const findUnit = UnitSystem.getInstance().findUnitByGridxy(
          grid.x,
          grid.y
        );
        if (currentRc && findUnit && findUnit !== unit && findUnit.state !== "dead") {
          noUnit = false;
        }
      }

      if (currentRc && !noUnit) {
        console.log(
          `AI单位 ${unit.name} 在位置`,
          currentRc,
          `拥堵，继续寻找`
        );
        currentRc = path[`${currentRc.x},${currentRc.y}`] as unknown as {
          x: number;
          y: number;
          step: number;
        } | null;
      }
    }

    return currentRc;
  }

  /**
   * 查找攻击目标
   * 与普通AI不同：优先选择距离敌人更远的位置
   */
  private findAttackTargetByUnit(
    nx: number,
    ny: number,
    x: number,
    y: number,
    unit: Unit,
    tiledMap: TiledMap,
    result: any
  ): boolean {
    let passiable = true;
    if (tiledMap) {
      passiable = UnitMoveSystem.checkPassiable(
        unit,
        x * tileSize,
        y * tileSize,
        nx * tileSize,
        ny * tileSize,
        tiledMap
      );
    }

    if (!passiable) {
      return false;
    }

    let noUnit = true;
    const moveEndGrids = UnitSystem.getInstance().getGridsBySize(
      nx,
      ny,
      unit.creature?.size ?? "middle"
    );

    for (let grid of moveEndGrids) {
      const findUnit = UnitSystem.getInstance().findUnitByGridxy(grid.x, grid.y);
      if (findUnit && findUnit !== unit && findUnit.state !== "dead") {
        noUnit = false;
      }
    }

    const unitSettingx = nx;
    const unitSettingy = ny;
    const range = unit.creature?.attacks[0].range ?? 1;

    for (let grid of moveEndGrids) {
      const findR = this.findAttackTargetByUnitMap(unit, grid.x, grid.y, range);
      const findUnitInThisPoint = findR.target;

      if (findUnitInThisPoint) {
        if (
          findUnitInThisPoint === unit ||
          findUnitInThisPoint.state === "dead"
        ) {
          continue;
        }
        if (findUnitInThisPoint.party === unit.party) {
          continue;
        }
        if (findUnitInThisPoint.party === "player" && unit.friendly === true) {
          continue;
        }

        // 计算与敌人的距离
        const enemyX = Math.floor(findUnitInThisPoint.x / tileSize);
        const enemyY = Math.floor(findUnitInThisPoint.y / tileSize);
        const distance = Math.max(
          Math.abs(unitSettingx - enemyX),
          Math.abs(unitSettingy - enemyY)
        );

        // 风筝战术：优先选择距离敌人更远的位置
        // 但不能超过攻击范围
        if (distance <= range && noUnit) {
          // 更新最佳距离和位置
          if (distance > result.bestDistance) {
            result.bestDistance = distance;
            result.bestX = unitSettingx;
            result.bestY = unitSettingy;
            result.target = findUnitInThisPoint;
            result.canAttack = true;
            console.log(unit, `AI找到更远的攻击位置 (${unitSettingx},${unitSettingy})，距离: ${distance}`);
          }
        }
      }
    }

    return true;
  }

  /**
   * 在单位周围查找攻击目标
   */
  private findAttackTargetByUnitMap(
    unit: Unit,
    settingx: number,
    settingy: number,
    range: number
  ) {
    const units = UnitSystem.getInstance().getAllUnits();
    const enemyUnits: Unit[] = [];

    units.forEach((checkUnit) => {
      let isFriendlyNpcCheckPlayer = false;
      if (checkUnit.party === "player" && unit.friendly) {
        isFriendlyNpcCheckPlayer = true;
      }
      if (
        checkUnit.party !== unit.party &&
        checkUnit.state !== "dead" &&
        !isFriendlyNpcCheckPlayer
      ) {
        enemyUnits.push(checkUnit);
      }
    });

    const result: any = { canAttack: false };

    for (let enemyUnit of enemyUnits) {
      const grids = UnitSystem.getInstance().getUnitGrids(enemyUnit);
      for (const grid of grids) {
        const passable = this.checkPassableBySize(
          unit.creature?.size ?? "middle",
          settingx,
          settingy,
          grid.x,
          grid.y,
          range
        );

        if (passable) {
          result.canAttack = true;
          result.target = enemyUnit;
        }
      }
    }

    return result;
  }

  /**
   * 检查是否在攻击范围内且可通行
   */
  private checkPassableBySize(
    _size: string,
    unitSettingx: number,
    unitSettingy: number,
    targetX: number,
    targetY: number,
    range: number
  ): boolean {
    const dis = Math.max(
      Math.abs(targetX - unitSettingx),
      Math.abs(targetY - unitSettingy)
    );
    return dis <= range;
  }
}
