import { EndTurnRemoveBuffEvent } from '@/core/event/EndTurnRemoveBuffEvent';
import { distance } from "../../../system/DoorSystem";

import { AbstractPwoerController } from "../../../controller/AbstractPwoerController";
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
import { BlastSelector } from "@/core/selector/BlastSelector";
import { DivineGlowAttackBonusUp } from "@/core/power/cleric/DivineGlow/DivineGlowAttackBonusUp";

export class DivineGlowController extends AbstractPwoerController {
  public static isUse: boolean = false;
  public static instense: DivineGlowController | null =
    null;
  powerName = "DivineGlow";
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
      attackFormula: "[WIS]",
      damageFormula: "1d6+[WIS]",
      keyWords: [],
      implement: implement,
      unit: unit,
    });
    attack.range = 10; // Example range

    let resolveCallback = (value: any) => {};
    const promise = new Promise((resolve) => {
      resolveCallback = resolve;
    });

    const selector = BlastSelector.getInstance().selectBlast(
      [{ x, y }],
      3,
      1,
      "yellow",
      "red",
      true
    );
    this.graphics = selector.graphics;
    this.removeFunction = selector.removeFunction;
    const result = await selector.promise;

    if (result.cancel !== true) {
      console.log("selected blast center:", result);
      const selected = result.selected[0];

      await DivineGlowController.playAnim(
        this.selectedCharacter as Unit,
        selected[4].x,
        selected[4].y,
        1
      );

      //寻找范围内的单位
      const unitsInBrust = UnitSystem.getInstance().findUnitInGrids(
        selector.blastGridSet as Set<{ x: number; y: number; step: number }>
      );
      const enemyUnits = [];
      const friendUnits = [];
      for (const u of unitsInBrust){
        if (u.party !== unit.party){
          enemyUnits.push(u);
        } else {
          friendUnits.push(u);
        }
      }
      const attackPromises: Promise<void>[] = [];
      for (const targetUnit of enemyUnits) {

        const attackPromise = new Promise<void>(async (resolve) => {
          const hit = await checkHit(unit, targetUnit, attack, "Ref");
          createMissOrHitAnimation(targetUnit, hit.hit);
          if (hit.hit) {
            const damage = await getDamage(targetUnit, unit, attack);
            takeDamage(damage, targetUnit);
            createDamageAnim(damage.toString(), targetUnit);
          }
          resolve();
        });
        attackPromises.push(attackPromise);
      }
      await Promise.all(attackPromises);
      for (const targetUnit of friendUnits) {
        const buff = new DivineGlowAttackBonusUp();
        BuffSystem.getInstance().addTo(buff,targetUnit);
        const event=new EndTurnRemoveBuffEvent(unit,buff,2);
        event.hook();
      }
      resolveCallback({});
    } else {
      console.log("result.cancel", result);
      resolveCallback(result);
    }
    return promise;
  };

  static async playAnim(
    unit: Unit,
    gridX: number,
    gridY: number,
    range: number = 1
  ): Promise<void> {
    console.log("playAnim", unit, gridX, gridY, range);
    const sprite = await getAnimSpriteFromPNGpacks("FireballExplosion", 72);
    sprite.x = gridX * tileSize + tileSize/2;
    sprite.y = gridY * tileSize + tileSize/2;
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
