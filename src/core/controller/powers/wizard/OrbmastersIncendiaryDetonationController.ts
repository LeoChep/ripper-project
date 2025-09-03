import { distance } from "../../../system/DoorSystem";

import { AbstractPwoerController } from "../AbstractPwoerController";
import type { CreatureAttack } from "@/core/units/Creature";
import {
  checkHit,
  checkPassiable,
  getDamage,
} from "@/core/system/AttackSystem";
import { golbalSetting } from "@/core/golbalSetting";
import { tileSize, zIndexSetting } from "@/core/envSetting";
import { generateWays } from "@/core/utils/PathfinderUtil";
import { BasicSelector } from "@/core/selector/BasicSelector";
import * as AttackSystem from "@/core/system/AttackSystem";
import { getAnimSpriteFromPNGpacks } from "@/core/anim/AnimSpriteFromPNGpacks";
import { UnitSystem } from "@/core/system/UnitSystem";
import { takeDamage } from "@/core/system/DamageSystem";
import { createDamageAnim } from "@/core/anim/DamageAnim";
import { createMissOrHitAnimation } from "@/core/anim/MissOrHitAnim";
import { toward } from "@/core/anim/UnitAnimSprite";
import { BrustSelector } from "@/core/selector/BrustSelector";
import { AbilityValueSystem } from "@/core/system/AbilitiyValueSystem";
import { BurnAreaEffect } from "@/core/power/wizard/OrbmastersIncendiaryDetonation/BurnAreaEffect";
import type { Unit } from "@/core/units/Unit";
import { Area } from "@/core/area/Area";
import { OrbmastersIncendiaryDetonationEvent } from "@/core/power/wizard/OrbmastersIncendiaryDetonation/OrbmastersIncendiaryDetonationEvent";
import { AreaSystem } from "@/core/system/AreaSystem";
import { Proned } from "@/core/buff/Proned";
import { BuffSystem } from "@/core/system/BuffSystem";
import { OrbmastersIncendiaryDetonation } from "@/core/power/wizard/OrbmastersIncendiaryDetonation/OrbmastersIncendiaryDetonation";
import { OrbmastersIncendiaryDetonationDamageEvent } from "@/core/power/wizard/OrbmastersIncendiaryDetonation/OrbmastersIncendiaryDetonationDamageEvent";

export class OrbmastersIncendiaryDetonationController extends AbstractPwoerController {
  public static isUse: boolean = false;
  public static instense: OrbmastersIncendiaryDetonationController | null =
    null;
  powerName = "OrbmastersIncendiaryDetonation";
  constructor() {
    super();
  }
  doSelect = async (): Promise<any> => {
    // Example: Select a target for the ice ray power
    if (!this.preFix()) return Promise.resolve();
    const { x, y } = this.getXY();
    const unit = this.selectedCharacter as Unit;
    const implement = unit.creature?.implements?.[0] || undefined;
    const attack = AttackSystem.createAttack({
      attackFormula: "[INT]",
      damageFormula: "1d6+[INT]",
      keyWords: [],
      implement: implement,
      unit: unit,
    });
    attack.range = 10; // Example range
    const grids = generateWays({
      start: { x, y },
      range: attack.range,
      checkFunction: (gridX: any, gridY: any, preX: number, preY: number) => {
        return checkPassiable(unit, gridX, gridY);
      },
    });
    let resolveCallback = (value: any) => {};
    const promise = new Promise((resolve) => {
      resolveCallback = resolve;
    });
    const selector = BrustSelector.getInstance().selectBasic(
      grids,
      1,
      1,
      "yellow",
      "red",

      true,
      () => true
    );

    this.graphics = selector.graphics;
    this.removeFunction = selector.removeFunction;
    const result = await selector.promise;

    if (result.cancel !== true) {
      const selected = result.selected[0];
      await OrbmastersIncendiaryDetonationController.playAnim(
        this.selectedCharacter as Unit,
        selected.x,
        selected.y,
        1
      );
      await this.createArea(
        this.selectedCharacter as Unit,
        selector.brustGridSet
      );
      //寻找范围内的单位
      const unitsInBrust = this.findUnitInBrustGrids(selector.brustGridSet);
      const attackPromises: Promise<void>[] = [];
      for (const targetUnit of unitsInBrust) {
        const attackPromise = new Promise<void>(async (resolve) => {
          const hit = await checkHit(unit, targetUnit, attack, "Ref");
          createMissOrHitAnimation(targetUnit, hit.hit);
          if (hit.hit) {
            const damage = await getDamage(targetUnit, unit, attack);
            takeDamage(damage, targetUnit);
            createDamageAnim(damage.toString(), targetUnit);
            const hitEffect = new Proned();
            hitEffect.source = "Proned";
            hitEffect.owner = targetUnit;
            hitEffect.giver = unit;
            BuffSystem.getInstance().addTo(hitEffect, targetUnit);
          }
          resolve();
        });
        attackPromises.push(attackPromise);
      }
      await Promise.all(attackPromises);
      resolveCallback({});
    } else {
      console.log("result.cancel", result);
      resolveCallback(result);
    }
    return promise;
  };
  findUnitInBrustGrids(gridSet: Set<{ x: number; y: number; step: number }>) {
    const unitSet = new Set<Unit>();
    gridSet.forEach((grid) => {
      const targetUnit = UnitSystem.getInstance().findUnitByGridxy(
        grid.x,
        grid.y
      );
      if (targetUnit) {
        unitSet.add(targetUnit);
      }
    });
    return unitSet;
  }
  async createAreaEffect(
    owner: Unit,
    gridSet: Set<{ x: number; y: number; step: number }>
  ) {
    const effect = new BurnAreaEffect(owner);
    effect.grids = gridSet;
    await effect.build();
    return effect;
  }
  async createArea(
    owner: Unit,
    gridSet: Set<{ x: number; y: number; step: number }>
  ) {
    const effect = await this.createAreaEffect(owner, gridSet);
    const area = new Area();
    area.effects.push(effect);
    AreaSystem.getInstance().addArea(area);
    const event = new OrbmastersIncendiaryDetonationEvent(
      this.selectedCharacter as Unit,
      area,
      2
    );
    event.hook();
    const damageEvent = new OrbmastersIncendiaryDetonationDamageEvent(
      this.selectedCharacter as Unit,
      area
    );
    damageEvent.hook();
    event.damageEventId = damageEvent.eventId;
  }
  static async playAnim(
    unit: Unit,
    gridX: number,
    gridY: number,
    range: number = 1
  ): Promise<void> {
    console.log("playAnim", unit, gridX, gridY, range);
    const sprite = await getAnimSpriteFromPNGpacks("FireballExplosion", 72);
    sprite.x = gridX * tileSize + 32;
    sprite.y = gridY * tileSize + 32;
    sprite.zIndex = zIndexSetting.spriteZIndex;
    sprite.scale = {
      x: ((range * 2 + 1) * tileSize) / sprite.width,
      y: ((range * 2 + 1) * tileSize) / sprite.height,
    };
    sprite.scale.x *= 1.5;
    sprite.scale.y *= 1.5;
    console.log("sprite scale", sprite.scale);
    sprite.anchor.set(0.5, 0.5);

    const container = golbalSetting.spriteContainer;
    const spriteLayer = golbalSetting.rlayers.spriteLayer;
    const promise = new Promise<void>((resolve) => {
      if (container && spriteLayer) {
        container.addChild(sprite);
        spriteLayer.attach(sprite);
        sprite.animationSpeed = 1;
        sprite.play();
        setTimeout(() => {
          container.removeChild(sprite);
          sprite.destroy();
          resolve();
        }, 1000);
      } else resolve();
    });
    await promise;
  }
}
