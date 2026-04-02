import { ControllerCancelHandler, CancelReason } from "../utils/ControllerCancelHandler";
import * as InitiativeSystem from "../system/InitiativeSystem";

/**
 * 控制器结果处理选项
 */
interface ControllerResultHandlerOptions {
  onCompleted?: () => void;
  onCancelled?: () => void;
  onSwitchToMove?: () => void;
  onEndTurn?: () => void;
  shouldResetDivideWalk?: boolean;
  shouldSetUnDelay?: boolean;
  inUsePower?: { value: boolean; set: (v: boolean) => void };
}

/**
 * 控制器辅助工具类
 * 为所有控制器提供统一的 removeFunction 创建和注册功能
 * 以及统一的结果处理逻辑
 */
export class ControllerHelper {
  /**
   * 创建标准的 removeFunction
   *
   * @param controllerName 控制器名称
   * @param graphics 图形对象（用于清理）
   * @param extraCleanup 额外的清理函数（可选）
   * @returns removeFunction
   */
  static createRemoveFunction(
    controllerName: string,
    graphics: { parent?: any; destroy?: () => void } | null,
    extraCleanup?: () => void
  ): (args?: any) => void {
    return (args?: any) => {
      // 清理图形
      if (graphics) {
        if (graphics.parent) {
          graphics.parent.removeChild(graphics);
        }
        if (typeof graphics.destroy === 'function') {
          graphics.destroy();
        }
      }

      // 执行额外的清理
      if (extraCleanup) {
        extraCleanup();
      }

      // 如果不是系统触发的取消，通知其他控制器
      if (args?.from !== "system") {
        ControllerCancelHandler.getInstance().notifyOtherControllersCancel(
          controllerName,
          args
        );
      }
    };
  }

  /**
   * 为选择器创建 removeFunction
   * 选择器不需要通知其他控制器（因为选择器由控制器管理）
   *
   * @param graphics 图形对象
   * @param resolveCallback Promise resolve 函数
   * @returns removeFunction
   */
  static createSelectorRemoveFunction(
    graphics: { parent?: any; destroy?: () => void } | null,
    resolveCallback: (args?: any) => void
  ): (args?: any) => void {
    return (args?: any) => {
      // 清理图形
      if (graphics) {
        if (graphics.parent) {
          graphics.parent.removeChild(graphics);
        }
        if (typeof graphics.destroy === 'function') {
          graphics.destroy();
        }
      }

      // 解析 Promise
      resolveCallback(args);
    };
  }

  /**
   * 注册控制器到 ControllerCancelHandler
   * 这个方法应该在控制器实例创建时调用
   *
   * @param controllerName 控制器名称
   * @param instance 控制器实例
   */
  static registerController(
    controllerName: string,
    instance: { removeFunction: (args?: any) => void }
  ): void {
    ControllerCancelHandler.getInstance().registerController(
      controllerName,
      (args: any) => instance.removeFunction(args)
    );
  }

  /**
   * 处理控制器结果的标准逻辑
   *
   * @param result 控制器返回的结果
   * @param options 处理选项
   * @returns boolean - 是否应该继续执行后续逻辑
   */
  static handleControllerResult(
    result: any,
    options: ControllerResultHandlerOptions = {}
  ): boolean {
    const {
      onCompleted,
      onCancelled,
      onSwitchToMove,
      onEndTurn,
      shouldResetDivideWalk = true,
      shouldSetUnDelay = true,
      inUsePower
    } = options;

    // 处理结束回合的情况
    if (result?.shouldEndTurn) {
      if (onEndTurn) {
        onEndTurn();
      }
      return false; // 停止后续逻辑
    }

    // 处理切换到移动控制器的情况
    if (result?.switchToMove) {
      if (onSwitchToMove) {
        onSwitchToMove();
      }
      return false; // 停止后续逻辑
    }

    // 处理取消的情况
    if (result?.cancel === true) {
      if (onCancelled) {
        onCancelled();
      }
      return false; // 停止后续逻辑
    }

    // 处理正常完成的情况
    if (result?.cancel === false) {
      // 战斗中的标准处理
      if (InitiativeSystem.isInBattle()) {
        if (shouldResetDivideWalk) {
          // resetDivideWalk
        }
        if (shouldSetUnDelay) {
          // setUnDelay
        }
      }

      if (onCompleted) {
        onCompleted();
      }
    }

    return true; // 继续执行后续逻辑
  }

  /**
   * 处理标准控制器结果（带自动切换到移动控制器）
   * 适用于 AttackController, StepController, PowerController 等
   *
   * @param result 控制器返回的结果
   * @param combatController CharacterCombatController 实例
   * @param inUsePower 可选的 inUsePower 状态
   */
  static handleStandardControllerResult(
    result: any,
    combatController: any,
    inUsePower?: { value: boolean; set: (v: boolean) => void }
  ): void {
    result.switchToMove=true;
    ControllerHelper.handleControllerResult(result, {
      onEndTurn: () => {
        combatController.endTurn();
        if (inUsePower) {
          inUsePower.set(false);
        }
      },
      onSwitchToMove: () => {
        setTimeout(() => {
          combatController.useMoveController();
        }, 90);
        if (inUsePower) {
          inUsePower.set(false);
        }
      },
      shouldResetDivideWalk: true,
      shouldSetUnDelay: true,
    });

    // 继续执行：如果没有取消，90ms 后切换到移动控制器
    if (result?.cancel !== true) {
      setTimeout(() => {
        if (!result.from && InitiativeSystem.isInBattle()) {
          combatController.useMoveController();
        }
      }, 90);
    }

    // 重置 inUsePower
    if (inUsePower) {
      inUsePower.set(false);
    }
  }

  /**
   * 处理移动控制器结果（支持分次移动）
   *
   * @param result 控制器返回的结果
   * @param unit 当前单位
   * @param combatController CharacterCombatController 实例
   */
  static async handleMoveControllerResult(
    result: any,
    unit: any,
    combatController: any
  ): Promise<void> {
    // 处理结束回合的情况
    if (result?.shouldEndTurn) {
      combatController.endTurn();
      return;
    }

    // 处理取消的情况
    if (result?.cancel === true) {
      // 使用 ControllerCancelHandler 处理 MoveController 的取消
      const handler = ControllerCancelHandler.getInstance();
      const context = {
        fromController: "moveController",
        reason: CancelReason.USER_CANCEL,
        unit: unit
      };

      const decision = await handler.handleCancel(context);

      if (decision.shouldEndTurn) {
        combatController.endTurn();
      } else {
        // 不结束回合，继续使用 MoveController
        setTimeout(() => {
          if (InitiativeSystem.isInBattle()) {
            combatController.useMoveController();
          }
        }, 50);
      }
      return;
    }

    // 处理正常完成的情况
    if (result?.cancel === false) {
      combatController.setUnDelay();
      const walkMachine = unit.stateMachinePack.getMachine("walk");
      if (walkMachine?.onDivideWalk === true) {
        setTimeout(() => {
          combatController.useMoveController();
        }, 50);
      }
    } else if (!result) {
      setTimeout(() => {
        combatController.useMoveController();
      }, 50);
    }
  }

  /**
   * 处理起身/延迟控制器的简单结果
   *
   * @param result 控制器返回的结果
   * @param combatController CharacterCombatController 实例
   */
  static handleSimpleControllerResult(
    result: any,
    combatController: any
  ): void {
    setTimeout(() => {
      if (!result.from && InitiativeSystem.isInBattle()) {
        combatController.useMoveController();
      }
    }, 90);
  }
}
