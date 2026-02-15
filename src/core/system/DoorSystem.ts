import type { TiledMap } from "../MapClass";
import type { RLayers } from "../type/RLayersInterface";
import type { Unit } from "../units/Unit";
import * as PIXI from "pixi.js";


//计算两点间距离的函数
export const distance = (x1: number, y1: number, x2: number, y2: number) => {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
};
