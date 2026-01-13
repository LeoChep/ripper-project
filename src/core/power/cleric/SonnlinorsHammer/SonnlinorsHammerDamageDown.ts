import { BuffInterface } from "@/core/buff/BuffInterface";
import type { Unit } from "@/core/units/Unit";


export class SonnlinorsHammerDamageDown extends BuffInterface {
   name = "SonnlinorsHammerDamageDown";
   description = "索离诺尔之锤伤害降低";
   icon = "";
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