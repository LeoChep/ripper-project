import type { Unit } from "../units/Unit";

export class BeTargeted {
   name = "BeTargeted";
   description = "被标记";
   icon = "target";
   type = "effect";
   duration = 0; // 永久效果
   isPositive = false; // 正面效果
   owner:Unit|null=null;
   giver:Unit|null=null;
  constructor() {
    // 初始化效果
  }


}