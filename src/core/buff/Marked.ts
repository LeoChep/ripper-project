import type { Unit } from "../units/Unit";
import { BuffInterface } from "./BuffInterface";

export class Marked extends BuffInterface {
   name = "Marked";
   description = "被标记";
   icon = "mark_1";
   type = "effect";
   duration = 0; // 永久效果
   isPositive = false; // 正面效果
   owner:Unit|null=null;
   giver:Unit|null=null;
  constructor() {
    super()
    // 初始化效果
  }


}