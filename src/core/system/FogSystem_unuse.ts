import { makeFog } from "./FogSystem";
import type { TiledMap } from "../MapClass";
import type { Unit } from "../units/Unit";

import { segmentsIntersect } from "../utils/MathUtil";
import * as PIXI from "pixi.js";
import { golbalSetting } from "../golbalSetting";
// @ts-expect-error - JS file with separate .d.ts type definitions
import VisibilityPolygon from "../../utils/visibility_polygon_dev.js";
import type { Point, Segment, Polygon } from "../../utils/visibility_polygon.d";

const tileSize = 64;
export class FogSystem {
  static instanse: FogSystem;
  fog: PIXI.Graphics | null = null;
  mask: PIXI.Container | null = null;
  constructor() {
    FogSystem.instanse = this;
  }
  caculteVersionByUnit = (unit: Unit): Polygon | null => {
    const mapPassiable = golbalSetting.map;
    if (!mapPassiable) {
      return null;
    }
    const edge = mapPassiable.edges;

    // 计算单位的视野范围
    const visionRadius = 20; // 假设单位有vision属性，单位为格

    // 单位中心点
    const position: Point = [
      unit.x + tileSize / 2,
      unit.y + tileSize / 2,
    ];

    // 将地图边缘转换为 visibility_polygon 需要的线段格式
    const segments: Segment[] = [];
    for (const wall of edge) {
      if (!wall.onlyBlock && wall.useable === true) {
        segments.push([
          [wall.x1, wall.y1],
          [wall.x2, wall.y2],
        ]);
      }
    }

    // 如果没有墙体，创建一个视野范围的圆形边界（用多边形近似）
    if (segments.length === 0) {
      const visionPolygon: Polygon = [];
      const angleStep = Math.PI / 18; // 36个点形成圆形
      for (let angle = 0; angle < 2 * Math.PI; angle += angleStep) {
        visionPolygon.push([
          position[0] + Math.cos(angle) * visionRadius * tileSize,
          position[1] + Math.sin(angle) * visionRadius * tileSize,
        ]);
      }
      return visionPolygon;
    }

    // 使用 visibility_polygon 库计算可视多边形
    // 注意：使用 compute() 而不是 computeViewport()
    // compute() 会自动创建边界框，不会过滤线段，更可靠
    try {
      // 关键修复：使用 breakIntersections 处理可能相交的线段
      // visibility_polygon 算法要求线段不能相交
      console.log(`[FogSystem] Breaking intersections for ${segments.length} segments...`);
      const brokenSegments = VisibilityPolygon.breakIntersections(segments);
      console.log(`[FogSystem] After breaking: ${brokenSegments.length} segments (added ${brokenSegments.length - segments.length})`);
      
      const visibilityPolygon = VisibilityPolygon.compute(position, brokenSegments);
      
      console.log(`[FogSystem] Computed visibility polygon with ${visibilityPolygon.length} vertices`);
      return visibilityPolygon;
    } catch (error) {
      console.error("Error computing visibility polygon:", error);
      return null;
    }
  };

  caculteVersionByPlayers = () => {
    const map = golbalSetting.map;
    if (!map) {
      return;
    }
    const units = map.sprites;
    const versionPolysPointsData: {
      unitId: any;
      visibilityPolygon: Polygon;
    }[] = [];
    
    units.forEach((unit: Unit) => {
      if (unit.party === "player") {
        const visibilityPolygon = this.caculteVersionByUnit(unit);
        if (!visibilityPolygon) {
          return;
        }
        versionPolysPointsData.push({
          unitId: unit.id,
          visibilityPolygon: visibilityPolygon,
        });
      }
    });
    return versionPolysPointsData;
  };
  makeFogOfWar = (
    data: {
      unitId: any;
      visibilityPolygon: Polygon;
    }[]
  ) => {
    const mapPassiable = golbalSetting.map;
    // 创建一个覆盖整个地图的黑色层
    const container = golbalSetting.rootContainer;
    if (!container) {
      console.error("Root container not found");
      return;
    }
    if (this.mask && container.getChildByLabel("fogWarMask")) {
      this.mask.children.forEach((child) => {
        if (child instanceof PIXI.Graphics) {
          child.destroy();
        }
      });
      this.mask.removeChildren();
    } else {
      this.mask = new PIXI.Container();
      this.mask.label = "fogWarMask";
      container.addChild(this.mask);
    }
    
    const visiblePointsArr = data;
    const bigVisition = new PIXI.Graphics();
    
    if (visiblePointsArr.length > 0) {
      const visitions = this.mask;
      visiblePointsArr.forEach((visibilityData) => {
        const pointData: number[] = [];
        // 将 Polygon (Point[]) 转换为 PIXI 需要的扁平数组格式
        for (const point of visibilityData.visibilityPolygon) {
          pointData.push(point[0], point[1]);
        }
        bigVisition.poly(pointData).fill({ color: 0xffffff, alpha: 1 });
      });
      
      visitions.addChild(bigVisition);
      if (golbalSetting.mapContainer) {
        golbalSetting.mapContainer.children.forEach((child) => {
          child.setMask({ mask: bigVisition });
        });
      }
      if (golbalSetting.spriteContainer) {
        golbalSetting.spriteContainer.children.forEach((child) => {
          child.setMask({ mask: bigVisition });
        });
      }
      this.mask.eventMode = "none";
    }
  };
  autoDraw() {
    const darwFogFunc = () => {
      const timePromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, 100);
      });
      const versionCaculatePromise = new Promise((resolve) => {
        const mask = this.caculteVersionByPlayers();
        resolve(mask);
      });
      Promise.all([timePromise, versionCaculatePromise]).then((value) => {
        const visiblePoints = value[1] as any;
        if (visiblePoints) {
          //打孔
          this.makeFogOfWar(visiblePoints);
        }
        darwFogFunc();
      });
    };
    darwFogFunc();
  }
  static initFog(
    mapPassiable: TiledMap,
    containers: PIXI.Container<PIXI.ContainerChild>,
    app: PIXI.Application
  ) {
    const fogSystem = new FogSystem();
    // 创建一个覆盖整个地图的黑色层

    return fogSystem;
  }
}
