import { MessageTipSystem } from "../system/MessageTipSystem";
import * as InitiativeSystem from "../system/InitiativeSystem";
import type { Unit } from "../units/Unit";
import { CharCombatMoveController } from "../controller/CharacterCombatMoveController";
import { CharCombatAttackController } from "../controller/CharacterCombatAttackController";
import { CharCombatStepController } from "../controller/CharacterCombatStepController";

/**
 * 控制器取消原因枚举
 */
export enum CancelReason {
  USER_CANCEL = "user_cancel",
  CONTROLLER_SWITCH = "controller_switch",
  ACTION_POINTS_EXHAUSTED = "action_points_exhausted",
}

/**
 * 控制器取消上下文接口
 */
export interface CancelContext {
  fromController: string;
  toController?: string;
  reason: CancelReason;
  unit: Unit;
}

/**
 * 取消处理结果接口
 */
export interface CancelDecision {
  shouldEndTurn: boolean;
  shouldSwitchToMove: boolean;
}

/**
 * 控制器注册信息接口
 */
interface ControllerRegistration {
  name: string;
  removeFunction: (args?: any) => void;
  isActive: boolean;
}

/**
 * 控制器取消处理器
 *
 * 统一管理所有控制器的取消逻辑，包括：
 * - 检查剩余动作点数
 * - 处理 MoveController 的特殊逻辑
 * - 决定是否结束回合或切换到其他控制器
 * - 统一管理跨 controller 的取消通知
 * - 启动新控制器前取消所有其他控制器
 */
export class ControllerCancelHandler {
  private static instance: ControllerCancelHandler | null = null;
  private registeredControllers: Map<string, ControllerRegistration> = new Map();
  private isNotifying: boolean = false; // 防止递归通知

  /**
   * 获取单例实例
   */
  public static getInstance(): ControllerCancelHandler {
    if (!ControllerCancelHandler.instance) {
      ControllerCancelHandler.instance = new ControllerCancelHandler();
    }
    return ControllerCancelHandler.instance;
  }

  /**
   * 注册控制器
   *
   * @param name 控制器名称
   * @param removeFunction 移除函数
   */
  public registerController(name: string, removeFunction: (args?: any) => void): void {
    this.registeredControllers.set(name, {
      name,
      removeFunction,
      isActive: true
    });
  }

  /**
   * 注销控制器
   *
   * @param name 控制器名称
   */
  public unregisterController(name: string): void {
    this.registeredControllers.delete(name);
  }

  /**
   * 通知所有其他活跃的控制器取消（除了指定控制器）
   *
   * @param excludeName 要排除的控制器名称
   * @param cancelInfo 取消信息
   */
  public notifyOtherControllersCancel(excludeName: string, cancelInfo: any): void {
    // 防止递归通知
    if (this.isNotifying) {
      return;
    }

    this.isNotifying = true;
    try {
      this.registeredControllers.forEach((controller, name) => {
        if (name !== excludeName && controller.isActive) {
          try {
            controller.removeFunction(cancelInfo);
          } catch (error) {
            console.error(`Error notifying controller ${name}:`, error);
          }
        }
      });
    } finally {
      this.isNotifying = false;
    }
  }

  /**
   * 取消所有控制器的显示（用于启动新控制器前清理）
   * 这个方法不会询问用户，直接隐藏所有选择器
   */
  public cancelAllControllers(): void {
    // 防止递归调用
    if (this.isNotifying) {
      return;
    }

    const cancelInfo = {
      from: "system",
      cancel: true,
      reason: "controller_switch"
    };

    this.isNotifying = true;
    try {
      this.registeredControllers.forEach((controller, name) => {
        if (controller.isActive) {
          try {
            controller.removeFunction(cancelInfo);
          } catch (error) {
            console.error(`Error canceling controller ${name}:`, error);
          }
        }
      });
    } finally {
      this.isNotifying = false;
    }
  }

  /**
   * 处理控制器取消，带有动作点验证
   *
   * @param context 取消上下文信息
   * @returns Promise resolving to { shouldEndTurn: boolean, shouldSwitchToMove: boolean }
   */
  public async handleCancel(context: CancelContext): Promise<CancelDecision> {
    const { fromController, toController, reason, unit } = context;

    // 通知所有其他控制器取消
    const cancelInfo = {
      from: fromController,
      cancel: true,
      reason: reason
    };
    this.notifyOtherControllersCancel(fromController, cancelInfo);

    // 如果来自 MoveController，总是询问是否结束回合
    if (fromController === "moveController") {
      return await this.handleMoveControllerCancel(unit);
    }

    // 对于其他控制器，先检查动作点
    const hasActionPoints = await this.checkRemainingActionPoints(unit);

    if (!hasActionPoints) {
      return await this.handleNoActionPoints(unit);
    }

    // 如果要切换到 MoveController，允许切换
    if (toController === "moveController" ) {
      return { shouldEndTurn: false, shouldSwitchToMove: true };
    }

    // 对于其他转换，返回空闲状态
    return { shouldEndTurn: false, shouldSwitchToMove: false };
  }

  /**
   * 处理 MoveController 的取消逻辑
   * 总是询问用户是否结束回合
   *
   * @param unit 当前单位
   * @returns 取消决策
   */
  private async handleMoveControllerCancel(unit: Unit): Promise<CancelDecision> {
    const shouldEnd = await MessageTipSystem.getInstance().confirm("是否结束回合？");

    if (shouldEnd) {
      return { shouldEndTurn: true, shouldSwitchToMove: false };
    }

    // 用户选择不结束回合，返回空闲状态

    return { shouldEndTurn: false, shouldSwitchToMove: false };
  }

  /**
   * 检查单位是否还有剩余的动作点数
   *
   * @param unit 要检查的单位
   * @returns 是否有剩余动作点
   */
  private async checkRemainingActionPoints(unit: Unit): Promise<boolean> {
    const hasMoveAction = InitiativeSystem.checkActionUseful(unit, "move");
    const hasStandardAction = InitiativeSystem.checkActionUseful(unit, "standard");
    const hasMinorAction = InitiativeSystem.checkActionUseful(unit, "minor");

    return hasMoveAction || hasStandardAction || hasMinorAction;
  }

  /**
   * 处理没有剩余动作点的情况
   *
   * @param unit 当前单位
   * @returns 取消决策
   */
  private async handleNoActionPoints(unit: Unit): Promise<CancelDecision> {
    const shouldEnd = await MessageTipSystem.getInstance().confirm(
      "没有剩余动作点数了，是否结束回合？"
    );

    if (shouldEnd) {
      return { shouldEndTurn: true, shouldSwitchToMove: false };
    }

    // 用户选择在没有动作点的情况下继续
    return { shouldEndTurn: false, shouldSwitchToMove: false };
  }

  /**
   * 初始化时注册所有控制器
   * 这个方法应该在游戏启动时调用一次
   */
  public initializeControllers(): void {
    // 注册 MoveController
    if (CharCombatMoveController.instense) {
      this.registerController(
        "moveController",
        (args) => CharCombatMoveController.instense?.removeFunction(args)
      );
    }

    // 注册 AttackController
    if (CharCombatAttackController.instense) {
      this.registerController(
        "attackController",
        (args) => CharCombatAttackController.instense?.removeFunction(args)
      );
    }

    // 注册 StepController
    if (CharCombatStepController.instense) {
      this.registerController(
        "stepController",
        (args) => CharCombatStepController.instense?.removeFunction(args)
      );
    }

    console.log("ControllerCancelHandler: Controllers initialized");
  }
}
