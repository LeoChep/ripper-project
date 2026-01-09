import { BuffInterface } from "@/core/buff/BuffInterface";
import { Modifier } from "@/core/modifier/Modifier";
import type { Unit } from "@/core/units/Unit";


export class WeaponOfDivineProtectionDefUp extends BuffInterface {
   name = "WeaponOfDivineProtectionDefUp";
   description = "武器神圣保护防御提升";
   icon = "def_up";
   iconType:string='png';
   type = "effect";
   duration = 1; // 永久效果
   isPositive = true; // 正面效果
   owner:Unit|null=null;
   giver:Unit|null=null;
  constructor() {
    super()
    // 初始化效果
     const modifier = new Modifier({
          to: "ac",
          value: 2, // 减少速度
          type: "power",
          modifierType: "+",
        });
        this.modifiers.push(modifier);
  }


}