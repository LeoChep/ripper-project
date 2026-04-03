import * as InitiativeSystem from "../../system/InitiativeSystem";
import { standMovement } from "../../action/UnitStand";
import type { TiledMap } from "../../MapClass";
import { Unit } from "../../units/Unit";
import { ActionAI, type ActionAIResult } from "./ActionAI";
import type { ActionType } from "./ActionAI";

/**
 * 倒地起身AI
 * 当单位处于倒地状态时，优先执行起身动作
 * 消耗 move 动作
 */
export class ProneRecoveryAI extends ActionAI {
  public priority: number = 100; // 最高优先级
  public actionType: ActionType = "move";

  getName(): string {
    return "ProneRecovery";
  }

  canExecute(unit: Unit, _map: TiledMap): boolean {
    // 检查是否有Proned buff
    const hasPronedBuff = unit.creature?.buffs.some(
      (buff) => buff.name === "Proned"
    );

    if (!hasPronedBuff) {
      return false;
    }

    // 检查是否可以使用移动动作（起身需要移动动作）
    return InitiativeSystem.checkActionUseful(unit, "move");
  }

  async execute(unit: Unit, _map: TiledMap): Promise<ActionAIResult> {
    console.log(`AI: ${unit.name} 执行倒地起身动作`);

    await standMovement(unit);

    return {
      executed: true,
      description: "倒地起身",
    };
  }
}
