import { Modifier } from "../modifier/Modifier";
import { Trait, type TraitOptions } from "../trait/Trait";
import type { Unit } from "../units/Unit";

export class LightningReflexes extends Trait {
  name = "LightningReflexes";
  displayName = "闪电反射";
  description = "你在反射上获得+2专长加值。此加值11级时为+3，21级时为+4。";
  icon = "lightning_reflexes";
  type = "trait";

  owner: Unit | null = null;

  constructor(traitOptions: TraitOptions) {
    super(traitOptions);
    const modifier = new Modifier({
      to: "reflex",
      value: 2, // 增加反应值
      type: "feat",
      modifierType: "+",
    }); // 优先级设置为较高})
    this.modifiers.push(modifier);
  }
}
