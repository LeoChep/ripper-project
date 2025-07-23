
import type { Unit } from "@/core/units/Unit";

import * as PIXI from "pixi.js";

export abstract class PowerControllerInterface {
  static isUse: boolean;
  static instense: PowerControllerInterface | null;

  selectedCharacter: Unit | null = null;

  graphics: PIXI.Graphics | null = null;

  abstract attackSelect: () => Promise<any>;
  removeFunction = (args?: any) => {};
  // 添加你的方法和属性
}
