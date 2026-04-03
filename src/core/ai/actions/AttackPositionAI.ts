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
 * 寻找攻击位置AI
 * 寻找可以攻击敌人的最佳位置并移动过去
 * 消耗 move 动作
 */
export class AttackPositionAI extends ActionAI {
  public priority: number = 50;
  public actionType: ActionType = "move";

  getName(): string {
    return "AttackPosition";
  }

  canExecute(unit: Unit, _map: TiledMap): boolean {
    // 检查是否有攻击能力
    
    if (!unit.creature?.attacks || unit.creature.attacks.length === 0) {
      return false;
    }
//

    // 首先检查原地是否可以攻击
        const unitX = Math.floor(unit.x / tileSize);
    const unitY = Math.floor(unit.y / tileSize);
        const result: any = { canAttack: false };
    this.findAttackTargetByUnit(unitX, unitY, unitX, unitY, unit, _map, result);
    if (result.canAttack) {
      return false; // 原地就能攻击，不需要寻找位置
    }
    // 检查是否可以使用移动动作
    return InitiativeSystem.checkActionUseful(unit, "move");
  }

  async execute(unit: Unit, map: TiledMap): Promise<ActionAIResult> {
    const unitX = Math.floor(unit.x / tileSize);
    const unitY = Math.floor(unit.y / tileSize);

    console.log(`AI: ${unit.name} 寻找攻击位置，当前位置:`, unitX, unitY);

    const result: any = { canAttack: false };

    let path: any = {};

     {
      // 需要移动寻找攻击位置
      path = await generateWaysAsync({
        start: { x: unitX, y: unitY },
        range: 20,
        checkFunction: (nx: number, ny: number, x: number, y: number) => {
          return this.findAttackTargetByUnit(nx, ny, x, y, unit, map, result);
        },
        endCheckFunction: () => {
          return result.target && result.canAttack;
        },
      });
    }

    if (result.target && path) {
      // 执行移动
      await this.moveToPosition(unit, path, result);

      return {
        executed: true,
        description: `移动到攻击位置，目标: ${result.target?.name}`,
      };
    }

    return {
      executed: false,
      description: "未找到可攻击的目标位置",
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

    console.log(`AI: ${unit.name} 最终路径点:`, rc);

    let isCantAttack = !result.canAttack;

    for (let num = 1; num < 2; num++) {
      if (rc) {
        if (!InitiativeSystem.useMoveAction(unit)) {
          break;
        }

        let speed = ModifierSystem.getInstance()
          .getValueStack(unit, "speed")
          .finalValue;

        if (isCantAttack) {
          // 如果不能攻击，检查是否为拥堵情况
          const congestedResult = await this.handleCongestedPosition(unit, path, rc);
          if (congestedResult) {
            rc = congestedResult;
          }
        }

        const range = unit.creature?.attacks[0].range ?? 1;
        console.log(
          unit.creature?.name,
          "AI最终移动位置:",
          rc,
          "是否能攻击:",
          range
        );

        if (rc && rc.step > speed) {
          console.log(
            `AI单位 ${unit.name} 的步数 ${rc.step} 超过速度 ${speed} + 攻击范围 ${range}，无法攻击`
          );
          isCantAttack = true;
        }

        if (rc) {
          result.x = rc.x;
          result.y = rc.y;

          let least = rc.step - speed;
          if (least > 0 && InitiativeSystem.useStandAction(unit)) {
            least = least - speed;
          }

          // 根据速度限制调整位置
          while (least > 0) {
            rc = path[`${result.x},${result.y}`] as unknown as {
              x: number;
              y: number;
              step: number;
            };

            if (!rc) break;

            least--;
            result.x = rc.x;
            result.y = rc.y;
            console.log(
              `AI单位 ${unit.name} 由于速度限制，向前调整一步，`,
              rc
            );
          }
        }
      }
    }

    if (rc) {
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
    while (!noUnit && rc) {
      const moveEndGrids = UnitSystem.getInstance().getGridsBySize(
        rc.x,
        rc.y,
        unit.creature?.size ?? "middle"
      );
      noUnit = true;

      for (let grid of moveEndGrids) {
        const findUnit = UnitSystem.getInstance().findUnitByGridxy(
          grid.x,
          grid.y
        );
        if (rc && findUnit && findUnit !== unit && findUnit.state !== "dead") {
          noUnit = false;
        }
      }

      if (rc && !noUnit) {
        console.log(
          `AI单位 ${unit.name} 在位置`,
          rc,
          `拥堵，继续寻找`
        );
        rc = path[`${rc.x},${rc.y}`] as unknown as {
          x: number;
          y: number;
          step: number;
        };
      }
    }

    return rc;
  }

  /**
   * 查找攻击目标
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

        if (noUnit) {
          result.x = unitSettingx;
          result.y = unitSettingy;
          result.target = findUnitInThisPoint;
          result.canAttack = true;
        }

        result.x = unitSettingx;
        result.y = unitSettingy;
        result.target = findUnitInThisPoint;

        console.log(unit, "AI找到攻击目标:", result, findUnitInThisPoint);
        break;
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
