import { distance } from "./../../../system/DoorSystem";
import type { Unit } from "@/core/units/Unit";
import { AbstractPwoerController } from "../../../controller/AbstractPwoerController";
import * as AttackSystem from "@/core/system/AttackSystem";
import {
  checkHit,
  checkPassiable,
  getDamage,
} from "@/core/system/AttackSystem";
import { golbalSetting } from "@/core/golbalSetting";
import { tileSize } from "@/core/envSetting";
import { generateWays } from "@/core/utils/PathfinderUtil";
import { BasicSelector } from "@/core/selector/BasicSelector";

import { getAnimSpriteFromPNGpacks } from "@/core/anim/AnimSpriteFromPNGpacks";
import { UnitSystem } from "@/core/system/UnitSystem";
import { takeDamage } from "@/core/system/DamageSystem";
import { createDamageAnim } from "@/core/anim/DamageAnim";
import { createMissOrHitAnimation } from "@/core/anim/MissOrHitAnim";
import { toward } from "@/core/anim/UnitAnimSprite";
import { Slowed } from "@/core/buff/Slowed";
import { BuffSystem } from "@/core/system/BuffSystem";
import { Immobilized } from "@/core/buff/Immobilized";
import { EndTurnRemoveBuffEvent } from "@/core/event/EndTurnRemoveBuffEvent";
import { ModifierSystem } from "@/core/system/ModifierSystem";
import { AbilityValueSystem } from "@/core/system/AbilitiyValueSystem";
import { BattleEvenetSystem } from "@/core/system/BattleEventSystem";

export class IceRaysController extends AbstractPwoerController {
  public static isUse: boolean = false;
  public static instense: IceRaysController | null = null;
  powerName = "IceRays";

  constructor() {
    super();
  }
  doSelect = async (): Promise<any> => {
    // Example: Select a target for the ice ray power
    if (!this.preFix()) return Promise.resolve();
    const { x, y } = this.getXY();
    const unit = this.selectedCharacter as Unit;
    const implement = unit.creature?.implements?.[0] || undefined;
    const iceRayAttack = AttackSystem.createAttack({
      attackFormula: "[INT]",
      damageFormula: "1d10+[INT]",
      keyWords: [],
      implement: implement,
      unit: unit,
    });
    iceRayAttack.range=10;
    console.log("icerays attack", iceRayAttack);
    const grids = generateWays({
      start: { x, y },
      range: iceRayAttack.range,
      checkFunction: (gridX: any, gridY: any, preX: number, preY: number) => {
        return checkPassiable(unit, gridX, gridY);
      },
    });
    let resolveCallback = (value: any) => {};
    const promise = new Promise((resolve) => {
      resolveCallback = resolve;
    });
    const selector = BasicSelector.getInstance().selectBasic(
      grids,
      2,
      "red",
      true,
      () => true
    );
    this.graphics = selector.graphics;
    this.removeFunction = selector.removeFunction;
    const result = await selector.promise;
    console.log("icerays", result);
    const selected = result.selected;
    if (result.cancel !== true) {
      if (selected.length > 0) {
        const promiseAll = [] as Promise<void>[];
        for (let i = 0; i < selected.length; i++) {
          const target = selected[i];
          toward(unit, target.x, target.y);
          // 执行冰霜射线动画
          const targetUnit = UnitSystem.getInstance().findUnitByGridxy(
            target.x,
            target.y
          );
          const promise = IceRaysController.iceAnim(unit, target.x, target.y);
          promiseAll.push(promise);
          if (targetUnit) {
            const attackPromise = new Promise<void>(async (resolve) => {
              const hit = await checkHit(unit, targetUnit, iceRayAttack, "Ref");
              createMissOrHitAnimation(targetUnit, hit.hit);
              if (hit.hit) {
                const damage = await getDamage(targetUnit, unit, iceRayAttack);
                takeDamage(damage, targetUnit);
                createDamageAnim(damage.toString(), targetUnit);
                const hitEffect = new Immobilized();
                hitEffect.source = "IceRays";
                hitEffect.owner = targetUnit;
                hitEffect.giver = unit;
                BuffSystem.getInstance().addTo(hitEffect, targetUnit);
                new EndTurnRemoveBuffEvent(
                  unit,
                  hitEffect,
                  2 //下回合移除
                ).hook();
              } else {
                const missEffect = new Slowed();
                missEffect.source = "IceRays";
                missEffect.owner = targetUnit;
                missEffect.giver = unit;
                BuffSystem.getInstance().addTo(missEffect, targetUnit);
                new EndTurnRemoveBuffEvent(
                  unit,
                  missEffect,
                  2 //下回合移除
                ).hook();
              }
              resolve();
            });
            promiseAll.push(attackPromise);
          }
        }
        await Promise.all(promiseAll);
        resolveCallback({});
      }
    } else {
      resolveCallback(result);
    }
    return promise;
  };

  static async iceAnim(
    unit: Unit,
    gridX: number,
    gridY: number
  ): Promise<void> {
    // video = document.createElement("video");
    // // document.body.appendChild(video);
    // video.src = RayOfFrost;

    // video.loop = false;
    // video.autoplay = false;
    // video.muted = true;
    // video.preload = "auto"; // 强制预加载
    // video.load(); // 触发加载
    // await video.play(); // 兼容自动播放策略

    const sprite = await getAnimSpriteFromPNGpacks("iceRay", 77);
    sprite.x = unit.x + 32;
    sprite.y = unit.y + 32;
    const distance = Math.sqrt(
      (gridX * tileSize - unit.x) ** 2 + (gridY * tileSize - unit.y) ** 2
    );
    console.log("distance", distance);
    sprite.scale = { x: distance / sprite.width, y: 124 / sprite.height };
    console.log("sprite scale", sprite.scale);
    sprite.anchor.set(0, 0.5);
    sprite.rotation = Math.atan2(
      gridY * tileSize - unit.y,
      gridX * tileSize - unit.x
    );

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
