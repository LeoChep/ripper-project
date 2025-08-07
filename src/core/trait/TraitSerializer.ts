import type { Trait, TraitOptions } from "./Trait";

export class TraitSerializer {
  /**
   * 将 Trait 实例序列化为 POJO (Plain Old JavaScript Object)
   */
  static serializeTrait(trait: Trait): TraitOptions {
    return {
      name: trait.name,
      displayName: trait.displayName,
      description: trait.description,
      icon: trait.icon,
      type: trait.type,
      // 添加其他需要序列化的属性
    };
  }

  /**
   * 将 POJO 反序列化为 Trait 实例
   */
  static deserializeTrait<T extends Trait>(
    traitClass: new (options: TraitOptions) => T,
    pojo: TraitOptions
  ): T {
    return new traitClass(pojo);
  }

  /**
   * 批量序列化 Trait 数组
   */
  static serializeTraits(traits: Trait[]): TraitOptions[] {
    return traits.map(trait => this.serializeTrait(trait));
  }

  /**
   * 批量反序列化 Trait 数组
   */
  static deserializeTraits<T extends Trait>(
    traitClass: new (options: TraitOptions) => T,
    pojos: TraitOptions[]
  ): T[] {
    return pojos.map(pojo => this.deserializeTrait(traitClass, pojo));
  }
}