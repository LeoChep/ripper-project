import { AbstractPwoerController } from "../../../controller/AbstractPwoerController";
import {
  checkHit,
  checkPassiable,
  getDamage,
} from "@/core/system/AttackSystem";
import { golbalSetting } from "@/core/golbalSetting";
import { tileSize, zIndexSetting } from "@/core/envSetting";
import { generateWays } from "@/core/utils/PathfinderUtil";
import * as AttackSystem from "@/core/system/AttackSystem";
import { getAnimSpriteFromPNGpacks } from "@/core/anim/AnimSpriteFromPNGpacks";
import { UnitSystem } from "@/core/system/UnitSystem";
import { takeDamage } from "@/core/system/DamageSystem";
import { createDamageAnim } from "@/core/anim/DamageAnim";
import { createMissOrHitAnimation } from "@/core/anim/MissOrHitAnim";
import { BrustSelector } from "@/core/selector/BrustSelector";
import { checkPassiable as atkGridsCheckPassiable } from "@/core/system/AttackSystem";
import { checkPassiable as moveGridsCheckPassiable } from "@/core/system/UnitMoveSystem";
import type { Unit } from "@/core/units/Unit";
import { Area } from "@/core/area/Area";
import { OrbmastersIncendiaryDetonationEvent } from "@/core/power/wizard/OrbmastersIncendiaryDetonation/OrbmastersIncendiaryDetonationEvent";
import { AreaSystem } from "@/core/system/AreaSystem";
import { Proned } from "@/core/buff/Proned";
import { BuffSystem } from "@/core/system/BuffSystem";
import { OrbmastersIncendiaryDetonationDamageEvent } from "@/core/power/wizard/OrbmastersIncendiaryDetonation/OrbmastersIncendiaryDetonationDamageEvent";
import { ShiftAnim } from "@/core/anim/ShiftAnim";
import { MessageTipSystem } from "@/core/system/MessageTipSystem";
import { ShiftSelector } from "@/core/selector/ShiftSelector";
import { ShiftSystem } from "@/core/system/ShiftSystem";

export class FreezingBurstController extends AbstractPwoerController {
  public static isUse: boolean = false;
  public static instense: FreezingBurstController | null = null;
  powerName = "FreezingBurst";
  constructor() {
    super();
  }
  doSelect = async (): Promise<any> => {
    // Example: Select a target for the ice ray power
    if (!this.preFix()) return Promise.resolve();
    console.log('frezzingBurst doSelect')
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
      await FreezingBurstController.playAnim(
        this.selectedCharacter as Unit,
        selected.x,
        selected.y,
        1
      );

      //寻找范围内的单位
      const unitsInBrust = this.findUnitInBrustGrids(selector.brustGridSet);
      const attackPromises: Promise<void>[] = [];
      const shiftUnit:Unit[]=[];
      for (const targetUnit of unitsInBrust) {
        const attackPromise = new Promise<void>(async (resolve) => {
          const hit = await checkHit(unit, targetUnit, attack, "Ref");
          createMissOrHitAnimation(targetUnit, hit.hit);
          if (hit.hit) {
            const damage = await getDamage(targetUnit, unit, attack);
            takeDamage(damage, targetUnit);
            createDamageAnim(damage.toString(), targetUnit);
            shiftUnit.push(targetUnit)
          }
          resolve();
        });
        attackPromises.push(attackPromise);
      }
      await Promise.all(attackPromises);
      //进行位移选择
      for (let beShift of shiftUnit){
        await this.shiftFunc(beShift);
      }
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
  shiftFunc = async (beAttack: Unit) => {
    if (beAttack) {
      const beAttackX = Math.floor(beAttack.x / tileSize);
      const beAttackY = Math.floor(beAttack.y / tileSize);
      const fistShiftGrids = generateWays({
        start: { x: beAttackX, y: beAttackY },
        range: 1,
        checkFunction: (x: number, y: number, preX: number, preY: number) => {
          const movePassible = moveGridsCheckPassiable(
            beAttack,
            preX * tileSize,
            preY * tileSize,
            x * tileSize,
            y * tileSize,
            golbalSetting.map
          );
          const shiftPassibleResult = ShiftSystem.getInstance().shiftPassible(
            beAttack,
            x,
            y
          );
          return movePassible && shiftPassibleResult;
        },
      });
      ShiftSelector.getInstance().selectBasic(
        fistShiftGrids,
        beAttack,
        1,
        1,
        "yellow",
        "red",
        true
      );
      MessageTipSystem.getInstance().setMessage("请选择滑动位置");
      const firstShiftResult = await ShiftSelector.getInstance().promise;
      MessageTipSystem.getInstance().clearMessage();
      if (firstShiftResult.cancel !== true) {
        console.log("firstShiftResult", firstShiftResult, beAttack);
        ShiftAnim.shift(beAttack, firstShiftResult.selected[0]);
      }
    }
  };
}
