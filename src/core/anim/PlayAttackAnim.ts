import type { Unit } from "../units/Unit";

export async function playAttackAnim(unit: Unit, targetX: number, targetY: number) {
  let direction = unit.direction;
  const spriteUnitX = Math.floor(unit.x / 64); // 假设动画
  const spriteUnitY = Math.floor(unit.y / 64); // 假设动画
  const dx = targetX - spriteUnitX;
  const dy = targetY - spriteUnitY;
  //设置朝向
  if (Math.abs(dx) >= Math.abs(dy) && Math.abs(dx) > 0) {
    // 水平移动
    direction = dx > 0 ? 0 : 1; // 0向右, 1向左
  } else if (Math.abs(dy) > Math.abs(dx)) {
    // 垂直移动
    direction = dy > 0 ? 2 : 3; // 2向下, 3向上
  }
  console.log(
    `单位 ${unit.name} 攻击方向: ${direction}，目标位置: (${targetX}, ${targetY}), dx: ${dx}, dy: ${dy}`
  );
  // 设置动画精灵的新位置
  unit.direction = direction;
  if (unit.animUnit) {
    unit.animUnit.state = "slash";
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
      // unit.animUnit.state = "walk"; // 恢复为行走状态
      setTimeout(() => {
        // 延时一段时间后恢复为行走状态
        if (unit.animUnit && unit.animUnit.anims["walk"]) {
          unit.animUnit.state = "walk"; // 恢复为行走状态
          animEndResolve();
        }
      }, 100); // 延时100毫秒
    }
  });

  return animEndPromise;
}