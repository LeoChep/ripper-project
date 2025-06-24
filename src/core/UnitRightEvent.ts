import * as PIXI from "pixi.js";
import type { TiledMap } from "./MapClass";
let oldselectionBox: PIXI.Graphics | null = null;
export const UnitRightEvent = (
  event: PIXI.FederatedPointerEvent,
  anim: PIXI.AnimatedSprite,
  container: PIXI.Container<PIXI.ContainerChild>,
  selectLayer: PIXI.IRenderLayer,
  mapPassiable: TiledMap | null
) => {
  // alert('click');
  // 如果之前有选择框，先移除它
  console.log(oldselectionBox);
  event.stopPropagation();
  if (oldselectionBox) {
    container.removeChild(oldselectionBox);
    oldselectionBox = null;
    // alert("取消选择");
  }
  const selectionBox = new PIXI.Graphics();
  const boxWidth = 40;
  const boxHeight = 80;

  let boxX = anim.x + anim.width + 10;
  if (boxX + boxWidth > container.width) {
    // 如果选择框超出右边界，则调整位置
    boxX = anim.x - boxWidth - 10;
  }
  let boxY = anim.y - boxHeight / 2 + anim.height / 2;
  if (boxY < 0) {
    // 如果选择框超出上边界，则调整位置
    boxY = 0;
  } else if (boxY + boxHeight > container.height) {
    // 如果选择框超出下边界，则调整位置
    boxY = container.height - boxHeight;
  }
  // 绘制竖排选择框背景
  selectionBox.x = boxX;
  selectionBox.y = boxY;

  selectionBox.roundRect(0, 0, boxWidth, boxHeight, 12);
  selectionBox.fill({ color: 0x333366, alpha: 0.9 });

  // 示例：添加三个选项
  const options = ["攻击", "移动", "取消"];
  options.forEach((text, i) => {
    const label = new PIXI.Text({
      text,
      style: {
        fontFamily: "Arial",
        fontSize: 12,
        fill: 0xffffff,
        align: "center",
      },
    });
    label.x = boxWidth / 2 - label.width / 2;
    label.y = 8 + i * 20;
    label.eventMode = "static";
    label.cursor = "pointer";
    label.on("pointertap", () => {
      alert(`选择了: ${text}`);
      if (text == "移动") {
        moveSelect(anim, container, mapPassiable);
      }
      container.removeChild(selectionBox);
    });

    selectionBox.addChild(label);
  });

  container.addChild(selectionBox);
  selectLayer.attach(selectionBox);
  oldselectionBox = selectionBox;
  container.once("rightdown", () => {
    if (oldselectionBox) {
      container.removeChild(oldselectionBox);
      oldselectionBox = null;
    }
  });

  // alert("取消选择");
};
export const moveSelect = (
  anim: PIXI.AnimatedSprite,
  container: PIXI.Container<PIXI.ContainerChild>,
  mapPassiable: TiledMap | null
) => {
  //显示红色的可移动范围
  const range = 6;
  const tileSize = 64;
  const graphics = new PIXI.Graphics();
  graphics.alpha = 0.4;
  graphics.zIndex = 1000;

  const centerX = anim.x + anim.width;
  const centerY = anim.y + anim.height;
  //使用切比雪夫距离绘制
  // 使用广度优先搜索(BFS)绘制可移动范围，并记录路径
  const visited = new Set<string>();
  const queue: { x: number; y: number; step: number }[] = [];
  const startX = Math.floor((centerX - tileSize) / tileSize);
  const startY = Math.floor((centerY - tileSize) / tileSize);

  // 用二维数组记录每个格子的前驱节点
  const path: { [key: string]: { x: number; y: number } | null } = {};

  queue.push({ x: startX, y: startY, step: 0 });
  visited.add(`${startX},${startY}`);
  path[`${startX},${startY}`] = null;

  while (queue.length > 0) {
    const { x, y, step } = queue.shift()!;
    if (step > range) continue;

    const drawX = x * tileSize;
    const drawY = y * tileSize;

    graphics.rect(drawX, drawY, tileSize, tileSize);
    graphics.fill({ color: 0xff0000 });
    // 八方向扩展
    const dirs = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
      { dx: 1, dy: 1 },
      { dx: -1, dy: -1 },
      { dx: 1, dy: -1 },
      { dx: -1, dy: 1 },
    ];
    for (const dir of dirs) {
      if (dir.dx*dir.dx + dir.dy*dir.dy > 1) {
        // 如果是对角线方向，检查是否是拐角
        if (dir.dx < 0 && dir.dy < 0) {
          // 左上角
          if (
            path[`${x - 1},${y}`] === undefined ||
            path[`${x},${y - 1}`] === undefined
          ) {
            continue; // 如果左或上不可通行，则跳过
          }
        }
        if (dir.dx > 0 && dir.dy < 0) {
          // 右上角
          if (
            path[`${x + 1},${y}`] === undefined ||
            path[`${x},${y - 1}`] === undefined
          ) {
            continue; // 如果右或上不可通行，则跳过
          }
        }
        if (dir.dx < 0 && dir.dy > 0) {
          // 左下角
          if (
            path[`${x - 1},${y}`] === undefined ||
            path[`${x},${y + 1}`] === undefined
          ) {
            continue; // 如果左或下不可通行，则跳过
          }
        }
        if (dir.dx > 0 && dir.dy > 0) {
          // 右下角
          if (
            path[`${x + 1},${y}`] === undefined ||
            path[`${x},${y + 1}`] === undefined
          ) {
            continue; // 如果右或下不可通行，则跳过
          }
        }
        
      }
      const nx = x + dir.dx;
      const ny = y + dir.dy;
      const key = `${nx},${ny}`;
      const passiable = checkPassiable(
        x * tileSize,
        y * tileSize,
        nx * tileSize,
        ny * tileSize,
        mapPassiable
      );
      if (passiable) {
        if (!visited.has(key)) {
          queue.push({ x: nx, y: ny, step: step + 1 });
          visited.add(key);
          path[key] = { x, y }; // 记录前驱
        }
      }
    }
  }
  // path 是一个以 "x,y" 为 key 的对象，记录每个格子的前驱节点
  graphics.eventMode = "static";

  container.addChild(graphics);

  // 点击其他地方移除移动范围
  const removeGraphics = () => {
    if (graphics.parent) {
      graphics.parent.removeChild(graphics);
    }
    container.off("pointerdown", removeGraphics);
  };
  graphics.on("pointerdown", (e) => {
    e.stopPropagation();
    removeGraphics();

    moveMovement(e, anim, container, path);
  });
  container.on("pointerdown", removeGraphics);
};

export const moveMovement = async (
  event: PIXI.FederatedPointerEvent,
  anim: PIXI.AnimatedSprite,
  container: PIXI.Container<PIXI.ContainerChild>,
  path: { [key: string]: { x: number; y: number } | null }
) => {
  const tileSize = 64; // 格子大小
  //计算出动画精灵所在的格子
  const centerX = Math.floor(anim.x / tileSize);
  const centerY = Math.floor(anim.y / tileSize);
  console.log(`动画精灵所在格子: (${centerX}, ${centerY})`);
  // 获取点击位置
  const pos = event.data.global;
  // 计算点击位置相对于动画精灵的偏移
  const offsetX = pos.x - container.x;
  const offsetY = pos.y - container.y;
  // 计算点击位置对应的格子坐标
  const tileX = Math.floor(offsetX / tileSize);
  const tileY = Math.floor(offsetY / tileSize);
  console.log(`点击位置所在格子: (${tileX}, ${tileY})`);
  let pathCuror = path[`${tileX},${tileY}`];
  console.log(pathCuror);
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
  for (const step of pathWay) {
    // 执行移动
    await girdMoveMovement(step.x, step.y, anim, tileSize);
  }
  // girdMoveMovement(tileX, tileY, anim, tileSize);
};
const girdMoveMovement = (
  tileX: number,
  tileY: number,
  anim: PIXI.AnimatedSprite,
  tileSize: number
) => {
  // 计算实际的移动位置
  const targetX = tileX * tileSize;
  const targetY = tileY * tileSize;
  // console.log(`目标位置: (${targetX}, ${targetY})`);
  // 设置动画精灵的新位置
  const moveFunc = () => {
    console.log(`目标位置: (${targetX}, ${targetY})`);
    // 如果精灵已经在目标
    if (anim.x !== targetX || anim.y !== targetY) {
      // 计算移动步长
      const dx = targetX - anim.x;
      const dy = targetY - anim.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const step = 64;
      const stepX =
        distance === 0 ? 0 : (dx / distance) * Math.min(step, Math.abs(dx));
      const stepY =
        distance === 0 ? 0 : (dy / distance) * Math.min(step, Math.abs(dy));
      // 更新动画精灵的位置
      anim.x += stepX;
      anim.y += stepY;
      // 如果接近目标位置，则直接设置到目标位置
      if (Math.abs(anim.x - targetX) < 1 && Math.abs(anim.y - targetY) < 1) {
        anim.x = targetX;
        anim.y = targetY;
        // 停止动画更新
      }
    }
  };
  const girdMovePromise = new Promise<void>((resolve) => {
    const timer = setInterval(() => {
      moveFunc();
      if (Math.abs(anim.x - targetX) < 1 && Math.abs(anim.y - targetY) < 1) {
        clearInterval(timer);
        resolve();
      }
    }, 160);
  });
  return girdMovePromise;
};
const checkPassiable = (
  prex: number,
  prey: number,
  x: number,
  y: number,
  mapPassiable: TiledMap | null
) => {
  let passiable = true;
  if (mapPassiable) {
    const edges = mapPassiable.edges;
    if (edges) {
      // console.log(edges)
      // 检查是否有对象在指定位置
      // 遍历对象组中的所有对象
      edges.forEach((edge) => {
        let testx = x;
        let testy = y;

        // 获取两个格子的四个顶点
        const pointsA = [
             { x: prex+32, y: prey+32 },
          { x: prex, y: prey },
          { x: prex + 64, y: prey },
          { x: prex + 64, y: prey + 64 },
          { x: prex, y: prey + 64 },
        ];
        const pointsB = [
            { x: testx+32, y: testy+32 },
          { x: testx, y: testy },
          { x: testx + 64, y: testy },
          { x: testx + 64, y: testy + 64 },
          { x: testx, y: testy + 64 },
        ];
        // 检查所有顶点对的连线
        let intersectCount = 0;
        for (let i = 0; i < 1; i++) {
          if (
            segmentsIntersect(
              pointsA[i].x,
              pointsA[i].y,
              pointsB[i].x,
              pointsB[i].y,
              edge.x1,
              edge.y1,
              edge.x2,
              edge.y2
            )
          ) {
            intersectCount++;
        
          }
        }
          if (intersectCount >= 1) {
              passiable = false;
              //终止遍历
            }
      });
    }
  }

  return passiable;
};
const segmentsIntersect = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  x4: number,
  y4: number
) => {
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (denom === 0) {
    return false; // 平行或重合
  }
  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
  return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1; // 判断是否在有效范围内
};
