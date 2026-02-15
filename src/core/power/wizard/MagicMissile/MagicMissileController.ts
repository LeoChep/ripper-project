import { distance } from "./../../../system/DoorSystem";
import type { Unit } from "@/core/units/Unit";
import { AbstractPwoerController } from "../../../controller/AbstractPwoerController";
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
import { LightParticle } from "@/core/anim/particle/LightParticle";
import * as PIXI from "pixi.js";
import { AbilityValueSystem } from "@/core/system/AbilitiyValueSystem";

export class MagicMissileController extends AbstractPwoerController {
  public static isUse: boolean = false;
  public static instense: MagicMissileController | null = null;
  powerName='MagicMissile'
  constructor() {
    super();
  }
  doSelect = async (): Promise<any> => {
    // Example: Select a target for the ice ray power
    if (!this.preFix()) return Promise.resolve();
    const { x, y } = this.getXY();
    const unit = this.selectedCharacter as Unit;
    const attack = {} as CreatureAttack;
    attack.name = "Magic Missile";
    attack.type = "ranged";
    attack.action = "attack";
    attack.range = 20; // Example range
    attack.target = "enemy";

    const modifer = AbilityValueSystem.getInstance().getAbilityModifier(
      unit,
      "INT"
    );
    attack.damage = (2 + modifer >= 0 ? (2 + modifer).toString() : "0"); // Example damage

    // iceRayAttack.damage += `+${  weapon?.bonus ?? 0}+(${modifer})`; // 添加攻击加值到伤害
    console.log("icerays attack", attack);
    const grids = generateWays({
      start: { x, y },
      range: attack.range,
      checkFunction: (gridX: any, gridY: any, preX: number, preY: number) => {
        return checkPassiable(
          unit,
          gridX ,
          gridY ,
      
        );
      }
    });
    let resolveCallback = (value: any) => {};
    const promise = new Promise((resolve) => {
      resolveCallback = resolve;
    });
    const selector = BasicSelector.getInstance().selectBasic(
      grids,
      1,
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
          const backPoint = { x: unit.x, y: unit.y };
          const direction = unit.direction;
          if (direction === 0) {
            backPoint.x += tileSize;
          } else if (direction === 2) {
            backPoint.y -= tileSize;
          } else if (direction === 1) {
            backPoint.x -= tileSize;
          } else if (direction === 3) {
            backPoint.y += tileSize;
          }
          // 执行魔法导弹动画 (可以选择使用 playAnim 或 playAnim2)
          const targetUnit = UnitSystem.getInstance().findUnitByGridxy(
            target.x,
            target.y
          );
          for (let i = 0; i < 5; i++) {
            const promiseTimeOut = new Promise<void>((resolve) => {
              setTimeout(async () => {
                const promise = MagicMissileController.playAnim(
                  unit,
                  target.x,
                  target.y
                ); // 粒子动画
                // const promise = MagicMissileController.playAnim2(unit, target.x, target.y); // 火焰射线动画
                promiseAll.push(promise);
                promiseAll.push(promiseTimeOut);
                resolve();
              }, Math.random() * 150);
            });
            await promiseTimeOut;
          }

          if (targetUnit) {
          }
        }
        await Promise.all(promiseAll);
      }
      const targetUnit = UnitSystem.getInstance().findUnitByGridxy(
        selected[0].x,
        selected[0].y
      );
      console.log("magic missile target unit", targetUnit);
      if (targetUnit) {
        // const damage=await getDamage(unit, targetUnit, attack);
        // console.log("magic missile damage", damage);
        createDamageAnim(attack.damage, targetUnit);
        await takeDamage(parseInt(attack.damage), targetUnit);
      }
      resolveCallback({});
    } else {
      resolveCallback(result);
    }
    return promise;
  };

  //使用png动画
  static async playAnim(
    unit: Unit,
    gridX: number,
    gridY: number
  ): Promise<void> {
    const sprite = await getAnimSpriteFromPNGpacks("MagicMissile", 34);
    sprite.x = unit.x + tileSize/2;
    sprite.y = unit.y + tileSize/2;
    //sprite 位置添加随机偏移
    sprite.x += Math.random() * tileSize/2 - tileSize/2; // 随机偏移
    sprite.y += Math.random() * tileSize/2 - tileSize/2; // 随机偏移

    const distance = Math.sqrt(
      (gridX * tileSize+tileSize/2 - unit.x) ** 2 + (gridY * tileSize+tileSize/2 - unit.y) ** 2
    );
    console.log("distance", distance);
    sprite.scale = { x: distance / sprite.width *1.5, y: 124 / sprite.height };
    console.log("sprite scale", sprite.scale);
    sprite.anchor.set(0.2, 0.5);
    sprite.rotation = Math.atan2(
      gridY * tileSize - unit.y,
      gridX * tileSize - unit.x
    );
    //概率镜像翻转sprite
    if (Math.random() > 0.5) {
      sprite.scale.y *= -1; // 镜像翻转
    }
    const container = golbalSetting.spriteContainer;
    const spriteLayer = golbalSetting.rlayers.spriteLayer;
    const promise = new Promise<void>((resolve) => {
      if (container && spriteLayer) {
        container.addChild(sprite);
        spriteLayer.attach(sprite);
        sprite.animationSpeed = 0.5;
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

  

  // 火焰魔法射线动画
  static playAnim2 = async (
    unit: Unit,
    gridX: number,
    gridY: number
  ): Promise<void> => {
    return new Promise<void>(async (resolve) => {
      const container = golbalSetting.spriteContainer;
      const spriteLayer = golbalSetting.rlayers.spriteLayer;

      if (!container || !spriteLayer) {
        resolve();
        return;
      }

      // 计算起点和终点
      const startX = unit.x + tileSize/2;
      const startY = unit.y + tileSize/2;
      const endX = gridX * tileSize + tileSize/2;
      const endY = gridY * tileSize + tileSize/2;

      // 计算距离和角度
      const distance = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
      const angle = Math.atan2(endY - startY, endX - startX);

      // 创建火焰射线图形
      const graphics = new PIXI.Graphics();

      // 设置火焰效果的基础参数
      const rayWidth = 8;
      const animationDuration = 800; // 毫秒
      const startTime = Date.now();

      container.addChild(graphics);
      spriteLayer.attach(graphics);

      // 动画渲染函数
      const animateRay = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / animationDuration, 1);

        graphics.clear();

        if (progress < 1) {
          // 动态扩展的射线长度
          const currentDistance = distance * progress;

          // 创建火焰渐变效果
          const segments = 20;
          for (let i = 0; i < segments; i++) {
            const segmentProgress = i / segments;
            const segmentDistance = currentDistance * segmentProgress;

            // 计算当前段的位置
            const x = startX + Math.cos(angle) * segmentDistance;
            const y = startY + Math.sin(angle) * segmentDistance;

            // 火焰颜色变化：从亮黄到深红
            const intensity = 1 - segmentProgress * 0.7;
            const red = Math.floor(255 * intensity);
            const green = Math.floor(
              200 * intensity * (1 - segmentProgress * 0.5)
            );
            const blue = Math.floor(50 * intensity * (1 - segmentProgress));
            const alpha = intensity * (1 - progress * 0.3);

            // 添加闪烁效果
            const flicker = 0.8 + Math.sin(elapsed * 0.01 + i) * 0.2;
            const currentAlpha = alpha * flicker;

            // 射线宽度随距离变化
            const currentWidth =
              rayWidth * (1 + segmentProgress * 0.5) * flicker;

            graphics.beginFill((red << 16) | (green << 8) | blue, currentAlpha);
            graphics.drawCircle(x, y, currentWidth);
            graphics.endFill();
          }

          // 添加核心亮线
          graphics.lineStyle(2, 0xffffaa, 0.9);
          graphics.moveTo(startX, startY);
          graphics.lineTo(
            startX + Math.cos(angle) * currentDistance,
            startY + Math.sin(angle) * currentDistance
          );

          // 添加起点火花效果
          const sparkCount = 5;
          for (let i = 0; i < sparkCount; i++) {
            const sparkAngle = angle + (Math.random() - 0.5) * 0.5;
            const sparkDistance = Math.random() * 20;
            const sparkX = startX + Math.cos(sparkAngle) * sparkDistance;
            const sparkY = startY + Math.sin(sparkAngle) * sparkDistance;
            const sparkAlpha = Math.random() * 0.7;

            graphics.beginFill(0xffaa00, sparkAlpha);
            graphics.drawCircle(sparkX, sparkY, Math.random() * 3 + 1);
            graphics.endFill();
          }

          // 如果射线达到终点，添加爆炸效果
          if (progress > 0.8) {
            const impactProgress = (progress - 0.8) / 0.2;
            const impactRadius = 30 * impactProgress;
            const impactAlpha = 0.6 * (1 - impactProgress);

            graphics.beginFill(0xff4400, impactAlpha);
            graphics.drawCircle(endX, endY, impactRadius);
            graphics.endFill();

            // 冲击波
            graphics.lineStyle(3, 0xffaa00, impactAlpha * 0.5);
            graphics.drawCircle(endX, endY, impactRadius * 1.5);
          }

          requestAnimationFrame(animateRay);
        } else {
          // 动画结束，清理
          container.removeChild(graphics);
          graphics.destroy();
          resolve();
        }
      };

      // 开始动画
      animateRay();
    });
  };
}
