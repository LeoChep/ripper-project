import { Modifier } from "../modifier/Modifier";
import type { Unit } from "../units/Unit";
import { BuffInterface } from "./BuffInterface";

export class Slowed extends BuffInterface {
  name = "Slowed";
  description = "迟缓";
  icon = "slowed";
  type = "Slowed";
  duration = 0; // 永久效果
  isPositive = false; // 正面效果
  owner: Unit | null = null;
  giver: Unit | null = null;
  modifiers: Modifier[] = [];
  constructor() {
    super();
    // 初始化效果
    const modifier = new Modifier({
      to: "speed",
      value: 2, // 减少速度
      type: "slowed",
      modifierType: "=",
    });
    this.modifiers.push(modifier);
  }
}
