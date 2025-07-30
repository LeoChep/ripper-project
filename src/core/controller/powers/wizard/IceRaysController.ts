import { distance } from "./../../../system/DoorSystem";
import type { Unit } from "@/core/units/Unit";
import { AbstractPwoerController } from "../AbstractPwoerController";
import type { CreatureAttack } from "@/core/units/Creature";
import { checkPassiable } from "@/core/system/AttackSystem";
import { golbalSetting } from "@/core/golbalSetting";
import { tileSize } from "@/core/envSetting";
import { generateWays } from "@/core/utils/PathfinderUtil";
import { BasicSelector } from "@/core/selector/BasicSelector";
import * as PIXI from "pixi.js";

import { getParticleFile, loadEffectAnim } from "@/utils/utils";

export class IceRaysController extends AbstractPwoerController {
  public static isUse: boolean = false;
  public static instense: IceRaysController | null = null;

  constructor() {
    super();
  }
  doSelect = async (): Promise<any> => {
    // Example: Select a target for the ice ray power
    if (!this.preFix()) return Promise.resolve();
    const { x, y } = this.getXY();
    const unit = this.selectedCharacter as Unit;
    const iceRayAttack = {} as CreatureAttack;
    iceRayAttack.name = "Ice Ray";
    iceRayAttack.type = "ranged";
    iceRayAttack.action = "attack";
    iceRayAttack.range = 10; // Example range
    iceRayAttack.attackBonus = 12; // Example attack bonus
    iceRayAttack.target = "enemy";
    iceRayAttack.damage = "1d10"; // Example damage
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
        for (let i = 0; i < selected.length; i++) {
          const target = selected[i];
          await IceRaysController.iceAnim(unit, target.x, target.y);
        }

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
    const alienImages = loadEffectAnim("iceRay", 60);
    const textureArray = [];
    console.log("alienImages", alienImages);
    for (let i = 0; i < 60; i++) {
        await PIXI.Assets.load(alienImages[i]);
      const texture = PIXI.Texture.from(alienImages[i]);
      textureArray.push(texture);
    }

    const animatedSprite = new PIXI.AnimatedSprite(textureArray);
    const sprite=animatedSprite;
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
    if (container && spriteLayer) {
      container.addChild(sprite);

      spriteLayer.attach(sprite);
      animatedSprite.animationSpeed = 1;
      animatedSprite.play();
      setTimeout(() => {
        container.removeChild(sprite);
        sprite.destroy();
      }, 1000);
    }
  }
}
