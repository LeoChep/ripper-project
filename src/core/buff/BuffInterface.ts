import type { Modifier } from "../modifier/Modifier";
import type { Unit } from "../units/Unit";

export abstract class BuffInterface {
  uid: string = ""; // Buff的唯一标识符
name = "";
  description = "";
  icon = "";
  type = "";
  duration = 0; // 永久效果
  isPositive = false; // 正面效果
  owner: Unit | null = null;
  giver: Unit | null = null;
  source: string = ""; // Buff来源
  modifiers: Modifier[] = []; // Buff的修饰符列表
  constructor() {
  
  }
}
