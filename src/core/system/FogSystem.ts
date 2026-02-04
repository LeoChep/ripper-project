import type { TiledMap } from "../MapClass.js";
import type { Unit } from "../units/Unit.js";
import { drawFogLegacy, shrinkPolygon } from "./FogSystemLegacy";
import { segmentsIntersect } from "../utils/MathUtil.js";
import * as PIXI from "pixi.js";
import { golbalSetting } from "../golbalSetting.js";
// @ts-expect-error - JS file with separate .d.ts type definitions
import VisibilityPolygon from "../../utils/visibility_polygon_dev.js";
import type {
  Point,
  Segment,
  Polygon,
} from "../../utils/visibility_polygon.js";
import polygonClipping from "polygon-clipping";
import type { Chest } from "../units/Chest.js";
import type { Door } from "../units/Door.js";

const tileSize = 64;
const GRID_SIZE = 64; // 网格采样的方格大小
const VISIBILITY_THRESHOLD = 0.25; // 可见性阈值（25%）
const RERENDER_DIFF_THRESHOLD = 0.2; // 可见方格变化超过10%时触发重绘
/**
 * 网格可见性缓存项
 */
interface GridCacheEntry {
  playerPositions: string; // 所有玩家单位位置的组合key
  visibleCells: Set<string>; // 可见的方格集合 ("x,y"格式)
}

/**
 * 空间分割网格，用于快速查询附近的线段
 */
class SpatialGrid {
  private grid: Map<string, Segment[]> = new Map();
  private cellSize: number;

  constructor(cellSize: number = 256) {
    this.cellSize = cellSize;
  }

  private getCellKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  /**
   * 添加线段到网格
   */
  addSegment(segment: Segment) {
    // 计算线段覆盖的所有网格
    const x1 = Math.min(segment[0][0], segment[1][0]);
    const y1 = Math.min(segment[0][1], segment[1][1]);
    const x2 = Math.max(segment[0][0], segment[1][0]);
    const y2 = Math.max(segment[0][1], segment[1][1]);

    const cellX1 = Math.floor(x1 / this.cellSize);
    const cellY1 = Math.floor(y1 / this.cellSize);
    const cellX2 = Math.floor(x2 / this.cellSize);
    const cellY2 = Math.floor(y2 / this.cellSize);

    // 将线段添加到所有相关网格
    for (let cx = cellX1; cx <= cellX2; cx++) {
      for (let cy = cellY1; cy <= cellY2; cy++) {
        const key = `${cx},${cy}`;
        if (!this.grid.has(key)) {
          this.grid.set(key, []);
        }
        this.grid.get(key)!.push(segment);
      }
    }
  }

  /**
   * 查询指定位置附近的线段
   * @param position 观察点位置
   * @param radius 查询半径
   */
  queryNearby(position: Point, radius: number): Segment[] {
    const x = position[0];
    const y = position[1];

    // 计算需要查询的网格范围
    const cellX1 = Math.floor((x - radius) / this.cellSize);
    const cellY1 = Math.floor((y - radius) / this.cellSize);
    const cellX2 = Math.floor((x + radius) / this.cellSize);
    const cellY2 = Math.floor((y + radius) / this.cellSize);

    const segments = new Set<Segment>();

    // 收集所有相关网格的线段
    for (let cx = cellX1; cx <= cellX2; cx++) {
      for (let cy = cellY1; cy <= cellY2; cy++) {
        const key = `${cx},${cy}`;
        const cellSegments = this.grid.get(key);
        if (cellSegments) {
          cellSegments.forEach((seg) => segments.add(seg));
        }
      }
    }

    return Array.from(segments);
  }

  /**
   * 获取网格统计信息
   */
  getStats() {
    let totalSegments = 0;
    let maxSegments = 0;
    this.grid.forEach((cell) => {
      totalSegments += cell.length;
      maxSegments = Math.max(maxSegments, cell.length);
    });
    return {
      cellCount: this.grid.size,
      totalSegments,
      avgSegmentsPerCell: totalSegments / this.grid.size,
      maxSegmentsPerCell: maxSegments,
    };
  }
}

export class FogSystem {
  static instanse: FogSystem;
  fog: PIXI.Graphics | null = null;
  mask: PIXI.Container | null = null;
  private spatialGrid: SpatialGrid | null = null;
  private allSegments: Segment[] = [];
  private brokenSegments: Segment[] = [];
  private edgesHash: string = "";

  // 渐变配置
  private gradientLayers: number = 5; // 渐变层数
  private gradientStepSize: number = 10; // 每层的宽度（像素）

  // 复用的渲染资源
  private fogCanvas: HTMLCanvasElement | null = null;
  private fogContext: CanvasRenderingContext2D | null = null;
  private fogTexture: PIXI.Texture | null = null;
  private fogSprite: PIXI.Sprite | null = null;

  // 网格可见性缓存
  private gridCache: GridCacheEntry | null = null;
  private lastPlayerPositions: string = ""; // 上一次的玩家位置key

  // 当前可视多边形缓存（用于判断对象可见性）
  private currentVisibilityPolygons: Polygon[] = [];

  // 当前视野计算中使用的墙体线段（用于判断墙体是否阻挡视野）
  private currentUsedSegments: Set<Segment> = new Set();

  // 渲染模式：'grid' = 网格采样（快速），'polygon' = 传统多边形（精确）
  private renderMode: "grid" | "polygon" = "polygon";

  constructor() {
    FogSystem.instanse = this;
  }

  /**
   * 设置战争迷雾渲染模式
   * @param mode 'grid' = 网格采样（性能优先），'polygon' = 传统多边形（精度优先）
   */
  setRenderMode(mode: "grid" | "polygon") {
    if (this.renderMode !== mode) {
      this.renderMode = mode;
      // 清除缓存以触发重绘
      this.gridCache = null;
      this.lastPlayerPositions = "";
      console.log(
        `[FogSystem] 渲染模式切换为: ${mode === "grid" ? "网格采样" : "传统多边形"}`,
      );
    }
  }

  /**
   * 获取当前渲染模式
   */
  getRenderMode(): "grid" | "polygon" {
    return this.renderMode;
  }

  /**
   * 设置渐变配置
   * @param layers 渐变层数（0-10，0表示无渐变）- 实际转换为模糊强度
   * @param stepSize 每层宽度（像素，建议16-64）- 控制模糊范围
   */
  setGradientConfig(layers: number, stepSize: number = 32) {
    this.gradientLayers = Math.max(0, Math.min(10, layers));
    this.gradientStepSize = Math.max(8, Math.min(128, stepSize));
  }

  /**
   * 手动刷新空间网格（当墙体发生变化时调用）
   * 注意：此方法主要影响视野多边形的计算精度
   * - 在传统多边形模式下影响较大（边界精确度）
   * - 在网格采样模式下影响较小（已使用粗略采样）
   * @param force 是否强制刷新（默认false，会检查是否有变化）
   */
  refreshSpatialGrid(force: boolean = false) {
    const mapPassiable = golbalSetting.map;
    if (!mapPassiable) {
      return;
    }

    const currentHash = this.calculateEdgesHash(mapPassiable.edges);

    if (!force && currentHash === this.edgesHash) {
      return;
    }

    this.spatialGrid = null;
    this.edgesHash = "";
    this.initializeSpatialGrid(mapPassiable.edges);

    // 清除缓存并立即触发重绘（墙体变化后需要重新计算视野）
    this.gridCache = null;
    this.lastPlayerPositions = "";
    console.log("[FogSystem] 空间网格已刷新，立即触发重绘");

    // 立即计算并重绘，避免等待autoDraw循环
    const visibilityData = this.caculteVersionByPlayers();
    if (visibilityData) {
      this.makeFogOfWar(visibilityData);
    }
  }

  /**
   * 计算边数据的哈希值，用于检测变化
   */
  private calculateEdgesHash(edges: any[]): string {
    // 简单的哈希：统计边的数量和状态
    let hash = `${edges.length}`;
    edges.forEach((edge) => {
      if (!edge.onlyBlock && edge.useable === true) {
        hash += `|${edge.id}:${edge.x1},${edge.y1},${edge.x2},${edge.y2}`;
      }
    });
    return hash;
  }
  caculteVersionByUnit = (
    unit: Unit,
  ): { polygon: Polygon; usedSegments: Segment[] } | null => {
    const mapPassiable = golbalSetting.map;
    if (!mapPassiable) {
      return null;
    }

    // 计算单位的视野范围
    const visionRadius = 15; // 假设单位有vision属性，单位为格

    // 单位中心点
    const position: Point = [unit.x + tileSize / 2, unit.y + tileSize / 2];

    // 检查并初始化或更新网格
    const currentHash = this.calculateEdgesHash(mapPassiable.edges);
    if (!this.spatialGrid || currentHash !== this.edgesHash) {
      this.initializeSpatialGrid(mapPassiable.edges);
    }

    // 使用空间网格查询附近的线段
    const queryRadius = visionRadius * tileSize;
    const nearbySegments = this.spatialGrid!.queryNearby(position, queryRadius);

    // 如果没有墙体，创建一个视野范围的圆形边界（用多边形近似）
    if (nearbySegments.length === 0) {
      const visionPolygon: Polygon = [];
      const angleStep = Math.PI / 18; // 36个点形成圆形
      for (let angle = 0; angle < 2 * Math.PI; angle += angleStep) {
        visionPolygon.push([
          position[0] + Math.cos(angle) * visionRadius * tileSize,
          position[1] + Math.sin(angle) * visionRadius * tileSize,
        ]);
      }
      return { polygon: visionPolygon, usedSegments: [] };
    }

    // 使用 visibility_polygon 库计算可视多边形
    try {
      const visibilityPolygon = VisibilityPolygon.compute(
        position,
        nearbySegments,
      );

      return { polygon: visibilityPolygon, usedSegments: nearbySegments };
    } catch (error) {
      return null;
    }
  };

  /**
   * 初始化空间分割网格
   */
  private initializeSpatialGrid(edges: any[]) {
    // 创建网格 (cellSize = 256px = 4 tiles)
    this.spatialGrid = new SpatialGrid(256);

    // 收集所有有效线段
    this.allSegments = [];
    for (const wall of edges) {
      if (!wall.onlyBlock && wall.useable === true) {
        this.allSegments.push([
          [wall.x1, wall.y1],
          [wall.x2, wall.y2],
        ]);
      }
    }

    // 使用 breakIntersections 处理相交线段
    this.brokenSegments = VisibilityPolygon.breakIntersections(
      this.allSegments,
    );

    // 将所有线段添加到空间网格
    this.brokenSegments.forEach((seg) => {
      this.spatialGrid!.addSegment(seg);
    });

    // 保存当前状态的哈希值
    this.edgesHash = this.calculateEdgesHash(edges);
  }

  /**
   * 生成玩家单位位置的唯一key
   */
  private generatePlayerPositionKey(units: Unit[]): string {
    const playerUnits = units.filter((u) => u.party === "player");
    return playerUnits
      .map(
        (u) =>
          `${u.id}:${Math.floor(u.x / (GRID_SIZE * RERENDER_DIFF_THRESHOLD))},${Math.floor(u.y / (GRID_SIZE * RERENDER_DIFF_THRESHOLD))}`,
      )
      .sort()
      .join("|");
  }

  /**
   * 判断一个点是否在多边形内
   */
  private isPointInPolygon(point: Point, polygon: Polygon): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0],
        yi = polygon[i][1];
      const xj = polygon[j][0],
        yj = polygon[j][1];

      const intersect =
        yi > point[1] !== yj > point[1] &&
        point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
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

    const point: Point = [x, y];
    for (const polygon of this.currentVisibilityPolygons) {
      if (this.isPointInPolygon(point, polygon)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 计算方格的可见性（采样法）
   * @param cellX 方格X坐标（单位：方格）
   * @param cellY 方格Y坐标（单位：方格）
   * @param visibilityPolygons 所有可视多边形
   * @returns 可见性比例 (0-1)
   */
  private calculateCellVisibility(
    cellX: number,
    cellY: number,
    visibilityPolygons: Polygon[],
  ): number {
    const samplePoints = 9; // 3x3采样网格
    const gridStep = GRID_SIZE / 4; // 采样点间距
    let visibleCount = 0;

    // 方格左上角的像素坐标
    const baseX = cellX * GRID_SIZE;
    const baseY = cellY * GRID_SIZE;

    // 在方格内进行采样
    for (let dx = 1; dx <= 3; dx++) {
      for (let dy = 1; dy <= 3; dy++) {
        const sampleX = baseX + dx * gridStep;
        const sampleY = baseY + dy * gridStep;
        const point: Point = [sampleX, sampleY];

        // 检查采样点是否在任意可视多边形内
        for (const polygon of visibilityPolygons) {
          if (this.isPointInPolygon(point, polygon)) {
            visibleCount++;
            break;
          }
        }
      }
    }

    return visibleCount / samplePoints;
  }

  /**
   * 计算所有可见的方格
   */
  private calculateVisibleCells(
    visibilityPolygons: Polygon[],
    mapWidth: number,
    mapHeight: number,
  ): Set<string> {
    const visibleCells = new Set<string>();

    // 计算需要检查的方格范围
    const gridWidth = Math.ceil(mapWidth / GRID_SIZE);
    const gridHeight = Math.ceil(mapHeight / GRID_SIZE);

    // 遍历所有方格
    for (let gx = 0; gx < gridWidth; gx++) {
      for (let gy = 0; gy < gridHeight; gy++) {
        const visibility = this.calculateCellVisibility(
          gx,
          gy,
          visibilityPolygons,
        );

        // 如果可见性超过阈值，标记为可见
        if (visibility >= VISIBILITY_THRESHOLD) {
          visibleCells.add(`${gx},${gy}`);
        }
      }
    }

    return visibleCells;
  }

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

    // 清空并重新收集使用的线段
    this.currentUsedSegments.clear();

    units.forEach((unit: Unit) => {
      if (unit.party === "player") {
        const result = this.caculteVersionByUnit(unit);
        if (!result) {
          return;
        }
        versionPolysPointsData.push({
          unitId: unit.id,
          visibilityPolygon: result.polygon,
        });
        // 收集使用的线段
        result.usedSegments.forEach((seg) => this.currentUsedSegments.add(seg));
      }
    });
    return versionPolysPointsData;
  };

  /**
   * 检查一个墙体是否参与了视野计算
   */
  private isWallUsedInVision(wall: any): boolean {
    // 遍历当前使用的线段，查找是否有匹配的墙体
    for (const segment of this.currentUsedSegments) {
      // 检查线段的两个端点是否与墙体匹配
      const [p1, p2] = segment;
      if (
        (p1[0] === wall.x1 &&
          p1[1] === wall.y1 &&
          p2[0] === wall.x2 &&
          p2[1] === wall.y2) ||
        (p1[0] === wall.x2 &&
          p1[1] === wall.y2 &&
          p2[0] === wall.x1 &&
          p2[1] === wall.y1)
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * 更新门和宝箱的可见性
   */
  private updateObjectsVisibility() {
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

          // 检查门的中心位置是否可见
          const centerX = door.x + (door.doorSprite?.width || 0) / 2;
          const centerY = door.y + (door.doorSprite?.height || 0) / 2;
          isVisible = this.isPositionVisible(centerX, centerY);

  

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

  makeFogOfWar = (
    data: {
      unitId: any;
      visibilityPolygon: Polygon;
    }[],
  ) => {
    const mapPassiable = golbalSetting.map;
    // 创建一个覆盖整个地图的黑色层
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

    const visiblePointsArr = data;

    // 检查玩家位置是否改变
    const map = golbalSetting.map;
    if (map) {
      const currentPositionKey = this.generatePlayerPositionKey(
        map.sprites as Unit[],
      );

      // 如果玩家位置没有改变，且缓存有效，跳过重绘
      if (currentPositionKey === this.lastPlayerPositions && this.gridCache) {
        console.log("[FogSystem] 玩家位置未改变，跳过重绘");
        return;
      }

      // 更新位置key
      this.lastPlayerPositions = currentPositionKey;
    }

    if (visiblePointsArr.length > 0) {
      // 获取地图尺寸
      const map = golbalSetting.map;
      if (!map) return;
      const mapWidth = map.width * map.tilewidth;
      const mapHeight = map.height * map.tileheight;

      // 提取所有可视多边形
      const allVisibilityPolygons = visiblePointsArr.map(
        (data) => data.visibilityPolygon,
      );

      // 收缩所有多边形，让迷雾向内扩散（单位：像素，约1-2格的距离）
      const shrinkAmount = 3; // 收缩距离，可调整
      const shrunkPolygons = allVisibilityPolygons.map((poly) =>
        shrinkPolygon(poly, shrinkAmount),
      );

      // 缓存当前可视多边形（用于判断对象可见性）
      this.currentVisibilityPolygons = shrunkPolygons;

      // 更新门和宝箱的可见性
      this.updateObjectsVisibility();

      // 计算可见的方格（网格采样法）
      const visibleCells = this.calculateVisibleCells(
        shrunkPolygons,
        mapWidth,
        mapHeight,
      );

      // 更新缓存
      this.gridCache = {
        playerPositions: this.lastPlayerPositions,
        visibleCells: visibleCells,
      };

      console.log(`[FogSystem] 计算可见方格: ${visibleCells.size}个`);

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
      const ctx = this.fogContext!;

      // 根据渲染模式选择不同的绘制方法
      if (this.renderMode === "grid") {
        // 网格采样模式：性能优先
        ctx.fillStyle = "rgba(0, 0, 0, 1)";
        ctx.fillRect(0, 0, mapWidth, mapHeight);

        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = "rgba(255, 255, 255, 1)";

        // 绘制所有可见的方格
        if (this.gridCache) {
          this.gridCache.visibleCells.forEach((cellKey) => {
            const [gx, gy] = cellKey.split(",").map(Number);
            ctx.fillRect(gx * GRID_SIZE, gy * GRID_SIZE, GRID_SIZE, GRID_SIZE);
          });
        }

        ctx.globalCompositeOperation = "source-over";
      } else {
        // 传统多边形模式：精度优先
        drawFogLegacy(ctx, shrunkPolygons, mapWidth, mapHeight, shrinkAmount);
      }

      // 复用或创建 texture 和 sprite
      if (!this.fogSprite) {
        // 创建纹理和精灵
        this.fogTexture = PIXI.Texture.from(this.fogCanvas!);
        this.fogSprite = new PIXI.Sprite(this.fogTexture);

        // 如果启用了渐变，添加模糊滤镜
        if (this.gradientLayers > 0) {
          const blurStrength =
            (this.gradientLayers * this.gradientStepSize) / 8;
          const blurFilter = new PIXI.BlurFilter({
            strength: blurStrength,
            quality: 4,
            kernelSize: 5,
          });
          this.fogSprite.filters = [blurFilter];
        }

        this.mask.addChild(this.fogSprite);
        this.mask.eventMode = "none";
      } else {
        // 销毁旧纹理并重新创建（PixiJS v7+需要这样更新canvas纹理）
        this.fogTexture?.destroy(false);
        this.fogTexture = PIXI.Texture.from(this.fogCanvas!);
        this.fogSprite.texture = this.fogTexture;
      }
    }
  };
  autoDraw(resolve: (...args: any[]) => void) {
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
        resolve();
        darwFogFunc();
      });
    };
    darwFogFunc();
  }
  static initFog(
    mapPassiable: TiledMap,
    containers: PIXI.Container<PIXI.ContainerChild>,
    app: PIXI.Application,
  ) {
    const fogSystem = new FogSystem();
    // 创建一个覆盖整个地图的黑色层

    return fogSystem;
  }
}
