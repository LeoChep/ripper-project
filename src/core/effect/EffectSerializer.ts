import type { Effect } from "./Effect";
import type { EffectSerializeData } from "./EffectSerializeData";

export class EffectSerializer {
  static instance: EffectSerializer;
  static getInstance(): EffectSerializer {
    if (!this.instance) {
      this.instance = new EffectSerializer();
    }
    return this.instance;
  }
  serialize(effect: Effect): EffectSerializeData {
    return {
      effectId: effect.uid,
      effectType: effect.effectType,
      effectName: effect.effectName,
      effectData: effect.effectData
    };
  }

   deserialize(data: EffectSerializeData,effectClass?: new (...args: any[]) => Effect): Effect|null {
    return  {} as Effect
  }
}
