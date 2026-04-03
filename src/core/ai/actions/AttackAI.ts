import * as InitiativeSystem from "../../system/InitiativeSystem";
import * as UnitAttack from "../../action/UnitAttack";
import { golbalSetting } from "../../golbalSetting";
import { UnitSystem } from "../../system/UnitSystem";
import type { TiledMap } from "../../MapClass";
import { Unit } from "../../units/Unit";
import { ActionAI, type ActionAIResult } from "./ActionAI";
import type { ActionType } from "./ActionAI";
import { tileSize } from "../../envSetting";

/**
 * 攻击AI
 * 当单位在攻击范围内时执行攻击动作
 * 消耗 standard 动作
 */
export class AttackAI extends ActionAI {
  public priority: number = 60;
  public actionType: ActionType = "standard";

  /** 上一次找到的目标 */
  private lastTarget: Unit | null = null;

  getName(): string {
    return "Attack";
  }

  canExecute(unit: Unit, _map: TiledMap): boolean {
    // 检查是否有攻击能力
    if (!unit.creature?.attacks || unit.creature.attacks.length === 0) {
      return false;
    }

    // 检查是否有可攻击的目标
    const target = this.findAttackTarget(unit);
    if (!target) {
      return false;
    }

    this.lastTarget = target;

    // 检查是否可以使用标准动作（攻击需要标准动作）
    return InitiativeSystem.checkActionUseful(unit, "standard");
  }

  async execute(unit: Unit, _map: TiledMap): Promise<ActionAIResult> {
    const attack = unit.creature?.attacks[0];
    const target = this.lastTarget;

    if (!attack || !target) {
      return {
        executed: false,
          description: "没有可用的攻击或目标",
      };
    }

    const enemyX = Math.floor(target.x / tileSize);
    const enemyY = Math.floor(target.y / tileSize);

    console.log(
      `AI单位 ${unit.name} 准备攻击:`,
      attack,
      "目标坐标:",
      enemyX,
      enemyY
    );

    await UnitAttack.attackMovementToXY(
      enemyX,
      enemyY,
      unit,
      attack,
      golbalSetting.map
    );
    InitiativeSystem.useAction(unit, "standard");
    return {
      executed: true,
      description: `攻击 ${target.name}`,
    };
  }

  /**
   * 查找当前可攻击的目标
   */
  private findAttackTarget(unit: Unit): Unit | null {
    const unitX = Math.floor(unit.x / tileSize);
    const unitY = Math.floor(unit.y / tileSize);
    const range = unit.creature?.attacks[0].range ?? 1;

    // 检查当前已缓存的目标是否仍然有效
    if (this.lastTarget && this.lastTarget.state !== "dead") {
      const targetX = Math.floor(this.lastTarget.x / tileSize);
      const targetY = Math.floor(this.lastTarget.y / tileSize);
      const distance = Math.max(
        Math.abs(targetX - unitX),
        Math.abs(targetY - unitY)
      );

      if (distance <= range) {
        return this.lastTarget;
      }
    }

    // 寻找新的攻击目标
    return this.findNearestEnemy(unit);
  }

  /**
   * 寻找最近的敌人
   * 参考 AttackPositionAI 的 findAttackTargetByUnitMap 实现
   */
  private findNearestEnemy(unit: Unit): Unit | null {
    const unitX = Math.floor(unit.x / tileSize);
    const unitY = Math.floor(unit.y / tileSize);
    const range = unit.creature?.attacks[0].range ?? 1;

    const units = UnitSystem.getInstance().getAllUnits();
    const enemyUnits: Unit[] = [];

    // 筛选敌对单位
    units.forEach((checkUnit) => {
      // 友方NPC不攻击玩家
      const isFriendlyNpc = checkUnit.party === "player" && unit.friendly;

      if (
        checkUnit.party !== unit.party &&
        checkUnit.state !== "dead" &&
        !isFriendlyNpc
      ) {
        enemyUnits.push(checkUnit);
      }
    });

    // 按距离排序，找最近且在攻击范围内的
    let nearestEnemy: Unit | null = null;
    let minDistance = Infinity;

    for (const enemy of enemyUnits) {
      const grids = UnitSystem.getInstance().getUnitGrids(enemy);

      for (const grid of grids) {
        const distance = Math.max(
          Math.abs(grid.x - unitX),
          Math.abs(grid.y - unitY)
        );

        if (distance <= range && distance < minDistance) {
          minDistance = distance;
          nearestEnemy = enemy;
        }
      }
    }

    return nearestEnemy;
  }
}
