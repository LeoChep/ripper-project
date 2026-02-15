import { walk } from "vue/compiler-sfc";
import { golbalSetting } from "../golbalSetting";
import type { WalkStateMachine } from "../stateMachine/WalkStateMachine";
import type { Unit } from "../units/Unit";
import * as PIXI from "pixi.js";
import { tileSize } from "../envSetting";
export const playerSelectMovement = (
  event: PIXI.FederatedPointerEvent,
  unit: Unit,
  path: { [key: string]: { x: number; y: number; step: number } | null },
  result: any
) => {
  const pos = event.data.global;
  // 计算点击位置相对于动画精灵的偏移
  let gobalContainer = golbalSetting.rootContainer;
  if (!gobalContainer) {
    console.error("全局容器不存在");
    return;
  }
  const offsetX = pos.x - gobalContainer.x;
  const offsetY = pos.y - gobalContainer.y;
  const targetX = Math.floor(offsetX / tileSize);
  const targetY = Math.floor(offsetY / tileSize);
  if (!path[`${targetX},${targetY}`]) {
    console.warn("点击位置不在可移动范围内");
    return;
  }
  if (!unit.creature) {
    console.warn("单位没有生物属性，无法进行移动");
    return;
  }
  const walkMachine = unit.stateMachinePack.getMachine("walk") as WalkStateMachine;
  if (!walkMachine) {
    console.warn("单位没有行走状态机，无法进行移动");
    return;
  }
  let speed = unit.creature.speed;

  if (walkMachine.onDivideWalk) {
    speed = walkMachine.leastDivideSpeed;
  }
  result.least =
    speed - (path[`${targetX},${targetY}`]?.step ?? 0);
  return moveMovement(targetX, targetY, unit, path);
};
export const moveMovement =  (
  targetX: number,
  targetY: number,
  unit: Unit,
  path: { [key: string]: { x: number; y: number } | null }
) => {
  unit.state = "walk"; // 设置单位状态为行走

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
  console.log(`路径起点: (${centerX}, ${centerY})`);

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
  pathWay.shift();
  console.log(`完整路径: ${pathWay.map((p) => `(${p.x}, ${p.y})`).join(" -> ")}`);
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
  (unit.stateMachinePack.getMachine("walk") as WalkStateMachine)?.setPath?.(
    pathWay
  );
  (unit.stateMachinePack.getMachine("walk") as WalkStateMachine)?.setTarget?.(
    targetX,
    targetY
  );
  if (
    (unit.stateMachinePack.getMachine("walk") as WalkStateMachine)
      ?.onDivideWalk === false
  ) {
    (
      unit.stateMachinePack.getMachine("walk") as WalkStateMachine
    )?.clearHaveOpportunity();
  }
  const movePromise = new Promise<void>((resolve) => {
    (unit.stateMachinePack.getMachine("walk") as WalkStateMachine).callBack =
      resolve;
  });
  return movePromise;
};
