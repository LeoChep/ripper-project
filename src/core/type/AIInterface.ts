import type { TiledMap } from "../MapClass";
import type { Unit } from "../Unit";

/**
 * AI接口定义
 * 所有AI类都应该实现这个接口
 */
export interface AIInterface {
  /**
   * AI自动行动方法
   * @param unit 当前行动的单位
   * @param map 地图对象
   */
  autoAction(unit: Unit, map: TiledMap): void;
}