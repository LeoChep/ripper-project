import { distance } from "../../../system/DoorSystem";
import type { Unit } from "@/core/units/Unit";
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

import { getAnimSpriteFromPNGpacks } from "@/core/anim/AnimSpriteFromPNGpacks";
import { UnitSystem } from "@/core/system/UnitSystem";
import { takeDamage } from "@/core/system/DamageSystem";
import { createDamageAnim } from "@/core/anim/DamageAnim";
import { createMissOrHitAnimation } from "@/core/anim/MissOrHitAnim";
import { toward } from "@/core/anim/UnitAnimSprite";
import { BrustSelector } from "@/core/selector/BrustSelector";
import { AbilityValueSystem } from "@/core/system/AbilitiyValueSystem";

export class OrbmastersIncendiaryDetonationController extends AbstractPwoerController {
  public static isUse: boolean = false;
  public static instense: OrbmastersIncendiaryDetonationController | null =
    null;

  constructor() {
    super();
  }
  doSelect = async (): Promise<any> => {
    // Example: Select a target for the ice ray power
    if (!this.preFix()) return Promise.resolve();
    const { x, y } = this.getXY();
    const unit = this.selectedCharacter as Unit;
    const weapon = unit.creature?.weapons?.[0];
    const attack = {} as CreatureAttack;
    attack.name = "Ice Ray";
    attack.type = "ranged";
    attack.action = "attack";
    attack.range = 10; // Example range
    attack.attackBonus =
      AbilityValueSystem.getInstance().getLevelModifier(unit); // Example attack bonus
    attack.target = "enemy";
    attack.damage = "1d10"; // Example damage
    const modifer = AbilityValueSystem.getInstance().getAbilityModifier(
      unit,
      "INT"
    );
    attack.attackBonus += modifer;
    attack.attackBonus += weapon?.bonus ?? 0; // 添加武器加值
    attack.attackBonus += 1; // 精准法器
    // iceRayAttack.damage += `+${  weapon?.bonus ?? 0}+(${modifer})`; // 添加攻击加值到伤害
    // console.log("icerays attack", attack);
    const grids = generateWays({
      start: { x, y },
      range: attack.range,
      checkFunction: (gridX: any, gridY: any, preX: number, preY: number) => {
        return checkPassiable(
          unit,
          gridX ,
          gridY ,
        );
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
