import { distance } from "./../../../system/DoorSystem";
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
            backPoint.x += 64;
          } else if (direction === 2) {
            backPoint.y -= 64;
          } else if (direction === 1) {
            backPoint.x -= 64;
          } else if (direction === 3) {
            backPoint.y += 64;
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
    sprite.x = unit.x + 32;
    sprite.y = unit.y + 32;
    //sprite 位置添加随机偏移
    sprite.x += Math.random() * 32 - 32; // 随机偏移
    sprite.y += Math.random() * 32 - 32; // 随机偏移

    const distance = Math.sqrt(
      (gridX * tileSize+32 - unit.x) ** 2 + (gridY * tileSize+32 - unit.y) ** 2
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

  //使用粒子
  // static playAnim = async (
  //   unit: Unit,
  //   gridX: number,
  //   gridY: number
  // ): Promise<void> => {
  //   const lightParticle = new LightParticle();
  //   lightParticle.x = unit.x + 32;
  //   lightParticle.y = unit.y + 32;
  //   const backPoint = { x: unit.x, y: unit.y };
  //   const toward = unit.direction;
  //   if (toward === 0) {
  //     backPoint.x += 64;
  //   } else if (toward === 2) {
  //     backPoint.y -= 64;
  //   } else if (toward === 1) {
  //     backPoint.x -= 64;
  //   } else if (toward === 3) {
  //     backPoint.y += 64;
  //   }
  //   await lightParticle.init();

  //   lightParticle.palyTime = 0;
  //   const container = golbalSetting.spriteContainer;
  //   const spriteLayer = golbalSetting.rlayers.spriteLayer;
  //   if (!container || !spriteLayer || !lightParticle.instance) {
  //     return Promise.resolve();
  //   }
  //   container.addChild(lightParticle.instance);
  //   spriteLayer.attach(lightParticle.instance);
  //   lightParticle.play();

  //   // 计算贝塞尔曲线参数（高级随机版本）
  //   const startX = unit.x + 32; // 保持以unit中心为起始点
  //   const startY = unit.y + 32;
  //   const endX = gridX * tileSize + 32;
  //   const endY = gridY * tileSize + 32;

  //   // 计算直线距离
  //   const directDistance = Math.sqrt(
  //     (endX - startX) ** 2 + (endY - startY) ** 2
  //   );

  //   // 随机选择曲线类型
  //   const curveType = Math.random();
  //   let controlPoints: Array<{ x: number; y: number }> = [];
  //   const minCurveLength = 320; // 最小曲线长度

  //   if (curveType < 0.5) {
  //     // 50% 概率：单控制点二次贝塞尔曲线
  //     const maxCurveLength = Math.max(minCurveLength, directDistance * 1.5);

  //     const midX = (startX + endX) / 2;
  //     const midY = (startY + endY) / 2;

  //     const midOffsetX = (Math.random() - 0.5) * directDistance * 0.15;
  //     const midOffsetY = (Math.random() - 0.5) * directDistance * 0.15;

  //     const dx = endX - startX;
  //     const dy = endY - startY;
  //     const perpX = -dy;
  //     const perpY = dx;
  //     const perpLength = Math.sqrt(perpX * perpX + perpY * perpY);

  //     let baseOffsetFactor = Math.min(
  //       0.6,
  //       Math.max(0.2, (minCurveLength / Math.max(directDistance, 100)) * 0.3)
  //     );

  //     const randomOffsetMultiplier = 0.8 + Math.random() * 0.4;
  //     const randomDirection = Math.random() > 0.5 ? 1 : -1;

  //     let controlPointDistance = Math.max(
  //       directDistance * 0.4,
  //       Math.min(directDistance * 0.8, minCurveLength * 0.4)
  //     );

  //     let controlX =
  //       midX +
  //       midOffsetX +
  //       (perpX / perpLength) *
  //         controlPointDistance *
  //         baseOffsetFactor *
  //         randomOffsetMultiplier *
  //         randomDirection;
  //     let controlY =
  //       midY +
  //       midOffsetY +
  //       (perpY / perpLength) *
  //         controlPointDistance *
  //         baseOffsetFactor *
  //         randomOffsetMultiplier *
  //         randomDirection;

  //     controlPoints = [{ x: controlX, y: controlY }];

  //     // 验证二次贝塞尔曲线长度
  //     const tempGetBezierPoint = (t: number) => {
  //       const oneMinusT = 1 - t;
  //       const x =
  //         oneMinusT * oneMinusT * startX +
  //         2 * oneMinusT * t * controlX +
  //         t * t * endX;
  //       const y =
  //         oneMinusT * oneMinusT * startY +
  //         2 * oneMinusT * t * controlY +
  //         t * t * endY;
  //       return { x, y };
  //     };

  //     const calculateTempCurveLength = () => {
  //       let length = 0;
  //       const segments = 100;
  //       let prevPoint = tempGetBezierPoint(0);

  //       for (let i = 1; i <= segments; i++) {
  //         const currentPoint = tempGetBezierPoint(i / segments);
  //         const segmentLength = Math.sqrt(
  //           (currentPoint.x - prevPoint.x) ** 2 +
  //             (currentPoint.y - prevPoint.y) ** 2
  //         );
  //         length += segmentLength;
  //         prevPoint = currentPoint;
  //       }
  //       return length;
  //     };

  //     let attempts = 0;
  //     let tempCurveLength = calculateTempCurveLength();

  //     // 尝试调整现有控制点
  //     while (
  //       (tempCurveLength < minCurveLength ||
  //         tempCurveLength > maxCurveLength) &&
  //       attempts < 5
  //     ) {
  //       if (tempCurveLength < minCurveLength) {
  //         controlPointDistance *= 1.15;
  //         baseOffsetFactor *= 1.1;
  //       } else if (tempCurveLength > maxCurveLength) {
  //         controlPointDistance *= 0.9;
  //         baseOffsetFactor *= 0.95;
  //       }

  //       controlX =
  //         midX +
  //         midOffsetX +
  //         (perpX / perpLength) *
  //           controlPointDistance *
  //           baseOffsetFactor *
  //           randomOffsetMultiplier *
  //           randomDirection;
  //       controlY =
  //         midY +
  //         midOffsetY +
  //         (perpY / perpLength) *
  //           controlPointDistance *
  //           baseOffsetFactor *
  //           randomOffsetMultiplier *
  //           randomDirection;

  //       controlPoints[0] = { x: controlX, y: controlY };
  //       tempCurveLength = calculateTempCurveLength();
  //       attempts++;
  //     }

  //     // 如果仍然小于最小长度，添加backPoint作为额外控制点，转换为三次贝塞尔曲线
  //     if (tempCurveLength < minCurveLength) {
  //       console.log(
  //         `二次曲线长度不足 ${tempCurveLength.toFixed(
  //           2
  //         )}px，添加backPoint控制点转换为三次曲线`
  //       );

  //       // 添加backPoint作为第一个控制点，原控制点成为第二个控制点
  //       const backPointOffsetX = (Math.random() - 0.5) * 20; // 轻微随机偏移
  //       const backPointOffsetY = (Math.random() - 0.5) * 20;

  //       controlPoints = [
  //         {
  //           x: backPoint.x + backPointOffsetX,
  //           y: backPoint.y + backPointOffsetY,
  //         }, // backPoint控制点
  //         { x: controlX, y: controlY }, // 原有控制点
  //       ];

  //       console.log(
  //         `添加backPoint控制点: (${backPoint.x + backPointOffsetX}, ${
  //           backPoint.y + backPointOffsetY
  //         })`
  //       );
  //     }
  //   } else {
  //     // 50% 概率：双控制点三次贝塞尔曲线（S形曲线）
  //     const maxCurveLength = Math.max(minCurveLength, directDistance * 1.5);

  //     const segment1X = startX + (endX - startX) * 0.35;
  //     const segment1Y = startY + (endY - startY) * 0.35;
  //     const segment2X = startX + (endX - startX) * 0.65;
  //     const segment2Y = startY + (endY - startY) * 0.65;

  //     let offsetMultiplier = Math.min(
  //       0.3,
  //       Math.max(0.15, (minCurveLength / Math.max(directDistance, 100)) * 0.2)
  //     );

  //     const angle1 = Math.random() * Math.PI * 2;
  //     const angle2 = angle1 + Math.PI + (Math.random() - 0.5) * 0.8;

  //     const offsetDistance1 =
  //       directDistance * offsetMultiplier * (0.7 + Math.random() * 0.3);
  //     const offsetDistance2 =
  //       directDistance * offsetMultiplier * (0.7 + Math.random() * 0.3);

  //     let control1OffsetX = Math.cos(angle1) * offsetDistance1;
  //     let control1OffsetY = Math.sin(angle1) * offsetDistance1;
  //     let control2OffsetX = Math.cos(angle2) * offsetDistance2;
  //     let control2OffsetY = Math.sin(angle2) * offsetDistance2;

  //     controlPoints = [
  //       { x: segment1X + control1OffsetX, y: segment1Y + control1OffsetY },
  //       { x: segment2X + control2OffsetX, y: segment2Y + control2OffsetY },
  //     ];

  //     // 验证三次贝塞尔曲线长度
  //     const tempGetCubicBezierPoint = (t: number) => {
  //       const oneMinusT = 1 - t;
  //       const x =
  //         oneMinusT * oneMinusT * oneMinusT * startX +
  //         3 * oneMinusT * oneMinusT * t * controlPoints[0].x +
  //         3 * oneMinusT * t * t * controlPoints[1].x +
  //         t * t * t * endX;
  //       const y =
  //         oneMinusT * oneMinusT * oneMinusT * startY +
  //         3 * oneMinusT * oneMinusT * t * controlPoints[0].y +
  //         3 * oneMinusT * t * t * controlPoints[1].y +
  //         t * t * t * endY;
  //       return { x, y };
  //     };

  //     const calculateCubicCurveLength = () => {
  //       let length = 0;
  //       const segments = 100;
  //       let prevPoint = tempGetCubicBezierPoint(0);

  //       for (let i = 1; i <= segments; i++) {
  //         const currentPoint = tempGetCubicBezierPoint(i / segments);
  //         const segmentLength = Math.sqrt(
  //           (currentPoint.x - prevPoint.x) ** 2 +
  //             (currentPoint.y - prevPoint.y) ** 2
  //         );
  //         length += segmentLength;
  //         prevPoint = currentPoint;
  //       }
  //       return length;
  //     };

  //     let attempts = 0;
  //     let cubicCurveLength = calculateCubicCurveLength();

  //     // 尝试调整S曲线
  //     while (
  //       (cubicCurveLength < minCurveLength ||
  //         cubicCurveLength > maxCurveLength) &&
  //       attempts < 5
  //     ) {
  //       if (cubicCurveLength < minCurveLength) {
  //         offsetMultiplier *= 1.2;
  //       } else if (cubicCurveLength > maxCurveLength) {
  //         offsetMultiplier *= 0.85;
  //       }

  //       const newOffsetDistance1 =
  //         directDistance * offsetMultiplier * (0.7 + Math.random() * 0.3);
  //       const newOffsetDistance2 =
  //         directDistance * offsetMultiplier * (0.7 + Math.random() * 0.3);

  //       control1OffsetX = Math.cos(angle1) * newOffsetDistance1;
  //       control1OffsetY = Math.sin(angle1) * newOffsetDistance1;
  //       control2OffsetX = Math.cos(angle2) * newOffsetDistance2;
  //       control2OffsetY = Math.sin(angle2) * newOffsetDistance2;

  //       controlPoints = [
  //         { x: segment1X + control1OffsetX, y: segment1Y + control1OffsetY },
  //         { x: segment2X + control2OffsetX, y: segment2Y + control2OffsetY },
  //       ];

  //       cubicCurveLength = calculateCubicCurveLength();
  //       attempts++;
  //     }

  //     // 如果S曲线仍然长度不足，在第一个控制点前插入backPoint
  //     if (cubicCurveLength < minCurveLength) {
  //       console.log(
  //         `三次S曲线长度不足 ${cubicCurveLength.toFixed(
  //           2
  //         )}px，添加backPoint控制点`
  //       );

  //       const backPointOffsetX = (Math.random() - 0.5) * 30;
  //       const backPointOffsetY = (Math.random() - 0.5) * 30;

  //       // 在现有两个控制点之前插入backPoint控制点
  //       controlPoints.unshift({
  //         x: backPoint.x + backPointOffsetX,
  //         y: backPoint.y + backPointOffsetY,
  //       });

  //       console.log(
  //         `S曲线添加backPoint控制点: (${backPoint.x + backPointOffsetX}, ${
  //           backPoint.y + backPointOffsetY
  //         })`
  //       );
  //       console.log(`现在有 ${controlPoints.length} 个控制点`);
  //     }
  //   }

  //   // 更新贝塞尔曲线函数以支持更多控制点
  //   const getBezierPoint: (t: number) => { x: number; y: number } = (
  //     t: number
  //   ) => {
  //     if (controlPoints.length === 1) {
  //       // 二次贝塞尔曲线
  //       const oneMinusT = 1 - t;
  //       const x =
  //         oneMinusT * oneMinusT * startX +
  //         2 * oneMinusT * t * controlPoints[0].x +
  //         t * t * endX;
  //       const y =
  //         oneMinusT * oneMinusT * startY +
  //         2 * oneMinusT * t * controlPoints[0].y +
  //         t * t * endY;
  //       return { x, y };
  //     } else if (controlPoints.length === 2) {
  //       // 三次贝塞尔曲线
  //       const oneMinusT = 1 - t;
  //       const x =
  //         oneMinusT * oneMinusT * oneMinusT * startX +
  //         3 * oneMinusT * oneMinusT * t * controlPoints[0].x +
  //         3 * oneMinusT * t * t * controlPoints[1].x +
  //         t * t * t * endX;
  //       const y =
  //         oneMinusT * oneMinusT * oneMinusT * startY +
  //         3 * oneMinusT * oneMinusT * t * controlPoints[0].y +
  //         3 * oneMinusT * t * t * controlPoints[1].y +
  //         t * t * t * endY;
  //       return { x, y };
  //     } else if (controlPoints.length >= 3) {
  //       // 四点或更多点的贝塞尔曲线，使用德卡斯特里奥算法
  //       // 为了简化，这里使用三次贝塞尔曲线处理前三个控制点
  //       const oneMinusT = 1 - t;
  //       const x =
  //         oneMinusT * oneMinusT * oneMinusT * startX +
  //         3 * oneMinusT * oneMinusT * t * controlPoints[0].x +
  //         3 * oneMinusT * t * t * controlPoints[1].x +
  //         t * t * t * controlPoints[2].x;
  //       const y =
  //         oneMinusT * oneMinusT * oneMinusT * startY +
  //         3 * oneMinusT * oneMinusT * t * controlPoints[0].y +
  //         3 * oneMinusT * t * t * controlPoints[1].y +
  //         t * t * t * controlPoints[2].y;

  //       // 如果有第四个点（终点），在后半段混合到终点
  //       if (t > 0.5) {
  //         const blendT = (t - 0.5) * 2; // 0-1
  //         const blendX = x + blendT * (endX - controlPoints[2].x);
  //         const blendY = y + blendT * (endY - controlPoints[2].y);
  //         return { x: blendX, y: blendY };
  //       }

  //       return { x, y };
  //     }

  //     // 默认返回直线
  //     return {
  //       x: startX + t * (endX - startX),
  //       y: startY + t * (endY - startY),
  //     };
  //   };

  //   // 添加轻微的运动时抖动（可选）
  //   const originalGetBezierPoint = getBezierPoint;
  //   const getBezierPointWithShake = (t: number) => {
  //     const basePoint = originalGetBezierPoint(t);

  //     // 添加轻微的随机抖动，模拟魔法能量的不稳定性
  //     const shakeIntensity = 2; // 抖动强度（像素）
  //     const shakeX =
  //       (Math.random() - 0.5) * shakeIntensity * Math.sin(t * Math.PI * 4);
  //     const shakeY =
  //       (Math.random() - 0.5) * shakeIntensity * Math.cos(t * Math.PI * 3);

  //     return {
  //       x: basePoint.x + shakeX,
  //       y: basePoint.y + shakeY,
  //     };
  //   };

  //   // 计算贝塞尔曲线的实际长度
  //   const calculateCurveLength = () => {
  //     let length = 0;
  //     const segments = 100;
  //     let prevPoint = getBezierPoint(0);

  //     for (let i = 1; i <= segments; i++) {
  //       const currentPoint = getBezierPoint(i / segments);
  //       const segmentLength = Math.sqrt(
  //         (currentPoint.x - prevPoint.x) ** 2 +
  //           (currentPoint.y - prevPoint.y) ** 2
  //       );
  //       length += segmentLength;
  //       prevPoint = currentPoint;
  //     }
  //     return length;
  //   };

  //   const actualCurveLength = calculateCurveLength();
  //   const curveTypeName = controlPoints.length === 1 ? "二次曲线" : "三次S曲线";

  //   console.log(
  //     `${curveTypeName} 贝塞尔曲线长度: ${actualCurveLength.toFixed(
  //       2
  //     )}px, 直线距离: ${directDistance.toFixed(2)}px`
  //   );

  //   const promise = new Promise<void>((resolve) => {
  //     let t = 0; // 贝塞尔曲线参数，从0到1
  //     let currentDistance = 0; // 当前已移动的实际距离

  //     // 速度参数（像素/帧）
  //     const initialSpeed = 2; // 初始速度：2像素/帧
  //     const maxSpeed = 10; // 最大速度：8像素/帧
  //     const acceleration = 0.7; // 加速度：0.1像素/帧²
  //     let currentSpeed = initialSpeed;

  //     // 预计算距离映射表，用于将实际距离转换为贝塞尔参数
  //     const distanceToTMap: number[] = [];
  //     const segments = 1000; // 高精度采样
  //     let totalSampledDistance = 0;
  //     let prevPoint = getBezierPoint(0);

  //     distanceToTMap.push(0); // t=0时距离为0

  //     for (let i = 1; i <= segments; i++) {
  //       const currentT = i / segments;
  //       const currentPoint = getBezierPoint(currentT);
  //       const segmentLength = Math.sqrt(
  //         (currentPoint.x - prevPoint.x) ** 2 +
  //           (currentPoint.y - prevPoint.y) ** 2
  //       );
  //       totalSampledDistance += segmentLength;
  //       distanceToTMap.push(totalSampledDistance);
  //       prevPoint = currentPoint;
  //     }

  //     // 根据实际距离查找对应的t值
  //     const getTimeFromDistance = (distance: number): number => {
  //       if (distance <= 0) return 0;
  //       if (distance >= totalSampledDistance) return 1;

  //       // 二分查找找到距离对应的索引
  //       let left = 0;
  //       let right = distanceToTMap.length - 1;

  //       while (left < right) {
  //         const mid = Math.floor((left + right) / 2);
  //         if (distanceToTMap[mid] < distance) {
  //           left = mid + 1;
  //         } else {
  //           right = mid;
  //         }
  //       }

  //       // 线性插值获得精确的t值
  //       if (left === 0) return 0;

  //       const prevDistance = distanceToTMap[left - 1];
  //       const nextDistance = distanceToTMap[left];
  //       const ratio = (distance - prevDistance) / (nextDistance - prevDistance);

  //       return (left - 1 + ratio) / segments;
  //     };

  //     console.log(
  //       `曲线总长度: ${totalSampledDistance.toFixed(2)}px, 预计时间: ${(
  //         totalSampledDistance /
  //         ((initialSpeed + maxSpeed) / 2)
  //       ).toFixed(1)}帧`
  //     );

  //     const moveFunc = () => {
  //       // 更新速度（加速效果）
  //       currentSpeed = Math.min(currentSpeed + acceleration, maxSpeed);

  //       // 更新当前距离
  //       currentDistance += currentSpeed;

  //       // 根据当前距离计算贝塞尔参数t
  //       t = getTimeFromDistance(currentDistance);

  //       // 获取当前在贝塞尔曲线上的位置
  //       const currentPos = getBezierPoint(t);

  //       // 获取下一个位置用于计算旋转角度
  //       const nextT = Math.min(getTimeFromDistance(currentDistance + 5), 1);
  //       const nextPos = getBezierPoint(nextT);

  //       // 更新粒子位置
  //       lightParticle.x = currentPos.x;
  //       lightParticle.y = currentPos.y;

  //       // 计算并设置旋转角度（粒子朝向运动方向）
  //       const directionX = nextPos.x - currentPos.x;
  //       const directionY = nextPos.y - currentPos.y;
  //       lightParticle.rotation =
  //         Math.atan2(directionY, directionX) + Math.PI / 2;

  //       // 更新时间和渲染
  //       lightParticle.palyTime += 1;
  //       lightParticle.renderFunc();

  //       // 调试信息
  //       console.log(
  //         `距离: ${currentDistance.toFixed(1)}px, 速度: ${currentSpeed.toFixed(
  //           2
  //         )}px/帧, t: ${t.toFixed(3)}`
  //       );

  //       // 检查是否到达终点
  //       if (currentDistance >= totalSampledDistance || t >= 1) {
  //         if (lightParticle.instance?.parent) {
  //           lightParticle.clearTrailParticles(); // 清理拖尾粒子
  //           lightParticle.instance.parent.removeChild(lightParticle.instance);
  //           lightParticle.instance?.destroy();
  //           resolve();
  //         }
  //         return;
  //       }

  //       requestAnimationFrame(moveFunc);
  //     };

  //     moveFunc();
  //   });

  //   return promise;
  // };

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
      const startX = unit.x + 32;
      const startY = unit.y + 32;
      const endX = gridX * tileSize + 32;
      const endY = gridY * tileSize + 32;

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
