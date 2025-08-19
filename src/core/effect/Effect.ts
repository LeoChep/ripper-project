import { UuidUtil } from "../utils/UuidUtil";
import type { EffectSerializer } from "./EffectSerializer";

export class Effect {
  uid: string;
  effectType: string = "";
  effectName: string = "";
  effectData: any = {};
  static getSerializer(): EffectSerializer {
    return Effect.getSerializer();
  }
  getSerializer(): EffectSerializer {
    return Effect.getSerializer();
  }
  build(...args: any[]) {}
  remove(...args: any[]) {}
  constructor(uid?: string) {
    this.uid = uid ? uid : UuidUtil.generate();
  }
}
