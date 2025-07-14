import type { Unit } from "../units/Unit";
import * as PIXI from "pixi.js";
export const playerSelectMovement = (
  event: PIXI.FederatedPointerEvent,
  unit: Unit,
  container: PIXI.Container<PIXI.ContainerChild>,
  path: { [key: string]: { x: number; y: number } | null }
) => {
  const pos = event.data.global;
  // 计算点击位置相对于动画精灵的偏移
  const offsetX = pos.x - container.x;
  const offsetY = pos.y - container.y;
  const targetX = Math.floor(offsetX / 64);
  const targetY = Math.floor(offsetY / 64);
  return moveMovement(targetX, targetY, unit, path);
};
export const moveMovement = async (
  targetX: number,
  targetY: number,
  unit: Unit,
  path: { [key: string]: { x: number; y: number } | null }
) => {
  const tileSize = 64; // 格子大小
  //计算出动画精灵所在的格子
  const spriteUnit = unit.animUnit;
  if (!spriteUnit) {
    console.error("动画精灵不存在");
    return;
  }
  const centerX = Math.floor(spriteUnit.x / tileSize);
  const centerY = Math.floor(spriteUnit.y / tileSize);
  console.log(`动画精灵所在格子: (${centerX}, ${centerY})`);
  // 获取点击位置

  // 计算点击位置对应的格子坐标
  const tileX = targetX;
  const tileY = targetY;
  console.log(`点击位置所在格子: (${tileX}, ${tileY})`);
  let pathCuror = path[`${tileX},${tileY}`];
  console.log(pathCuror);
  //获取路径
  const pathWay = [] as { x: number; y: number }[];
  while (pathCuror) {
    pathWay.push({ x: pathCuror.x, y: pathCuror.y });
    // 获取前驱节点
    const prevX = pathCuror.x;
    const prevY = pathCuror.y;
    console.log(`前驱节点: (${prevX}, ${prevY})`);
    // 更新前驱节点
    pathCuror = path[`${prevX},${prevY}`];
  }
  // 反转路径
  pathWay.reverse();
  pathWay.push({ x: tileX, y: tileY });
  //合并路径中的直线
  for (let i = pathWay.length - 2; i > 0; i--) {
    const prev = pathWay[i - 1];
    const curr = pathWay[i];
    const next = pathWay[i + 1];
    // 判断三点是否共线（即方向向量相同）
    if (
      (curr.x - prev.x) * (next.y - curr.y) ===
      (curr.y - prev.y) * (next.x - curr.x)
    ) {
      pathWay.splice(i, 1);
    }
  }
  // 执行移动
  for (const step of pathWay) {
    await girdMoveMovement(step.x, step.y, unit, tileSize);
  }
  const movePromise= new Promise<void>((resolve) => {
     setTimeout(() => {
      resolve()
  }, 500);
  })
  await movePromise;
};

export const girdMoveMovement = (
  tileX: number,
  tileY: number,
  unit: Unit,
  tileSize: number
) => {
  const spriteUnit = unit.animUnit;
  if (!spriteUnit) {
    console.error("动画精灵不存在");
    return;
  }
  // 更新状态
  spriteUnit.state = "walk";
  // 计算实际的移动位置
  const targetX = tileX * tileSize;
  const targetY = tileY * tileSize;
  // 设置动画精灵的新位置
  const dx = targetX - spriteUnit.x;
  const dy = targetY - spriteUnit.y;
  //转向
  let direction = unit.direction;
  //设置朝向
  if (Math.abs(dx) >= Math.abs(dy) && Math.abs(dx) > 0) {
    // 水平移动
    direction = dx > 0 ? 0 : 1; // 0向右, 1向左
  } else if (Math.abs(dy) > Math.abs(dx)) {
    // 垂直移动
    direction = dy > 0 ? 2 : 3; // 2向下, 3向上
  }

  unit.direction = direction;

  const moveFunc = () => {
    console.log(`目标位置: (${targetX}, ${targetY})`);
    // 如果精灵已经在目标
    if (spriteUnit.x !== targetX || spriteUnit.y !== targetY) {
      const dx = targetX - spriteUnit.x;
      const dy = targetY - spriteUnit.y;

      // 计算移动步长
      const distance = Math.sqrt(dx * dx + dy * dy);
      const step = 64;
      const stepX =
        distance === 0 ? 0 : (dx / distance) * Math.min(step, Math.abs(dx));
      const stepY =
        distance === 0 ? 0 : (dy / distance) * Math.min(step, Math.abs(dy));
      // 更新动画精灵的位置
      spriteUnit.x += stepX;
      spriteUnit.y += stepY;

      // 如果接近目标位置，则直接设置到目标位置
      if (
        Math.abs(spriteUnit.x - targetX) < 1 &&
        Math.abs(spriteUnit.y - targetY) < 1
      ) {
        spriteUnit.x = targetX;
        spriteUnit.y = targetY;
        // 停止动画更新
      }
      unit.x = spriteUnit.x;
      unit.y = spriteUnit.y;
    }
  };
  const girdMovePromise = new Promise<void>((resolve) => {
    const timer = setInterval(() => {
      moveFunc();
      if (
        Math.abs(spriteUnit.x - targetX) < 1 &&
        Math.abs(spriteUnit.y - targetY) < 1
      ) {
        clearInterval(timer);
        resolve();
      }
    }, 160);
  });
  return girdMovePromise;
};
