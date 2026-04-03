import type { TiledMap } from "../../MapClass";
import { Unit } from "../../units/Unit";

/**
 * 动作类型 - 对应 D&D 4E 的动作系统
 */
export type ActionType = "standard" | "move" | "minor" | "reaction" | "free";

/**
 * 动作AI执行结果
 */
export interface ActionAIResult {
  /** 是否已执行 */
  executed: boolean;
  /** 执行的描述信息 */
  description?: string;
}

/**
 * 动作AI基类
 * 所有具体动作AI都应该继承此类
 */
export abstract class ActionAI {
  /**
   * 优先级，数值越大优先级越高
   * 默认为0，子类可以覆盖
   */
  public priority: number = 0;

  /**
   * 此动作消耗的动作类型
   * 子类必须指定
   */
  abstract actionType: ActionType;

  /**
   * 检查是否可以执行此动作
   * @param unit 要执行动作的单位
   * @param map 当前地图
   * @returns 是否可以执行
   */
  abstract canExecute(unit: Unit, map: TiledMap): boolean | Promise<boolean>;

  /**
   * 执行动作
   * @param unit 要执行动作的单位
   * @param map 当前地图
   * @returns 执行结果
   */
  abstract execute(unit: Unit, map: TiledMap): Promise<ActionAIResult>;

  /**
   * 获取动作名称
   */
  abstract getName(): string;
}
