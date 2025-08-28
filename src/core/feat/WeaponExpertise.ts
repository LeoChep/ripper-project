import { Modifier } from "../modifier/Modifier";
import { Trait, TraitOptions } from "../trait/Trait";
import type { Unit } from "../units/Unit";

export class WeaponExpertise extends Trait {
  name = "WeaponExpertise";
  displayName = "武器专精";
  description = "你在使用此武器组的武器进行的任何武器威能的攻击骰上获得+1专长加值。此加值11级时为+2，21级时为+3。";
  icon = "weapon_focus";
  type = "trait";

  owner: Unit | null = null;

  constructor(traitOptions: TraitOptions) {
    super(traitOptions);
    const modifier = new Modifier({
      to: "weaponAttackBonus",
      value: 1,
      type: "feat",
      modifierType: "+",
    });
    this.modifiers.push(modifier);
  }
}
