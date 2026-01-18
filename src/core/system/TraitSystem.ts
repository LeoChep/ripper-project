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

  async createTrait(trait: Trait, unit: Unit,type?:string): Promise<Trait | null> {
    const traitName = trait.name;
    if (!traitName) {
      console.warn("Trait name is required.");
      return null;
    }
    const TraitClass = this.getTraitClass(trait.name,type) as Promise<typeof Trait>;
    if (!TraitClass) {
      console.warn(`Trait class not found for: ${traitName}`);
      return null;
    }
    console.log(`TraitSystem.createTrait: ${traitName}`, TraitClass);
    const traitInstance = (new(await TraitClass)(trait));
    console.log(`TraitSystem.createTrait: ${traitName}`, traitInstance);
    traitInstance.owner = unit; // 设置 Trait 的 owner 为 Unit
    return traitInstance
  }
  getTraitClass(traitName: string,type?: string) {
    // 根据 traitName 返回对应的 Trait 类
    if (type === "feat") {
        // 动态路径无法被 Vite 静态分析；添加 /* @vite-ignore */ 抑制警告
        return import(/* @vite-ignore */ `../feat/WeaponFocus`).then(
          (module) => module.WeaponFocus
        );
    
        
    }
    switch (traitName) {
      case "CombatChallenge":
        return import("../trait/fighter/CombatChallenge/CombatChallenge").then(
          (module) => module.CombatChallenge
        );
    }
  }
}
