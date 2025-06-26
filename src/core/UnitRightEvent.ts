import * as PIXI from "pixi.js";
import type { TiledMap } from "./MapClass";
import type { UnitAnimSpirite } from "./UnitAnimSpirite";
import type { Unit } from "@/core/Unit";
let oldselectionBox: PIXI.Graphics | null = null;

export const UnitRightEvent = (
  event: PIXI.FederatedPointerEvent,
  unit: Unit,
  container: PIXI.Container<PIXI.ContainerChild>,
  selectLayer: PIXI.IRenderLayer,
  lineLayer: PIXI.IRenderLayer,
  mapPassiable: TiledMap | null
) => {
  event.stopPropagation();

  const spriteUnit = unit.animUnit;
  if (!spriteUnit) {
    console.error("动画精灵不存在");
    return;
  }
  // 如果之前有选择框，先移除它
  if (oldselectionBox) {
    container.removeChild(oldselectionBox);
    oldselectionBox = null;
  }

  const selectionBox = new PIXI.Graphics();
  const boxWidth = 40;
  const boxHeight = 80;

  let boxX = spriteUnit.x + spriteUnit.width + 10;
  if (boxX + boxWidth > container.width) {
    // 如果选择框超出右边界，则调整位置
    boxX = spriteUnit.x - boxWidth - 10;
  }
  let boxY = spriteUnit.y - boxHeight / 2 + spriteUnit.height / 2;
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
        moveSelect(unit, container, lineLayer, mapPassiable);
      }
      container.removeChild(selectionBox);
    });

    selectionBox.addChild(label);
  });
  //如果附近有门，那么增加开门选择
  console.log("mapPassiable", mapPassiable);
  if (mapPassiable && mapPassiable.doors) {
    const doors = mapPassiable.doors;

    if (doors.length > 0) {
      doors.forEach((door, i) => {
        // 检查门是否在选择框范围内
        const doorX = door.x1 + (door.x2 - door.x1) / 2;
        const doorY = door.y1 + (door.y2 - door.y1) / 2;
        if (distance(doorX, doorY, spriteUnit.x + 32, spriteUnit.y + 32) > 64) {
          return; // 如果门不在选择框范围内，则跳过
        }
        let text = "开门";
        if (door.useable === false) {
          text = "关门";
        }
        const label = new PIXI.Text({
          text: `${text} ${i + 1}`,
          style: {
            fontFamily: "Arial",
            fontSize: 12,
            fill: 0xffffff,
            align: "center",
          },
        });
        label.x = boxWidth / 2 - label.width / 2;
        label.y = 8 + (options.length + i) * 20;
        label.eventMode = "static";
        label.cursor = "pointer";
        label.on("pointertap", () => {
          alert(`选择了: ${text} ${i + 1}`);
          door.useable = !door.useable; // 设置边不再阻挡
          container.removeChild(selectionBox);
        });
        selectionBox.addChild(label);
      });
    }
  }
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
  unit: Unit,
  container: PIXI.Container<PIXI.ContainerChild>,
  lineLayer: PIXI.IRenderLayer,
  mapPassiable: TiledMap | null
) => {
  //显示红色的可移动范围
  const range = 6;
  const tileSize = 64;
  const graphics = new PIXI.Graphics();
  graphics.alpha = 0.4;
  graphics.zIndex = 1000;
  const spriteUnit = unit.animUnit;
  console.log("spriteUnits", unit);
  if (!spriteUnit) {
    return;
  }
  console.log(`动画精灵位置: (${spriteUnit.x}, ${spriteUnit.y})`);
  //
  const centerX = spriteUnit.x + spriteUnit.width;
  const centerY = spriteUnit.y + spriteUnit.height;
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
    if (step >= range) continue;

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
      // 检查是否是对角线方向
      if (dir.dx * dir.dx + dir.dy * dir.dy > 1) {
        // 如果是对角线方向，检查是否是拐角,拐角则不可对角线移动
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
  // 绘制可移动范围
  graphics.clear();
  if (path) {
    Object.keys(path).forEach((key) => {
      const [x, y] = key.split(",").map(Number);
      const drawX = x * tileSize;
      const drawY = y * tileSize;
      graphics.rect(drawX, drawY, tileSize, tileSize);
      graphics.fill({ color: 0xff0000 });
    });
  }
  // path 是一个以 "x,y" 为 key 的对象，记录每个格子的前驱节点
  graphics.eventMode = "static";

  container.addChild(graphics);
  lineLayer.attach(graphics);
  // 点击其他地方移除移动范围
  const removeGraphics = () => {
    if (graphics.parent) {
      graphics.parent.removeChild(graphics);
    }
    container.off("pointerup", removeGraphics);
  };
  let cannel = false;
  graphics.on("rightdown", (e) => {
    e.stopPropagation();
    console.log("rightdown");
    cannel = true;
    removeGraphics();
  });
  graphics.on("pointerup", (e) => {
    console.log("pointerup");
    e.stopPropagation();
    removeGraphics();
    if (cannel) {
      return;
    }
    moveMovement(e, unit, container, path);
  });

  container.on("pointerup", removeGraphics);
};

export const moveMovement = async (
  event: PIXI.FederatedPointerEvent,
  unit: Unit,
  container: PIXI.Container<PIXI.ContainerChild>,
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
    await girdMoveMovement(step.x, step.y, unit, tileSize);
  }
 
};

const girdMoveMovement = (
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
        if (edge.useable === false) {
          return; // 如果边不可用，则跳过
        }
        let testx = x;
        let testy = y;

        // 获取两个格子的四个顶点和中点
        const pointsA = [
          { x: prex + 32, y: prey + 32 },
          { x: prex, y: prey },
          { x: prex + 64, y: prey },
          { x: prex + 64, y: prey + 64 },
          { x: prex, y: prey + 64 },
        ];
        const pointsB = [
          { x: testx + 32, y: testy + 32 },
          { x: testx, y: testy },
          { x: testx + 64, y: testy },
          { x: testx + 64, y: testy + 64 },
          { x: testx, y: testy + 64 },
        ];
        // 检查所有中点的连线
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
          return;
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
//计算两点间距离的函数
export const distance = (x1: number, y1: number, x2: number, y2: number) => {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
};
