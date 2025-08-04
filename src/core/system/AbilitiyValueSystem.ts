import type { Unit } from "../units/Unit";
import { ModifierSystem } from "./ModifierSystem";

export class AbilityValueSystem {
  static instance: AbilityValueSystem | null = null;

  static getInstance() {
    if (!AbilityValueSystem.instance) {
      AbilityValueSystem.instance = new AbilityValueSystem();
    }
    return AbilityValueSystem.instance;
  }

  // Method to calculate the ability value based on the unit's abilities
  getAbilityValue(unit: Unit, abilityName: string): number {
    if (!unit.creature || !unit.creature.abilities) {
      console.warn(
        `Unit ${unit.name} does not have creature or abilities defined.`
      );
      return 0;
    }

    const ability = ModifierSystem.getInstance().getValueStack(
      unit,
      "abilities." + abilityName+".value"
    ).finalValue;
    console.log(
        `AbilityValueSystem.getAbilityValue: ${unit.name} - ${abilityName} = ${ability}`,unit
    )
    return ability;
  }
  getAbilityModifier(unit: Unit, abilityName: string): number { 
     const value=   this.getAbilityValue(unit, abilityName);
     const modifier = Math.floor((value - 10) / 2);
    console.log('getAbilityModifier', abilityName, 'value', value, 'modifier', modifier);
     return modifier;
  }
  getLevelModifier(unit: Unit): number {
    if (!unit.creature || !unit.creature.level) {
      console.warn(`Unit ${unit.name} does not have a level defined.`);
      return 0;
    }
    // Assuming level is a property of the creature
    return Math.floor((unit.creature.level ) / 2);
  }

}
