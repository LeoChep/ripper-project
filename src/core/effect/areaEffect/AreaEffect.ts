import { getAnimSpriteFromPNGpacks } from "@/core/anim/AnimSpriteFromPNGpacks";
import { Effect } from "@/core/effect/Effect";
import type { EffectSerializeData } from "@/core/effect/EffectSerializeData";
import { EffectSerializer } from "@/core/effect/EffectSerializer";
import { tileSize, zIndexSetting } from "@/core/envSetting";
import { golbalSetting } from "@/core/golbalSetting";
import { UnitSystem } from "@/core/system/UnitSystem";
import type { Unit } from "@/core/units/Unit";
import { Container } from "pixi.js";

export class AreaEffect extends Effect {
  static readonly type: string = "AreaEffect";
  static readonly name: string = "AreaEffect";
  owner: Unit | null = null; // 施法单位
  anim: Container | null = null;
  grids: Set<{ x: number; y: number; step: number }> = new Set();
  static getSerializer(): AreaEffectSerializer {
    return AreaEffectSerializer.getInstance();
  }
  getSerializer(): AreaEffectSerializer {
    return AreaEffect.getSerializer();
  }
  constructor(owner: Unit, uid?: string) {
    super(uid);
    this.owner = owner;
  }
  async build(): Promise<void> {
    const container = golbalSetting.mapContainer;
    if (!container) return;
    const effectContainer = new Container();
    container.addChild(effectContainer);
    const grids = this.grids;
    //创建动画

    this.anim = effectContainer;
  }
  remove() {
    this.anim?.parent?.removeChild(this.anim);
    this.anim?.destroy();
  }
  apply(target: Unit) {
    //
  }
}

export class AreaEffectSerializer extends EffectSerializer {
  static instance: AreaEffectSerializer;
  static getInstance(): AreaEffectSerializer {
    if (!this.instance) {
      this.instance = new AreaEffectSerializer();
    }
    return this.instance;
  }
  serialize(effect: AreaEffect): EffectSerializeData {
    const data = super.serialize(effect);
    data.effectName = "AreaEffect";
    console.log("AreaEffect serialize", data.effectData);
    data.effectData.grids = [];
    effect.grids.forEach((grid) => {
      data.effectData.grids.push({ x: grid.x, y: grid.y, step: grid.step });
    });
    data.effectData.ownerId = effect.owner?.id || "";
    return data;
  }
  deserialize(data: EffectSerializeData): AreaEffect | null {
    const { ownerId } = data.effectData;
    if (!ownerId) return null;
    const owner = UnitSystem.getInstance().getUnitById(ownerId);

    if (!owner) return null;

    const effect = new AreaEffect(owner, data.effectId);
    effect.grids = new Set(data.effectData.grids);
    return effect;
  }
}
