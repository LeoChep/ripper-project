import { BuffInterface } from "@/core/buff/BuffInterface";
import type { Unit } from "@/core/units/Unit";


export class HearteningStrikeAimBuff extends BuffInterface {
   name = "HearteningStrikeAimBuff";
   description = "振奋打击瞄准效果";
   icon = "HearteningStrikeAimBuff";
   iconType:string='png';
   type = "effect";
   duration = 1; // 永久效果
   isPositive = false; // 正面效果
   owner:Unit|null=null;
   giver:Unit|null=null;
  constructor() {
    super()
    // 初始化效果
    
  }


}