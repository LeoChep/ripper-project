import type { TiledMap } from "../MapClass";
import type { Unit } from "../Unit";
import { girdMoveMovement, moveMovement, playerSelectMovement } from "../action/UnitMove";
import * as PIXI from "pixi.js";
import { generateWays } from "../utils/PathfinderUtil";
import { segmentsIntersect } from "../utils/MathUtil";

export const moveSelect = (
  unit: Unit,
  container: PIXI.Container<PIXI.ContainerChild>,
  lineLayer: PIXI.IRenderLayer,
  mapPassiable: TiledMap | null
) => {
  //显示红色的可移动范围
  const range = unit.creature?.speed ?? 0;
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
  const centerX = spriteUnit.x;
  const centerY = spriteUnit.y;
  const startX = Math.floor(centerX / tileSize);
  const startY = Math.floor(centerY / tileSize);
  // path 是一个以 "x,y" 为 key 的对象，记录每个格子的前驱节点
  const path = generateWays(startX, startY, range, (x, y, preX, preY) => {
    return checkPassiable(
      unit,
      preX * tileSize,
      preY * tileSize,
      x * tileSize,
      y * tileSize,
      mapPassiable
    );
  });
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
    playerSelectMovement(e, unit, container, path);
  });

  container.on("pointerup", removeGraphics);
};

export const checkPassiable = (
  unit: Unit,
  prex: number,
  prey: number,
  x: number,
  y: number,
  mapPassiable: TiledMap | null
) => {
  if (!mapPassiable) {
    return false;
  }
  const mapWidth = mapPassiable.width * mapPassiable.tilewidth;
  const mapHeight = mapPassiable.height * mapPassiable.tileheight;
  if (
    x < 0 ||
    y < 0 ||
    x >= mapWidth ||
    y >= mapHeight
  ) {
    return false;
  }

  console.log(`检查通行性: 单位位置 (${prey}, ${prey}), 目标位置 (${x}, ${y})`);
  // 检查单位是否在地图上
  let passiable = true;
  if (mapPassiable) {
    const edges = mapPassiable.edges;
    // 检查是否穿过边
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
    // 检查是否被敌人阻挡
    const units = mapPassiable.sprites as Unit[];
    if (units) {
      units.forEach((checkUnit) => {
        if (checkUnit.x != x || checkUnit.y != y || unit == checkUnit) {
          return;
        }
        if (unit.party == checkUnit.party) {
          return; // 如果是同一方的单位，则跳过
        }
        passiable = false; // 如果有敌人阻挡，则不可通行
        // 检查是否与敌人相交
      });
    }
  }

  return passiable;
};
