import type { Trait, TraitOptions } from "./Trait";

export class TraitFactory {
  static createTrait<T extends Trait>(
    traitClass: new (options: TraitOptions) => T,
    options: TraitOptions
  ): T {
    return new traitClass(options);
  }
  static createPOJOTrait<T extends Trait>(
    traitClass: new (options: TraitOptions) => T,
    options: TraitOptions
  ): T {
    // 这里可以添加一些POJO特有的逻辑
    return new traitClass(options);
  }
}
