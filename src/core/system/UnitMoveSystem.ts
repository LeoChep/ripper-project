import type { TiledMap } from "../MapClass";
import type { Unit } from "../units/Unit";


import { segmentsIntersect } from "../utils/MathUtil";



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
