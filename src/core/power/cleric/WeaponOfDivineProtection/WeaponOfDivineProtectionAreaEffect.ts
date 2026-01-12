import { getAnimSpriteFromPNGpacks } from "@/core/anim/AnimSpriteFromPNGpacks";
import {
  AreaEffect,
  AreaEffectSerializer,
} from "@/core/effect/areaEffect/AreaEffect";
import { Effect } from "@/core/effect/Effect";
import type { EffectSerializeData } from "@/core/effect/EffectSerializeData";
import { EffectSerializer } from "@/core/effect/EffectSerializer";
import { tileSize, zIndexSetting } from "@/core/envSetting";
import { golbalSetting } from "@/core/golbalSetting";
import { UnitSystem } from "@/core/system/UnitSystem";
import type { Unit } from "@/core/units/Unit";
import { Container } from "pixi.js";
import * as PIXI from "pixi.js";
export class WeaponOfDivineProtectionAreaEffect extends AreaEffect {
  static override readonly type = "WeaponOfDivineProtectionAreaEffect";
  static override readonly name = "WeaponOfDivineProtectionAreaEffect";
  owner: Unit | null = null; // 施法单位
  anim: Container | null = null;
  grids: Set<{ x: number; y: number; step: number }> = new Set();
  static getSerializer(): WeaponOfDivineProtectionAreaEffectSerializer {
    return WeaponOfDivineProtectionAreaEffectSerializer.getInstance();
  }
  getSerializer(): WeaponOfDivineProtectionAreaEffectSerializer {
    return WeaponOfDivineProtectionAreaEffect.getSerializer();
  }
  constructor(owner: Unit, uid?: string) {
    super(owner, uid);
  }
  async build(): Promise<void> {
    super.build();
     const basicLayer = golbalSetting.rlayers.basicLayer;
     if (!basicLayer) return;
    this.grids.forEach((grid) => {
      const graphics = new PIXI.Graphics();
      const drawX = grid.x * tileSize;
      const drawY = grid.y * tileSize;
      graphics.rect(drawX, drawY, tileSize, tileSize);
      graphics.fill({ color: "yellow" , alpha: 0.3 });
      this.anim?.addChild(graphics);
       basicLayer.attach(graphics);
    });
  }
  remove() {
    this.anim?.parent?.removeChild(this.anim);
    this.anim?.destroy();
  }
  apply(target: Unit) {
    // 应用灼烧效果
  }
}

export class WeaponOfDivineProtectionAreaEffectSerializer extends AreaEffectSerializer {
  static instance: WeaponOfDivineProtectionAreaEffectSerializer;
  static getInstance(): WeaponOfDivineProtectionAreaEffectSerializer {
    if (!this.instance) {
      this.instance = new WeaponOfDivineProtectionAreaEffectSerializer();
    }
    return this.instance;
  }
  serialize(effect: WeaponOfDivineProtectionAreaEffect): EffectSerializeData {
    const data = super.serialize(effect);
    data.effectName = "WeaponOfDivineProtectionAreaEffect";
    console.log(
      "WeaponOfDivineProtectionAreaEffect  serialize",
      data.effectData
    );
    data.effectData.grids = [];
    effect.grids.forEach((grid) => {
      data.effectData.grids.push({ x: grid.x, y: grid.y, step: grid.step });
    });
    data.effectData.ownerId = effect.owner?.id || "";
    return data;
  }
  deserialize(
    data: EffectSerializeData
  ): WeaponOfDivineProtectionAreaEffect | null {
    const { ownerId } = data.effectData;
    if (!ownerId) return null;
    const owner = UnitSystem.getInstance().getUnitById(ownerId);

    if (!owner) return null;

    const effect = new WeaponOfDivineProtectionAreaEffect(owner, data.effectId);
    effect.grids = new Set(data.effectData.grids);
    return effect;
  }
}
