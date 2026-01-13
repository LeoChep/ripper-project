import type { Container } from "pixi.js";
import { Unit } from "../units/Unit";
import { removeFromInitiativeSheet } from "./InitiativeSystem";
import { golbalSetting } from "../golbalSetting";

export async function takeDamage(damage: number, unit: Unit) {
  
  if (unit.creature && typeof unit.creature.hp === "number") {
    unit.creature.hp -= damage;
    if (unit.creature.hp <= 0) {
      await takeDeath(unit);
    }
  }
}

async function takeDeath(unit: Unit) {
  unit.state = "dead"; // 设置单位状态为死亡
  await playDeathAnim(unit);
  removeFromInitiativeSheet(unit);
}

function playDeathAnim(unit: Unit) {
  unit.direction = 2;
  if (unit.animUnit) {
    unit.animUnit.state = "hurt";
  }
  const framesEndPromise = new Promise<void>((resolve) => {
    if (unit.animUnit) {
      unit.animUnit.animationCallback = resolve;
    }
  });
  let animEndResolve: (value: void | PromiseLike<void>) => void;
  const animEndPromise = new Promise<void>((resolve) => {
    animEndResolve = resolve;
  });
  framesEndPromise.then(() => {
    if (unit.animUnit) {
      unit.animUnit.anims[unit.animUnit.state]?.stop();
      unit.animUnit.eventMode='none'
      setTimeout(() => {
        // 延时一段时间后删除
        if (unit.animUnit) {
          if (unit.animUnit.parent) {
            unit.animUnit.parent.removeChild(unit.animUnit);
          }
        }
        //
        animEndResolve();
      }, 100); // 延时100毫秒
    }
  });
  return animEndPromise;
}
