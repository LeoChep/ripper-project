import type { EffectSerializeData } from "../effect/EffectSerializeData";

export interface AreaSerializeData {
  name: string;
  des: string;
  uid: string;
  effects: EffectSerializeData[];
}
