import { BurnAreaEffect } from "../power/wizard/OrbmastersIncendiaryDetonation/BurnAreaEffect";
import type { EffectSerializer } from "./EffectSerializer";


export class EffectSerializerSheet {
  private static _instance: EffectSerializerSheet;
  private _effectSerializer: Map<string, EffectSerializer>;

  private constructor() {
    this._effectSerializer = new Map();
  }
  public getSerializer(name: string) {
    return this._effectSerializer.get(name);
  }
  static getInstance(): EffectSerializerSheet {
    if (!this._instance) {
      this._instance = new EffectSerializerSheet();
      initEffectSerializer();
    }
    return this._instance;
  }
  registerEffectSerializer(name: string, serializer: EffectSerializer): void {
    this._effectSerializer.set(name, serializer);
  }
}
interface EffectClassWithSerializer {
  name: string;
  getSerializer: () => EffectSerializer;
}

function registerEffectSerializer(effectClass: EffectClassWithSerializer) {
  EffectSerializerSheet.getInstance().registerEffectSerializer(
    effectClass.name,
    effectClass.getSerializer()
  );
}
function initEffectSerializer(): void {
  registerEffectSerializer(BurnAreaEffect)

}
