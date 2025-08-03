import { Modifier } from "../modifier/Modifier";
import type { Unit } from "../units/Unit";
import { BuffInterface } from "./BuffInterface";

export class Immobilized extends BuffInterface {
  name = "Immobilized";
  description = "定身";
  icon = "immobilized";
  type = "effect";
  duration = 0; // 永久效果
  isPositive = false; // 正面效果
  owner: Unit | null = null;
  giver: Unit | null = null;
  modifiers: Modifier[] = [];
  constructor() {
    super();
    // 初始化效果
    const modifier=new Modifier({
      to: "speed",
      value: 0, // 减少速度
      type: "immobilized",
      modifierType: "=",
    });
    this.modifiers.push(modifier);
  }
}
