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
    await BattleEvenetSystem.getInstance().handleEvent(
      "attackEvent",
      unit,
      target,
      attack
    );
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
      if (container && lineLayer) {
        await createMissOrHitAnimation(target, hitFlag);
      }
      if (hitFlag) {
        damage = await getDamage(unit, target, attack);
        if (container && lineLayer) {
          createDamageAnim(
            damage.toString(),
            target
          );
        }
      }
    }
    //播放攻击动画
    if (target) {
      targetX = Math.floor(target.x / tileSize) 
      targetY = Math.floor(target.y / tileSize);
    }
    await playAttackAnim(unit, targetX, targetY);

    //结算
    if (target) {
      if (hitFlag) {
        //  alert("攻击命中!");
        await takeDamage(damage, target, container);
      } else {
        // alert("攻击未命中!");
      }
    }
    unit.state = "idle";
    return { hit: hitFlag, damage: damage, targetX: targetX, targetY: targetY,beAttack: target };
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
  if (mapPassiable && mapPassiable.sprites) {
    const target = mapPassiable.sprites.find((sprite) => {
      if (sprite.state === "dead") {
        return false; // 如果单位已死亡，则不考虑
      }
      const spriteX = Math.floor(sprite.x / 64);
      const spriteY = Math.floor(sprite.y / 64);
      const inrange = spriteX === targetX && spriteY === targetY;
      console.log(
        `检查目标位置: (${spriteX}, ${spriteY}) 是否在攻击范围内: (${targetX}, ${targetY}) - 结果: ${inrange}`
      );
      // 检查
      return inrange;
    });
    // 执行攻击逻辑
    return attackMovementToUnit(
      target,
      unit,
      attack,
      mapPassiable,
      targetX,
      targetY
    );
  }
  return Promise.resolve({});
}



