import { makeFog } from "./FogSystem";
import type { TiledMap } from "../MapClass";
import type { Unit } from "../units/Unit";

import { segmentsIntersect } from "../utils/MathUtil";
import { generateWays } from "../utils/PathfinderUtil";
import * as PIXI from "pixi.js";
import { golbalSetting } from "../golbalSetting";
const tileSize = 64;
export class FogSystem {
  mapPassiable: TiledMap;

  containers: PIXI.Container<PIXI.ContainerChild>;
  fog: PIXI.Graphics | null = null;
  mask: PIXI.Container | null = null;
  app: PIXI.Application;
  constructor(
    mapPassiable: TiledMap,
    containers: PIXI.Container<PIXI.ContainerChild>,
    app: PIXI.Application
  ) {
    this.mapPassiable = mapPassiable;

    this.containers = containers;
    this.app = app;
    console.log("app", app);
  }
  caculteVersionByUnit = (unit: Unit) => {
    const mapPassiable = this.mapPassiable;
    const edge = mapPassiable.edges;
    // console.log("caculteVersionByUnit", edge);

    // 计算单位的视野范围
    const visionRadius = 20; // 假设单位有vision属性，单位为格

    // 单位中心点
    const unitCenter = {
      x: unit.x + tileSize / 2,
      y: unit.y + tileSize / 2,
    };

    // 生成所有可见点
    const visiblePoints: {
      [key: string]: { x: number; y: number } | null;
    } = {};
    const step = (3 * Math.PI) / 360; // 每度采样一次
    //打印时间
    const now = new Date();

    for (let angle = 0; angle < 2 * Math.PI; angle += step) {
      for (let r = 0; r < visionRadius * tileSize; r += 5) {
        const px = unitCenter.x + Math.cos(angle) * r;
        const py = unitCenter.y + Math.sin(angle) * r;

        // 检查是否被墙体阻挡
        let blocked = false;
        for (const wall of edge) {
          if (
            !wall.onlyBlock &&
            wall.useable == true &&
            segmentsIntersect(
              unitCenter.x,
              unitCenter.y,
              px,
              py,
              wall.x1,
              wall.y1,
              wall.x2,
              wall.y2
            )
          ) {
            blocked = true;
            break;
          }
        }
        if (!blocked) {
          visiblePoints[`${angle}`] = { x: px, y: py };
        } else {
          break;
        }
      }
    }
    return visiblePoints;
  };

  caculteVersionByPlayers = () => {
    const units = this.mapPassiable.sprites;
    const versionPolysPointsData: {
      unitId: any;
      visiblePoints: { [key: string]: { x: number; y: number } | null };
    }[] = [];
    units.forEach((unit: Unit) => {
      if (unit.party === "player") {
        const visiblePoints = this.caculteVersionByUnit(unit);
        // 将可见点添加到地图上
        versionPolysPointsData.push({
          unitId: unit.id,
          visiblePoints: visiblePoints,
        });
      }
    });
    return versionPolysPointsData;
  };
  makeFogOfWar = (
    data: {
      unitId: any;
      visiblePoints: {
        [key: string]: {
          x: number;
          y: number;
        } | null;
      };
    }[]
  ) => {
    const mapPassiable = this.mapPassiable;
    // 创建一个覆盖整个地图的黑色层

    if (this.mask) {
      this.mask.children.forEach((child) => {
        if (child instanceof PIXI.Graphics) {
          child.destroy();
        }
      });
      this.mask.removeChildren();
    } else {
      this.mask = new PIXI.Container();
      this.containers.addChild(this.mask);
    }
    const visiblePointsArr = data;
    const bigVisition = new PIXI.Graphics();
    if (visiblePointsArr.length > 0) {
      let i = 1;
      const visitions = this.mask;
      visiblePointsArr.forEach((visiblePoints) => {
        const pointData = [] as number[];
        i++;
        for (const pt of Object.values(visiblePoints.visiblePoints)) {
          if (pt) {
            pointData.push(pt.x, pt.y);
          }
        }
        bigVisition.poly(pointData).fill({ color: 0xffffff, alpha: 1 });
      });
      visitions.addChild(bigVisition);
      if (golbalSetting.mapContainer) {
        golbalSetting.mapContainer.children.forEach((child) => {
                child.setMask({mask:bigVisition});
        });
      }
      if (golbalSetting.spriteContainer) {
        golbalSetting.spriteContainer.children.forEach((child) => {
          child.setMask({mask:bigVisition});
        });
      }
      this.mask.eventMode='none'
 
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
    const fogSystem = new FogSystem(mapPassiable, containers, app);
    // 创建一个覆盖整个地图的黑色层

    return fogSystem;
  }
}
