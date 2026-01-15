import { BuffInterface } from "@/core/buff/BuffInterface";
import { Modifier } from "@/core/modifier/Modifier";
import type { Unit } from "@/core/units/Unit";


export class DivineGlowAttackBonusUp extends BuffInterface {
   name = "DivineGlowAttackBonusUp";
   description = "圣耀攻击上升效果";
   icon = "DivineGlowAttackBonusUp";
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
          to: "attack-bonus",
          value: 2, // 增加攻击加值
          type: "power",
          modifierType: "+",
        });
        this.modifiers.push(modifier);
  }


}