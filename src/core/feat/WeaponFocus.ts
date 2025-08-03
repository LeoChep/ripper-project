import { Trait, TraitOptions } from "../trait/Trait";
import type { Unit } from "../units/Unit";

export class WeaponFocus extends Trait {
  name = "Weapon Focus";
  displayName = "武器专攻";
  description = "";
  icon = "weapon_focus";
  type = "trait";

  owner: Unit | null = null;

  constructor(traitOptions: TraitOptions) {
    super(traitOptions);
  }

}