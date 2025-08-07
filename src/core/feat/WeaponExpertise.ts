import { Modifier } from "../modifier/Modifier";
import { Trait, TraitOptions } from "../trait/Trait";
import type { Unit } from "../units/Unit";

export class WeaponExpertise extends Trait {
  name = "WeaponExpertise";
  displayName = "武器专精";
  description = "";
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
