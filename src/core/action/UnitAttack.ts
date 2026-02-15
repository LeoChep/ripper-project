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
import { playThrowItemAnim } from "../anim/ThrowItemAnim";
import { checkHit, getDamage } from "../system/AttackSystem";
import { tileSize } from "../envSetting";
import { UnitSystem } from "../system/UnitSystem";
import { playAirBurst, playShootItemAnim } from "../anim/ShootItemAnim";
import { lookOn } from "../anim/LookOnAnim";

export function playerSelectAttackMovement(
  e: PIXI.FederatedPointerEvent,
  unit: Unit,
  attack: CreatureAttack,
  mapPassiable: TiledMap | null
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
  const targetX = Math.floor(offsetX / tileSize);
  const targetY = Math.floor(offsetY / tileSize);
  return attackMovementToXY(targetX, targetY, unit, attack, mapPassiable);
}
export async function attackMovementToUnit(
  targetUnit: Unit | null,
  attacker: Unit,
  attack: CreatureAttack,
  mapPassiable: TiledMap | null,
  targetX: number = 0,
  targetY: number = 0
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
        hitCheckResult
      );
      if (attacker.state === "dead") {
        console.warn("单位已死亡，无法执行攻击");
        return {};
      }
      hitFlag = hitCheckResult.hit;
      if (!attack.isRanged) {
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
    }
    //播放攻击动画
    if (target) {
      targetX = Math.floor(target.x / tileSize);
      targetY = Math.floor(target.y / tileSize);
    }
    if (attack.anim !== "none") {
      if (!attack.isRanged) {
        await playAttackAnim(unit, targetX, targetY);
      }
    }
    if (attack.throwItem) {
      await playThrowItemAnim(unit, targetX, targetY, attack.throwItem);
    }
    if (attack.shootItem) {
    
     
       await playAttackAnim(unit, targetX, targetY);
      
      // await new Promise((resolve) => setTimeout(resolve, 50));
      //  playAirBurst(
      //   unit.x + tileSize / 2,
      //   unit.y + tileSize / 2,
      //   targetX * tileSize,
      //   targetY * tileSize,
      //   getLayers().spriteLayer
      // );
      // await new Promise((resolve) => setTimeout(resolve, 150));
      if (target) {
        lookOn(target.x, target.y);
      }
      await playShootItemAnim(unit, targetX, targetY, attack.shootItem);
   

    }
    if (attack.isRanged && target) {
      lookOn(target.x, target.y);
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
  mapPassiable: TiledMap | null
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
    targetY
  );
  // 执行攻击逻辑
  console.log('执行攻击逻辑，目标',targetUnit);
  // if (targetUnit){
  return attackMovementToUnit(
    targetUnit,
    unit,
    attack,
    mapPassiable,
    targetX,
    targetY
  );
  // }
  unit.state = "idle";
  return Promise.resolve({});
}
