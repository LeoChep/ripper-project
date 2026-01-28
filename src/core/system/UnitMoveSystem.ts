import { tileSize } from "../envSetting";
import type { TiledMap } from "../MapClass";
import type { Unit } from "../units/Unit";

import { segmentsIntersect } from "../utils/MathUtil";
import { UnitSystem } from "./UnitSystem";

export const checkPassiable = (
  unit: Unit,
  prex: number,
  prey: number,
  x: number,
  y: number,
  mapPassiable: TiledMap | null
) => {
  if (!unit.creature) {
    return false;
  }
  if (!mapPassiable) {
    return false;
  }
  const mapWidth = mapPassiable.width * mapPassiable.tilewidth;
  const mapHeight = mapPassiable.height * mapPassiable.tileheight;
  if (x < 0 || y < 0 || x >= mapWidth || y >= mapHeight) {
    return false;
  }

  // 检查单位是否在地图上
  let passiable = true;
  if (mapPassiable) {
    const edges = mapPassiable.edges;
    // console.log("检查通行性: 单位位置", prex, prey, "目标位置", x, y,mapPassiable);
    let testx = x;
    let testy = y;
    const size = unit.creature ? unit.creature.size : undefined;

    // 构建范围数组
    const rangeArrA = [] as { x: number; y: number }[];
    const rangeArrB = [] as { x: number; y: number }[];
    let range = 1; // 默认范围为0，可根据需要调整
    if (size === "big") {
      range = 2;
    }

    for (let dx = 0; dx < range; dx++) {
      for (let dy = 0; dy < range; dy++) {
        rangeArrA.push({ x: testx + dx * tileSize, y: testy + dy * tileSize });
      }
    }
    for (let dx = 0; dx < range; dx++) {
      for (let dy = 0; dy < range; dy++) {
        rangeArrB.push({ x: prex + dx * tileSize, y: prey + dy * tileSize });
      }
    }

    // 检查是否穿过边

    if (edges) {
      // console.log(edges)
      // 检查是否有对象在指定位置
      // 遍历对象组中的所有对象
      edges.forEach((edge) => {
        if (edge.useable === false) {
          return; // 如果边不可用，则跳过
        }

        // 检查所有中点的连线
        let intersectCount = 0;
        for (let i = 0; i < rangeArrA.length; i++) {
          if (
            segmentsIntersect(
              rangeArrA[i].x + 32,
              rangeArrA[i].y + 32,
              rangeArrB[i].x + 32,
              rangeArrB[i].y + 32,
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
    for (let point of rangeArrA) {
      if (units) {
        const checkUnit = UnitSystem.getInstance().findUnitByPIXIxy(
          point.x,
          point.y
        );
        //TODO 需要专门抽象出函数方法来判断阵营是否友好
        let isFriendlyNpc = false
        if (checkUnit?.friendly&&unit.party==="player") {
          isFriendlyNpc = true;
        }
        if (unit.friendly&& checkUnit?.party==="player") {
          isFriendlyNpc = true;
        }

        
        if (
          checkUnit &&
          unit.party !== checkUnit.party &&
          !isFriendlyNpc &&
          checkUnit.state !== "dead"
        ) {
          passiable = false; // 如果有敌人阻挡，则不可通行
        }
      }
    }
  }

  return passiable;
};
