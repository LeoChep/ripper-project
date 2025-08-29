import { Modifier } from "../modifier/Modifier";
import type { Unit } from "../units/Unit";
import { BuffInterface } from "./BuffInterface";

export class Proned extends BuffInterface {
   name = "Proned";
   description = "倒地";
   icon = "prone";
   type = "effect";
   duration = 0; // 永久效果
   isPositive = false; // 正面效果
   owner:Unit|null=null;
   giver:Unit|null=null;
  constructor() {
    super();
    // 初始化效果
    const modifier=new Modifier({
      to: "speed",
      value: 0, // 减少速度
      type: "proned",
      modifierType: "=",
      priority:-1
    });
    this.modifiers.push(modifier);
  }


}