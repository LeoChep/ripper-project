import { UuidUtil } from "../utils/UuidUtil";
import { EffectSerializer } from "./EffectSerializer";

export class Effect {
  uid: string;
  effectType: string = "";
  effectName: string = "";
  effectData: any={};
  static getSerializer(): EffectSerializer {
    return EffectSerializer.getInstance();
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
