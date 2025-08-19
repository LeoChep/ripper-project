import type { EffectSerializeData } from "../effect/EffectSerializeData";

export interface AreaSerializeData {
  uid: string;
  effects: EffectSerializeData[];
}
