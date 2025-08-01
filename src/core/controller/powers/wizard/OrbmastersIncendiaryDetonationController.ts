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
import { tileSize } from "@/core/envSetting";
import { generateWays } from "@/core/utils/PathfinderUtil";
import { BasicSelector } from "@/core/selector/BasicSelector";

import { getAnimSpriteFromPNGpacks } from "@/core/anim/AnimSpriteFromPNGpacks";
import { UnitSystem } from "@/core/system/UnitSystem";
import { takeDamage } from "@/core/system/DamageSystem";
import { createDamageAnim } from "@/core/anim/DamageAnim";
import { createMissOrHitAnimation } from "@/core/anim/MissOrHitAnim";
import { toward } from "@/core/anim/UnitAnimSprite";
import { BrustSelector } from "@/core/selector/BrustSelector";

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
    const iceRayAttack = {} as CreatureAttack;
    iceRayAttack.name = "Ice Ray";
    iceRayAttack.type = "ranged";
    iceRayAttack.action = "attack";
    iceRayAttack.range = 10; // Example range
    iceRayAttack.attackBonus = 12; // Example attack bonus
    iceRayAttack.target = "enemy";
    iceRayAttack.damage = "1d10"; // Example damage
    const modifer =
      unit.creature?.abilities?.find(
        (ability) => ability.name === "Intelligence"
      )?.modifier ?? 0; // 使用智力作为攻击加值
    iceRayAttack.attackBonus = modifer;
    iceRayAttack.attackBonus += weapon?.bonus ?? 0; // 添加武器加值
    iceRayAttack.attackBonus += 1; // 精准法器
    // iceRayAttack.damage += `+${  weapon?.bonus ?? 0}+(${modifer})`; // 添加攻击加值到伤害
    console.log("icerays attack", iceRayAttack);
    const grids = generateWays(
      x,
      y,
      iceRayAttack.range,
      (gridX: any, gridY: any, preX: number, preY: number) => {
        return checkPassiable(
          unit,
          gridX * tileSize,
          gridY * tileSize,
          golbalSetting.map
        );
      }
    );
    let resolveCallback = (value: any) => {};
    const promise = new Promise((resolve) => {
      resolveCallback = resolve;
    });
    const selector = BrustSelector.getInstance().selectBasic(
      grids,
      1,
      1 ,
      "yellow",
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
      resolveCallback({});
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

    const sprite = await getAnimSpriteFromPNGpacks("iceRay",77);
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
