import type { Unit } from "../units/Unit";
import { tileSize } from "../envSetting";

type TweenStep = (t: number) => void;

function runTween(durationMs: number, step: TweenStep): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      step(t);
      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        resolve();
      }
    };
    requestAnimationFrame(tick);
  });
}

export async function playAttackAnim(
  unit: Unit,
  targetX: number,
  targetY: number
) {
  let direction = unit.direction;
  const spriteUnitX = Math.floor(unit.x / tileSize);
  const spriteUnitY = Math.floor(unit.y / tileSize);
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
  // if (unit.animUnit) {
  //   unit.animUnit.state = "slash";
  // }
  if (unit.animUnit) {
    unit.animUnit.anims[unit.animUnit.state]?.stop();
  }
  const framesEndPromise = new Promise<void>((resolve) => {
    if (unit.animUnit) {
      unit.animUnit.animationCallback = resolve;
    } else {
      resolve();
    }
  });
  let animEndResolve: (value: void | PromiseLike<void>) => void;
  const animEndPromise = new Promise<void>((resolve) => {
    animEndResolve = resolve;
  });
  const originX = unit.x;
  const originY = unit.y;
  const setUnitPosition = (x: number, y: number) => {
    unit.x = x;
    unit.y = y;
    if (unit.animUnit) {
      unit.animUnit.x = x;
      unit.animUnit.y = y;
    }
  };
  const dirVector = (() => {
    switch (direction) {
      case 0:
        return { x: 1, y: 0 };
      case 1:
        return { x: -1, y: 0 };
      case 2:
        return { x: 0, y: 1 };
      case 3:
        return { x: 0, y: -1 };
      default:
        return { x: 0, y: 0 };
    }
  })();

  const shakeAxis = direction === 0 || direction === 1 ? "y" : "x";
  const shakeAmplitude = Math.max(2, Math.round(tileSize * 0.05));
  const shakePromise = runTween(120, (t) => {
    const offset = Math.sin(t * Math.PI * 6) * shakeAmplitude;
    if (shakeAxis === "x") {
      setUnitPosition(originX + offset, originY);
    } else {
      setUnitPosition(originX, originY + offset);
    }
  });

  const lungeDistance = Math.max(8, Math.round(tileSize * 0.2));
  const lungePromise = shakePromise.then(async () => {
    await runTween(80, (t) => {
      setUnitPosition(
        originX + dirVector.x * lungeDistance * t,
        originY + dirVector.y * lungeDistance * t
      );
    });
    await runTween(80, (t) => {
      const factor = 1 - t;
      setUnitPosition(
        originX + dirVector.x * lungeDistance * factor,
        originY + dirVector.y * lungeDistance * factor
      );
    });
    setUnitPosition(originX, originY);
  });

  Promise.all([lungePromise]).then(() => {
    if (unit.animUnit) {
      unit.animUnit.anims[unit.animUnit.state]?.stop();
      setTimeout(() => {
        if (unit.animUnit && unit.animUnit.anims["walk"]) {
          unit.animUnit.state = "walk";
                unit.animUnit.anims[unit.animUnit.state]?.play();
          animEndResolve();
        }
      }, 100);
    } else {
      animEndResolve();
    }
  });

  return animEndPromise;
}
