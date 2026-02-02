import type { CreatureAttack } from "@/core/units/Creature";
import type { Unit } from "../units/Unit";
import * as PIXI from "pixi.js";
import { TiledMap } from "../MapClass";
import { takeDamage } from "../system/DamageSystem";

import { getContainer, getLayers } from "@/stores/container";
import { BattleEvenetSystem } from "../system/BattleEventSystem";
import { createDamageAnim } from "../anim/DamageAnim";
import { createMissOrHitAnimation } from "../anim/MissOrHitAnim";
import { playAttackAnim } from "../anim/PlayAttackAnim";
import { checkHit, getDamage } from "../system/AttackSystem";
import { tileSize } from "../envSetting";
import { UnitSystem } from "../system/UnitSystem";
import { golbalSetting } from "../golbalSetting";

export function playerSelectAttackMovement(
  e: PIXI.FederatedPointerEvent,
  unit: Unit,
  attack: CreatureAttack,
  mapPassiable: TiledMap | null,
) {
  e.stopPropagation();
  const pos = e.data.global;
  // 计算点击位置相对于动画精灵的偏移
  const container = getContainer();
  if (!container) {
    console.error("container 不存在");
    return Promise.resolve({});
  }
  const offsetX = pos.x - container.x;
  const offsetY = pos.y - container.y;
  const targetX = Math.floor(offsetX / 64);
  const targetY = Math.floor(offsetY / 64);
  return attackMovementToXY(targetX, targetY, unit, attack, mapPassiable);
}
export async function attackMovementToUnit(
  targetUnit: Unit | null,
  attacker: Unit,
  attack: CreatureAttack,
  mapPassiable: TiledMap | null,
  targetX: number = 0,
  targetY: number = 0,
) {
  const unit = attacker;
  unit.state = "attack";
  const spriteUnit = unit.animUnit;
  if (!spriteUnit) {
    console.error("动画精灵不存在");
    return {};
  }
  const container = getContainer();
  if (!container) {
    console.error("container 不存在");
    return {};
  }
  const lineLayer = getLayers().lineLayer;
  // 检查目标位置是否在地图范围内
  if (mapPassiable && mapPassiable.sprites) {
    const target = targetUnit;
    // 执行攻击逻辑
    // await BattleEvenetSystem.getInstance().handleEvent(
    //   "attackEvent",
    //   unit,
    //   target,
    //   attack
    // );
    console.log(target);
    if (unit.state === "dead") {
      console.warn("单位已死亡，无法执行攻击");
      return { cancel: true };
    }
    // if (target) alert("attack " + target?.name);
    let hitFlag = false;
    let damage = 0;
    if (target) {
      const hitCheckResult = await checkHit(unit, target, attack);
      await BattleEvenetSystem.getInstance().handleEvent(
        "hitCheckEvent",
        unit,
        target,
        hitCheckResult,
      );
      if (attacker.state === "dead") {
        console.warn("单位已死亡，无法执行攻击");
        return {};
      }
      hitFlag = hitCheckResult.hit;
      if (container && lineLayer) {
        await createMissOrHitAnimation(target, hitFlag);
      }
      if (hitFlag) {
        damage = await getDamage(unit, target, attack);
        if (container && lineLayer) {
          createDamageAnim(damage.toString(), target);
        }
      }
    }
    //播放攻击动画
    if (target) {
      targetX = Math.floor(target.x / tileSize);
      targetY = Math.floor(target.y / tileSize);
    }
    if (attack.throwItem) {
      await playThrowItemAnim(unit, targetX, targetY, attack.throwItem);
    }
    if (attack.anim!== "none") {
      await playAttackAnim(unit, targetX, targetY);
    }
  

    //结算
    if (target) {
      if (hitFlag) {
        //  alert("攻击命中!");
        await takeDamage(damage, target);
      } else {
        // alert("攻击未命中!");
      }
    }
    unit.state = "idle";
    return {
      hit: hitFlag,
      damage: damage,
      targetX: targetX,
      targetY: targetY,
      beAttack: target,
    };
  }
}
export function attackMovementToXY(
  targetX: number,
  targetY: number,
  attacker: Unit,
  attack: CreatureAttack,
  mapPassiable: TiledMap | null,
) {
  const unit = attacker;
  unit.state = "attack";
  const spriteUnit = unit.animUnit;
  if (!spriteUnit) {
    console.error("动画精灵不存在");
    return Promise.resolve({});
  }
  // 检查目标位置是否在地图范围内
  const targetUnit = UnitSystem.getInstance().findUnitByGridxy(
    targetX,
    targetY,
  );
  // 执行攻击逻辑
  // if (targetUnit){
  return attackMovementToUnit(
    targetUnit,
    unit,
    attack,
    mapPassiable,
    targetX,
    targetY,
  );
  // }
  unit.state = "idle";
  return Promise.resolve({});
}

async function playThrowItemAnim(
  unit: Unit,
  targetX: number,
  targetY: number,
  throwItem: string,
): Promise<void> {
  const container = getContainer();
  if (!container) {
    console.error("container 不存在");
    return;
  }
  if (!golbalSetting.spriteContainer) {
    console.error("spriteContainer 不存在");
    return;
  }

  const startX = Math.floor(unit.x / tileSize) * tileSize + tileSize / 2;
  const startY = Math.floor(unit.y / tileSize) * tileSize + tileSize / 2;
  const endX = targetX * tileSize + tileSize / 2;
  const endY = targetY * tileSize + tileSize / 2;

  // 创建投掷物精灵
  const throwItemSprite = await PIXI.Assets.load(throwItem);
  const throwSprite = new PIXI.Sprite(throwItemSprite);

  console.log("throwItem", throwItem, throwSprite, startX, startY);
  throwSprite.anchor.set(0.5);
  throwSprite.x = startX;
  throwSprite.y = startY;

  const layers = getLayers();
  const animLayer = layers.spriteLayer;

  golbalSetting.spriteContainer.addChild(throwSprite);
  animLayer?.attach(throwSprite);
  // 计算飞行时间和距离
  const distance = Math.sqrt(
    Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2),
  );
  const baseSpeed = 1; // px / ms
  const duration = Math.max(300, distance / baseSpeed); // 根据距离调整持续时间，至少300ms

  return new Promise<void>((resolve) => {
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // 加速运动 (EaseInQuad: t * t)
      const easedProgress = progress * progress;

      const currentX = startX + (endX - startX) * easedProgress;
      const currentY = startY + (endY - startY) * easedProgress;

      throwSprite.x = currentX;
      throwSprite.y = currentY;

      // 添加旋转效果
      throwSprite.rotation = progress * Math.PI * 4;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        if (golbalSetting.spriteContainer) {
          golbalSetting.spriteContainer.removeChild(throwSprite);
        }
        throwSprite.destroy();
        resolve();
      }
    };

    requestAnimationFrame(animate);
  });
}
