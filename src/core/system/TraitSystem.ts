import type { Trait } from "../trait/Trait";
import type { Unit } from "../units/Unit";

export class TriatSystem {
  private traits: Map<string, Trait[]> = new Map();
  static instance: TriatSystem | null = null;
  public static getInstance() {
    if (!this.instance) {   
        this.instance = new TriatSystem();
        }   
    return this.instance;
    }
  constructor() {}

  async createTrait(traitName: string, unit: Unit): Promise<Trait | null> {
    if (!traitName) {
      console.warn("Trait name is required.");
      return null;
    }
    const TraitClass = this.getTraitClass(traitName) as Promise<typeof Trait>;
    if (!TraitClass) {
      console.warn(`Trait class not found for: ${traitName}`);
      return null;
    }
    const traitInstance = (new(await TraitClass)());
    traitInstance.owner = unit; // 设置 Trait 的 owner 为 Unit
    return traitInstance
  }
  getTraitClass(traitName: string) {
    // 根据 traitName 返回对应的 Trait 类
    switch (traitName) {
      case "CombatChallenge":
        return import("../trait/fighter/CombatChallenge").then(
          (module) => module.CombatChallenge
        );
    }
  }
}
