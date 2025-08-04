import { Modifier } from "../modifier/Modifier";
import { Trait, TraitOptions } from "../trait/Trait";
import type { Unit } from "../units/Unit";

export class SuperiorWill extends Trait {
  name = "Superior Will";
  displayName = "卓越意志";
  description = "增加意志值";
  icon = "superior_will";
  type = "trait";

  owner: Unit | null = null;
  hookTime = "Battle"; // 触发时机
  hook(): void {
    //增加豁免事件
    //待实装
  }
  constructor(traitOptions: TraitOptions) {
    super(traitOptions);
    const modifier = new Modifier({
      to: "will",
      value: 2, // 增加意志值
      type: "feat",
      modifierType: "+",
    }); // 优先级设置为较高
    this.modifiers.push(modifier);
  }
}
