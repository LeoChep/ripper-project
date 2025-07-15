import { makeFog } from "./FogSystem";
import type { TiledMap } from "../MapClass";
import type { Unit } from "../units/Unit";

import { segmentsIntersect } from "../utils/MathUtil";
import { generateWays } from "../utils/PathfinderUtil";
import * as PIXI from "pixi.js";
const tileSize = 64;
export class FogSystem {
  mapPassiable: TiledMap;
  rlayers: {
    basicLayer: PIXI.IRenderLayer;
    spriteLayer: PIXI.IRenderLayer;
    lineLayer: any;
    selectLayer: PIXI.IRenderLayer;
    fogLayer: PIXI.IRenderLayer;
    controllerLayer: PIXI.IRenderLayer;
  };
  containers: PIXI.Container<PIXI.ContainerChild>;
  fog: PIXI.Graphics | null = null;
  constructor(
    mapPassiable: TiledMap,
    rlayers: {
      basicLayer: PIXI.IRenderLayer;
      spriteLayer: PIXI.IRenderLayer;
      lineLayer: PIXI.IRenderLayer;
      fogLayer: PIXI.IRenderLayer;
      selectLayer: PIXI.IRenderLayer;
      controllerLayer: PIXI.IRenderLayer;
    },
    containers: PIXI.Container<PIXI.ContainerChild>
  ) {
    this.mapPassiable = mapPassiable;
    this.rlayers = rlayers;
    this.containers = containers;
  }
  caculteVersionByUnit = (unit: Unit) => {
    const mapPassiable = this.mapPassiable;
    const edge = mapPassiable.edges;

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
    const step = (2 * Math.PI) / 360; // 每度采样一次
    //打印时间
    const now = new Date();
    // console.log(
    //   "开始计算可见区域",
    //   now.toLocaleTimeString() +
    //     "." +
    //     now.getMilliseconds().toString().padStart(3, "0")
    // );
    for (let angle = 0; angle < 2 * Math.PI; angle += step) {
      for (let r = 0; r < visionRadius * tileSize; r += 1) {
        const px = unitCenter.x + Math.cos(angle) * r;
        const py = unitCenter.y + Math.sin(angle) * r;

        // 检查是否被墙体阻挡
        let blocked = false;
        for (const wall of edge) {
          if (
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
    const mapWidth = mapPassiable.width * tileSize + 200;
    const mapHeight = mapPassiable.height * tileSize + 200;
    if (this.fog) {
      this.fog.clear();
    } else {
      this.fog = new PIXI.Graphics();
      this.fog.eventMode = "static"; // 令遮罩不影响事件
      const fogOfWar = this.fog;

      fogOfWar.zIndex = 1000; // 确保fog在最上层


      this.containers.addChild(this.fog);
      this.rlayers.fogLayer.attach(this.fog);
    }
    const fogOfWar = this.fog;
    fogOfWar.rect(-100, -100, mapWidth, mapHeight);
    fogOfWar.fill({ color: 0x000000, alpha: 1 });
    const visiblePointsArr = data;
    if (visiblePointsArr.length > 0) {
      const pointData = [] as number[];
      visiblePointsArr.forEach((visiblePoints) => {
        for (const pt of Object.values(visiblePoints.visiblePoints)) {
          if (pt) {
            pointData.push(pt.x, pt.y);
          }
        }
        fogOfWar.poly(pointData).cut();
      });
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
          // console.log("开始打孔");
          this.makeFogOfWar(visiblePoints);
        }
        darwFogFunc();
      });
    };
    darwFogFunc();
  }
  static initFog(
    mapPassiable: TiledMap,
    rlayers: {
      basicLayer: PIXI.IRenderLayer;
      spriteLayer: PIXI.IRenderLayer;
      lineLayer: PIXI.IRenderLayer;
      fogLayer: PIXI.IRenderLayer;
      selectLayer: PIXI.IRenderLayer;
      controllerLayer: PIXI.IRenderLayer;
    },
    containers: PIXI.Container<PIXI.ContainerChild>
  ) {
    const fogSystem = new FogSystem(mapPassiable, rlayers, containers);
    // 创建一个覆盖整个地图的黑色层
    const mapWidth = mapPassiable.width * tileSize + 200;
    const mapHeight = mapPassiable.height * tileSize + 200;
    const fogOfWar = new PIXI.Graphics();
    fogOfWar.zIndex = 1000; //

    fogSystem.fog = fogOfWar;
    fogSystem.containers.addChild(fogOfWar);
    fogSystem.rlayers.fogLayer.attach(fogOfWar);
    fogOfWar.rect(-100, -100, mapWidth, mapHeight);
    fogOfWar.fill({ color: 0x000000, alpha: 1 });

    return fogSystem;
  }
}
