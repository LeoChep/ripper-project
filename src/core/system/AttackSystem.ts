import type { CreatureAttack } from "@/core/units/Creature";
import { segmentsIntersect } from "../utils/MathUtil";
import type { TiledMap } from "../MapClass";
import type { RLayers } from "../type/RLayersInterface";
import type { Unit } from "../units/Unit";
import * as PIXI from "pixi.js";
import { playerSelectAttackMovement } from "../action/UnitAttack";
import { generateWays } from "../utils/PathfinderUtil";



export const checkPassiable = (
  unit: Unit,
  x: number,
  y: number,
  mapPassiable: TiledMap | null
) => {
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
          { x: unit.x + 32, y: unit.y + 32 },
          { x: unit.x, y: unit.y },
          { x: unit.x + 64, y: unit.y },
          { x: unit.x + 64, y: unit.y + 64 },
          { x: unit.x, y: unit.y + 64 },
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
