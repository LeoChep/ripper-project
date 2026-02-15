import type { TiledMap } from "../MapClass.js";
import type { Unit } from "../units/Unit.js";
import { drawFogLegacy, shrinkPolygon } from "./FogSystemLegacy";
import { segmentsIntersect } from "../utils/MathUtil.js";
import * as PIXI from "pixi.js";
import { golbalSetting } from "../golbalSetting.js";
import { Point } from "@/core/fog_modules/point.ts";
import polygonClipping from "polygon-clipping";
import type { Chest } from "../units/Chest.js";
import type { Door } from "../units/Door.js";
import { UnitSystem } from "./UnitSystem.js";
import { loadMap } from "../fog_modules/load-map.js";
import { calculateVisibility } from "../fog_modules/visibility.js";
import { drawScene, drawSceneByPoints } from "../fog_modules/draw-scene.js";
import { Segment } from "../fog_modules/segment.js";
import { Rectangle } from "../fog_modules/rectangle.js";
import {
  drawView,
  drawViews,
  getSegments,
  getView,
  getViews,
} from "../fog_modules/get-view.js";
import { appSetting, tileSize } from "../envSetting.js";


interface GridCacheEntry {
  playerPositions: string; // 所有玩家单位位置的组合key
}
export class FogSystem {
  static instanse: FogSystem;
  ctx: CanvasRenderingContext2D = null!;
  fogCanvas: any;
  fogContext: any;
  fogSprite: any;
  fogTexture: PIXI.Texture<PIXI.TextureSource<any>> | undefined;
  gradientLayers: number = 5;
  gradientStepSize: number = 10;
  private gridCache: GridCacheEntry | null = null;
  private lastPlayerPositions: string = ""; // 上一次的玩家位置key
  cacheContainerPosition = new Point(0, 0);
  mask: any;
  currentVisibilityPolygons: Point[][] = [];
  viewPortCanvas: any;
  viewPortConten: any;
  constructor() {
    FogSystem.instanse = this;
  }

  getPointsTransFromUnits() {
    const units = UnitSystem.getInstance().getAllUnits();
    const points: Point[] = [];
    units.forEach((unit) => {
      if (unit.party == "player") {
        points.push({
          x: unit.x + tileSize / 2,
          y: unit.y + tileSize / 2,
        });
      }
    });
    return points;
  }
  getWallFormMap() {
    const mapPassiable = golbalSetting.map;
    const edge = mapPassiable?.edges;
    const walls: Segment[] = [];
    edge?.forEach((seg) => {
      if (seg.useable === false) return;
      if (seg.onlyBlock === true) return;
      walls.push(new Segment(seg.x1, seg.y1, seg.x2, seg.y2));
    });
    return walls;
  }
  drawViewInViewport(
    viewPort: CanvasRenderingContext2D,
    view: HTMLCanvasElement,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    viewPort.clearRect(0, 0, width, height); // 清空上一帧
    viewPort.drawImage(
      view,
      x,
      y,
      width,
      height, // 原生Canvas的截取区域
      0,
      0,
      width,
      height // 临时Canvas的绘制区域
    );
    return this.viewPortConten;
  }
  checkHashPointsChange = (points: Point[]) => {
    const playerPositionsKey = points
      .map(
        (p) => `${Math.floor(p.x / tileSize)}_${Math.floor(p.y / tileSize)}`
      )
      .join("|");
    if (this.gridCache) {
      if (this.gridCache.playerPositions === playerPositionsKey) {
        console.log("run: 玩家位置未变化，使用缓存的可视多边形");
        return false;
      }
    }
    this.gridCache = {
      playerPositions: playerPositionsKey,
    };
    return true;
  };
  //如果有重绘，返回true，否则返回false
  run = (points: Point[]) => {
    const walls = this.getWallFormMap();
    const room = new Rectangle(
      0,
      0,
      golbalSetting.map!.width * tileSize,
      golbalSetting.map!.height * tileSize
    );
    if (!this.checkHashPointsChange(points)) {
      return false;
    }
    const segments = getSegments(room, points[0], [], walls);
    const views = getViews(points, segments, room);
    this.currentVisibilityPolygons = views;
    this.updateObjectsVisibility();

    // console.log(views);
    requestAnimationFrame(() => {
      console.log("run: 绘制视野", views);
      drawViews(
        views,
        golbalSetting.map!.width * tileSize,
        golbalSetting.map!.height * tileSize,
        this.getCanvasContext()
      );
      const containerX = golbalSetting.rootContainer?.x;
      const containerY = golbalSetting.rootContainer?.y;
      if (containerX === undefined || containerY === undefined) {
        console.warn("run: rootContainer 的位置未定义，无法正确绘制视口");
        return false;
      }
      this.cacheContainerPosition.x = containerX;
      this.cacheContainerPosition.y = containerY;
      //为了保证阴影正确，我们绘制额外的区域，这样当玩家接近边界时，阴影也能正确显示
      this.drawViewInViewport(
        this.getViewPortCtx(),
        this.fogCanvas,
        -this.cacheContainerPosition.x - appSetting.width,
        -this.cacheContainerPosition.y - appSetting.height,
        appSetting.width * 3,
        appSetting.height * 3
      );
    });
    return true;
  };
  getCanvasContext() {
    const mapPassiable = golbalSetting.map;
    const mapWidth = mapPassiable!.width * tileSize;
    const mapHeight = mapPassiable!.height * tileSize;
    // 复用或创建 Canvas
    if (
      !this.fogCanvas ||
      this.fogCanvas.width !== mapWidth ||
      this.fogCanvas.height !== mapHeight
    ) {
      this.fogCanvas = document.createElement("canvas");
      this.fogCanvas.width = mapWidth;
      this.fogCanvas.height = mapHeight;
      this.fogContext = this.fogCanvas.getContext("2d")!;
    }
    return this.fogContext;
  }
  getViewPortCtx() {
    const viewWidth = appSetting.width * 3;
    const viewHeight = appSetting.height * 3;
    // 复用或创建 Canvas
    if (!this.viewPortCanvas) {
      this.viewPortCanvas = document.getElementById(
        "viewPortCanvas"
      ) as HTMLCanvasElement;
      this.viewPortCanvas.width = viewWidth;
      this.viewPortCanvas.height = viewHeight;
      this.viewPortConten = this.viewPortCanvas.getContext("2d")!;
    }
    return this.viewPortConten;
  }
  getMask = () => {
    const container = golbalSetting.rootContainer;
    if (!container) {
      return;
    }
    if (!this.mask || !container.getChildByLabel("fogWarMask")) {
      this.mask = new PIXI.Container();
      this.mask.label = "fogWarMask";
      this.mask.zIndex = 999; // 设置高层级确保在最上层
      container.addChild(this.mask);

      // 附加到 fogLayer 渲染层
      if (golbalSetting.rlayers?.fogLayer) {
        golbalSetting.rlayers.fogLayer.attach(this.mask);
      }
    }
    return this.mask;
  };
  makeFogOfWar = () => {
    const mapPassiable = golbalSetting.map;
    const mapWidth = mapPassiable!.width * tileSize;
    const mapHeight = mapPassiable!.height * tileSize;
    const shrinkAmount = 3; // 收缩距离，单位像素

    const ctx = this.getViewPortCtx();
    console.log("makeFogOfWar: 开始绘制战争迷雾:", ctx);
    // 根据渲染模式选择不同的绘制方法
    // this.run(this.getPointsTransFromUnits());
    // 复用或创建 texture 和 sprite

    if (!this.fogSprite) {
      // 创建纹理和精灵
      this.fogTexture = PIXI.Texture.from(this.viewPortCanvas!);
      this.fogSprite = new PIXI.Sprite(this.fogTexture);

      // 如果启用了渐变，添加模糊滤镜
      if (this.gradientLayers > 0) {
        const blurStrength = (this.gradientLayers * this.gradientStepSize) / 8;
        const blurFilter = new PIXI.BlurFilter({
          strength: blurStrength,
          quality: 4,
          kernelSize: 5,
        });
        this.fogSprite.filters = [blurFilter];
      }
      this.fogSprite.x = -this.cacheContainerPosition.x - appSetting.width;
      this.fogSprite.y = -this.cacheContainerPosition.y - appSetting.height;
      this.getMask()?.addChild(this.fogSprite);
      this.getMask()!.eventMode = "none";
    } else {
      // 销毁旧纹理并重新创建（PixiJS v7+需要这样更新canvas纹理）
      this.fogTexture?.destroy(true);
      this.fogTexture = PIXI.Texture.from(this.viewPortCanvas!);
      this.fogSprite.texture = this.fogTexture;

      this.fogSprite.x = -this.cacheContainerPosition.x - appSetting.width;
      this.fogSprite.y = -this.cacheContainerPosition.y - appSetting.height;
    }
  };
  refreshSpatialGrid(force: boolean = false) {
    const mapPassiable = golbalSetting.map;
    if (!mapPassiable) {
      return;
    }

    // 清除缓存并立即触发重绘（墙体变化后需要重新计算视野）
    this.gridCache = null;
    this.lastPlayerPositions = "";
    console.log("[FogSystem] 空间网格已刷新，立即触发重绘");

    // 立即计算并重绘，避免等待autoDraw循环
    this.makeFogOfWar();
  }
  autoDraw(resolve: (...args: any[]) => void) {
    const darwFogFunc = () => {
      const timePromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, 100);
      });
      const versionCaculatePromise = new Promise((resolve) => {
        const isReRender = this.run(this.getPointsTransFromUnits());
        resolve(isReRender);
      });
      Promise.all([timePromise, versionCaculatePromise]).then((value) => {
        console.log("autoDraw: 计算版本和时间都完成了，准备打孔", value);
        const visiblePoints = value[1] as boolean;
        if (visiblePoints) {
          //打孔
          this.makeFogOfWar();
        }
        resolve();
        darwFogFunc();
      });
    };
    darwFogFunc();
  }
  /**
   * 更新门和宝箱的可见性
   */
  public updateObjectsVisibility() {
    const map = golbalSetting.map;
    if (!map) return;
    console.log("[FogSystem] 更新门和宝箱的可见性");
    // 更新门的可见性
    if (map.doors) {
      console.log("[FogSystem] 检查门的可见性");
      map.doors.forEach((door: Door) => {
        console.log("[FogSystem] 检查门:", door);
        if (door) {
          let isVisible = false;

          // 检查门的四角
          const corners = [
            [door.x, door.y],
            [door.x + (door.doorSprite?.width || 0), door.y],
            [door.x, door.y + (door.doorSprite?.height || 0)],
            [
              door.x + (door.doorSprite?.width || 0),
              door.y + (door.doorSprite?.height || 0),
            ],
          ];
          isVisible = corners.some(([x, y]) => this.isPositionVisible(x, y));

          if (door.doorSprite) {
            console.log("[FogSystem] 更新门可见性:", door, "可见:", isVisible);
            door.doorSprite.visible = isVisible;
          }
        }
      });
    }

    // 更新宝箱的可见性
    if (map.chests) {
      map.chests.forEach((chest: Chest) => {
        if (chest.chestSprite) {
          // 检查宝箱的中心位置是否可见
          const centerX = chest.x + (chest.width || tileSize) / 2;
          const centerY = chest.y + (chest.height || tileSize) / 2;
          chest.chestSprite.visible = this.isPositionVisible(centerX, centerY);
        }
      });
    }
  }
  /**
   * 检查一个位置是否在当前可视区域内
   * @param x X坐标（像素）
   * @param y Y坐标（像素）
   * @returns 是否可见
   */
  isPositionVisible(x: number, y: number): boolean {
    if (this.currentVisibilityPolygons.length === 0) {
      return false;
    }

    const point: Point = { x, y };
    for (const polygon of this.currentVisibilityPolygons) {
      if (this.isPointInPolygon(point, polygon)) {
        return true;
      }
    }
    return false;
  }
  /**
   * 判断一个点是否在多边形内
   */
  private isPointInPolygon(point: Point, polygon: Point[]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x,
        yi = polygon[i].y;
      const xj = polygon[j].x,
        yj = polygon[j].y;

      const intersect =
        yi > point.y !== yj > point.y &&
        point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
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
