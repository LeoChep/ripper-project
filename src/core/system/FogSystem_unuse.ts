import { makeFog } from "./FogSystem";
import type { TiledMap } from "../MapClass";
import type { Unit } from "../units/Unit";

import { segmentsIntersect } from "../utils/MathUtil";
import * as PIXI from "pixi.js";
import { golbalSetting } from "../golbalSetting";
// @ts-expect-error - JS file with separate .d.ts type definitions
import VisibilityPolygon from "../../utils/visibility_polygon_dev.js";
import type { Point, Segment, Polygon } from "../../utils/visibility_polygon.d";
import polygonClipping from "polygon-clipping";

const tileSize = 64;

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
          cellSegments.forEach(seg => segments.add(seg));
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
    this.grid.forEach(cell => {
      totalSegments += cell.length;
      maxSegments = Math.max(maxSegments, cell.length);
    });
    return {
      cellCount: this.grid.size,
      totalSegments,
      avgSegmentsPerCell: totalSegments / this.grid.size,
      maxSegmentsPerCell: maxSegments
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
  private gradientStepSize: number = 10; // 每层的宽度（像素）= 0.5个tile
  
  constructor() {
    FogSystem.instanse = this;
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
  }
  
  /**
   * 计算边数据的哈希值，用于检测变化
   */
  private calculateEdgesHash(edges: any[]): string {
    // 简单的哈希：统计边的数量和状态
    let hash = `${edges.length}`;
    edges.forEach(edge => {
      if (!edge.onlyBlock && edge.useable === true) {
        hash += `|${edge.id}:${edge.x1},${edge.y1},${edge.x2},${edge.y2}`;
      }
    });
    return hash;
  }
  caculteVersionByUnit = (unit: Unit): Polygon | null => {
    const mapPassiable = golbalSetting.map;
    if (!mapPassiable) {
      return null;
    }

    // 计算单位的视野范围
    const visionRadius = 20; // 假设单位有vision属性，单位为格

    // 单位中心点
    const position: Point = [
      unit.x + tileSize / 2,
      unit.y + tileSize / 2,
    ];

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
      return visionPolygon;
    }

    // 使用 visibility_polygon 库计算可视多边形
    try {
      const visibilityPolygon = VisibilityPolygon.compute(position, nearbySegments);
      
      return visibilityPolygon;
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
    this.brokenSegments = VisibilityPolygon.breakIntersections(this.allSegments);
    
    // 将所有线段添加到空间网格
    this.brokenSegments.forEach(seg => {
      this.spatialGrid!.addSegment(seg);
    });
    
    // 保存当前状态的哈希值
    this.edgesHash = this.calculateEdgesHash(edges);
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

  /**
   * 合并多个可视多边形为一个联合多边形
   * @param polygons 多个可视多边形数组
   * @returns 合并后的多边形数组（外环+内环的格式：[外环, 内环1, 内环2, ...]）
   */
  private mergeVisibilityPolygons(polygons: Polygon[]): Polygon[][] {
    if (polygons.length === 0) {
      return [];
    }
    
    if (polygons.length === 1) {
      return [polygons];
    }
    
    try {
      // 将Polygon格式转换为polygon-clipping库所需的格式
      // polygon-clipping格式: [[[x1, y1], [x2, y2], ...]] (注意额外的嵌套层)
      const clipperPolygons: polygonClipping.Polygon[] = polygons.map(poly => {
        // 每个多边形是一个环的数组，外环逆时针，内环（孔）顺时针
        return [poly.map(point => [point[0], point[1]] as [number, number])];
      });
      
      // 执行union操作，将所有多边形合并
      // 使用数组展开传递多个多边形参数
      const [first, ...rest] = clipperPolygons;
      const unionResult = rest.length > 0 
        ? polygonClipping.union(first, ...rest)
        : [first];
      
      // 转换回Polygon格式，保留所有环（外环+内环）
      const mergedPolygons: Polygon[][] = [];
      unionResult.forEach(multiPoly => {
        // multiPoly是一个多边形，包含外环[0]和可能的内环[1], [2]...
        if (multiPoly.length > 0) {
          const rings: Polygon[] = [];
          multiPoly.forEach(ring => {
            rings.push(ring.map(point => [point[0], point[1]] as Point));
          });
          mergedPolygons.push(rings);
        }
      });
      
      return mergedPolygons;
    } catch (error) {
      // 如果合并失败，返回原始多边形
      return polygons.map(p => [p]);
    }
  }

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
      return;
    }
    if (this.mask && container.getChildByLabel("fogWarMask")) {
      this.mask.children.forEach((child) => {
        child.destroy();
      });
      this.mask.removeChildren();
    } else {
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
    
    if (visiblePointsArr.length > 0) {
      // 获取地图尺寸
      const map = golbalSetting.map;
      if (!map) return;
      const mapWidth = map.width * map.tilewidth;
      const mapHeight = map.height * map.tileheight;
      
      // 提取所有可视多边形
      const allVisibilityPolygons = visiblePointsArr.map(data => data.visibilityPolygon);
      
      // 合并所有可视多边形
      const mergedPolygons = this.mergeVisibilityPolygons(allVisibilityPolygons);
      
      // 创建 Canvas 来绘制带孔洞的遮罩
      const canvas = document.createElement('canvas');
      canvas.width = mapWidth;
      canvas.height = mapHeight;
      const ctx = canvas.getContext('2d')!;
      
      // 绘制全屏黑色
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      ctx.fillRect(0, 0, mapWidth, mapHeight);
      
      // 使用 destination-out 模式挖洞（可视区域）
      ctx.globalCompositeOperation = 'destination-out';
      
      // 绘制合并后的多边形（包含外环和内环）
      mergedPolygons.forEach((polygonWithHoles) => {
        // polygonWithHoles[0] 是外环，[1], [2]... 是内环（洞）
        if (polygonWithHoles.length === 0) return;
        
        ctx.beginPath();
        
        // 绘制外环（可视区域）
        const outerRing = polygonWithHoles[0];
        if (outerRing.length >= 3) {
          ctx.moveTo(outerRing[0][0], outerRing[0][1]);
          for (let i = 1; i < outerRing.length; i++) {
            ctx.lineTo(outerRing[i][0], outerRing[i][1]);
          }
          ctx.closePath();
        }
        
        // 绘制内环（洞，应该保持迷雾）
        // 使用反向绘制顺序，配合evenodd填充规则
        for (let ringIdx = 1; ringIdx < polygonWithHoles.length; ringIdx++) {
          const hole = polygonWithHoles[ringIdx];
          if (hole.length >= 3) {
            // 反向绘制内环以创建洞
            ctx.moveTo(hole[0][0], hole[0][1]);
            for (let i = hole.length - 1; i >= 0; i--) {
              ctx.lineTo(hole[i][0], hole[i][1]);
            }
            ctx.closePath();
          }
        }
        
        // 使用 evenodd 填充规则，自动处理洞
        ctx.fill('evenodd');
      });
      
      // 恢复绘制模式
      ctx.globalCompositeOperation = 'source-over';
      
      // 从 Canvas 创建纹理和精灵
      const texture = PIXI.Texture.from(canvas);
      const fogSprite = new PIXI.Sprite(texture);
      
      // 如果启用了渐变，添加模糊滤镜
      if (this.gradientLayers > 0) {
        const blurStrength = this.gradientLayers * this.gradientStepSize / 8;
        const blurFilter = new PIXI.BlurFilter({
          strength: blurStrength,
          quality: 4,
          kernelSize: 5
        });
        fogSprite.filters = [blurFilter];
      }
      
      this.mask.addChild(fogSprite);
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
