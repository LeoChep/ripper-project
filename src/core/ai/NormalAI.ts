import type { TiledMap } from "../MapClass";
import { Unit } from "../units/Unit";
import type { AIInterface } from "../type/AIInterface";
import * as InitiativeController from "../system/InitiativeSystem";
import { WeaponSystem } from "../system/WeaponSystem";
import { Weapon } from "../units/Weapon";
import { ActionAI } from "./actions/ActionAI";
import { ProneRecoveryAI } from "./actions/ProneRecoveryAI";
import { AttackPositionAI } from "./actions/AttackPositionAI";
import { AttackAI } from "./actions/AttackAI";
import { FarAwayAttackPositionAI } from "./actions/FarAwayAttackPositionAI";

/**
 * 行为树节点类型
 */
interface BehaviorNode {
  actionAI: ActionAI;
  enabled: boolean;
  /** 优先级（可在注册时覆盖） */
  priority: number;
}

/**
 * NormalAI - 使用行为树模式的AI控制器
 *
 * 执行逻辑：
 * - 每轮遍历所有动作AI（按优先级排序）
 * - 只有当所有动作AI都无法执行时，才结束回合
 */
export class NormalAI implements AIInterface {
  public owner: Unit | undefined;
  private actionNodes: BehaviorNode[] = [];
  private lastExecutedAction: string | null = null;

  constructor() {
    this.setupDefaultActions();
  }

  private setupDefaultActions(): void {
    // 在注册时指定优先级，优先级越高越先执行
    this.registerAction(new ProneRecoveryAI(), { priority: 100 });      // 倒地起身
    this.registerAction(new AttackAI(), { priority: 60 });             // 攻击
    this.registerAction(new AttackPositionAI(), { priority: 50 });     // 移动到攻击位置
    // this.registerAction(new FarAwayAttackPositionAI(), { priority: 45 }); // 远程攻击位置（风筝）
  }

  /**
   * 注册一个动作AI
   * @param actionAI 动作AI实例
   * @param options 配置选项
   */
  registerAction(
    actionAI: ActionAI,
    options: { enabled?: boolean; priority?: number } = {}
  ): void {
    const { enabled = true, priority } = options;
    this.actionNodes.push({
      actionAI,
      enabled,
      priority: priority ?? actionAI.priority, // 使用传入的优先级或默认优先级
    });
    this.actionNodes.sort((a, b) => b.priority - a.priority);
  }

  setActionEnabled(name: string, enabled: boolean): void {
    const node = this.actionNodes.find((n) => n.actionAI.getName() === name);
    if (node) node.enabled = enabled;
  }

  async autoAction(unit: Unit, map: TiledMap): Promise<void> {
    console.log("AI行动开始:", unit.name);
    this.ensureWeapon(unit);

    let round = 0;
    const maxRounds = 10;

    while (round < maxRounds) {
      round++;
      console.log(`=== AI 第 ${round} 轮 ===`);

      const executed = await this.executeOneRound(unit, map);

      if (!executed) {
        console.log("AI: 所有动作都无法执行，结束回合");
        break;
      }
    }

    InitiativeController.endTurn(unit);
  }

  /**
   * 执行一轮动作
   * 按优先级遍历所有动作AI，执行第一个可执行的动作
   */
  private async executeOneRound(unit: Unit, map: TiledMap): Promise<boolean> {
    for (const node of this.actionNodes) {
      if (!node.enabled) continue;

      const action = node.actionAI;

      try {
        if (await action.canExecute(unit, map)) {
          const result = await action.execute(unit, map);
          if (result.executed) {
            this.lastExecutedAction = action.getName();
            console.log(`AI: [${action.actionType}] ${action.getName()}: ${result.description}`);
            return true;
          }
        }
      } catch (error) {
        console.error(`AI: 执行 ${action.getName()} 出错:`, error);
      }
    }

    return false;
  }

  private ensureWeapon(unit: Unit): void {
    if (unit.creature?.attacks.length === 0) {
      if (!unit.creature?.weapons) unit.creature.weapons = [];
      if (!unit.creature?.weapons[0]) {
        unit.creature.weapons[0] = new Weapon({
          name: "拳头",
          damage: "1d4",
          range: 1,
          type: "melee",
        });
      }
      unit.creature.attacks.push(
        WeaponSystem.getInstance().createWeaponAttack(unit, unit.creature.weapons[0], "STR")
      );
    }
  }

  async opportunityAttack(targetUnit: Unit): Promise<void> {
    if (!this.owner || !this.owner.creature?.attacks[0]) return;
    if (targetUnit?.party == "player" && this.owner.friendly) return;

    const { attackMovementToUnit } = await import("../action/UnitAttack");
    const { golbalSetting } = await import("../golbalSetting");

    await attackMovementToUnit(
      targetUnit,
      this.owner,
      this.owner.creature.attacks[0],
      golbalSetting.map
    );
  }

  getLastExecutedAction(): string | null {
    return this.lastExecutedAction;
  }

  getActions(): BehaviorNode[] {
    return this.actionNodes;
  }
}
