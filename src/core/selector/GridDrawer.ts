import * as PIXI from "pixi.js";
import { tileSize, zIndexSetting, is25dEnabled } from "../envSetting";
import { golbalSetting } from "../golbalSetting";
import { cameraManager } from "../service/2dcanvas/cameraTool";
import { worldToScreen } from "../service/2dcanvas/renderUtils";

/**
 * 格子绘制配置选项
 */
export interface GridDrawOptions {
  /** 透明度，默认 0.4 */
  alpha?: number;
  /** z-index，默认 zIndexSetting.spriteZIndex */
  zIndex?: number;
  /** 事件模式，默认 "static" */
  eventMode?: PIXI.EventMode;
  /** 渲染层名称，默认 "spriteLayer" */
  layerName?: keyof typeof golbalSetting.rlayers;
  /** 是否自动添加到容器，默认 true */
  autoAttach?: boolean;
}

/**
 * 格子数据格式
 */
export type GridData = {
  x: number;
  y: number;
  step: number;
} | null;

/**
 * 格子集合格式
 */
export type GridsMap = { [key: string]: GridData };

/**
 * 格子坐标
 */
export interface GridCoord {
  x: number;
  y: number;
}

/**
 * 2D 点
 */
export interface Point2D {
  x: number;
  y: number;
}

/**
 * GridDrawer - 公共格子绘制工具类
 *
 * 封装所有 selector 中共同的格子绘制逻辑，提供统一的绘制接口。
 */
export class GridDrawer {
  /**
   * 绘制单个格子（支持 2.5D 透视变换）
   * @param graphics PIXI.Graphics 对象
   * @param gridX 格子 x 坐标
   * @param gridY 格子 y 坐标
   * @param color 填充颜色
   */
  private static drawGridCell(
    graphics: PIXI.Graphics,
    gridX: number,
    gridY: number,
    color: string | number
  ): void {
    // 格子四个角的世界坐标
    const worldCorners = [
      { x: gridX * tileSize, y: gridY * tileSize },           // 左上
      { x: (gridX + 1) * tileSize, y: gridY * tileSize },     // 右上
      { x: (gridX + 1) * tileSize, y: (gridY + 1) * tileSize }, // 右下
      { x: gridX * tileSize, y: (gridY + 1) * tileSize },     // 左下
    ];

    if (is25dEnabled) {
      // 2.5D 模式：应用透视变换
      const cameraParams = cameraManager.getCameraParams();
      const screenCorners: Point2D[] = [];

      for (const corner of worldCorners) {
        const screenPos = worldToScreen(corner.x, corner.y, 1700, 800, cameraParams);
        if (screenPos) {
          screenCorners.push(screenPos);
        }
      }

      // 如果四个角都在可见范围内，绘制多边形
      if (screenCorners.length === 4) {
        graphics.poly(screenCorners.flatMap((p) => [p.x, p.y]));
        graphics.fill({ color });
        return;
      }
    }

    // 2D 模式或变换失败：使用普通矩形
    graphics.rect(worldCorners[0].x, worldCorners[0].y, tileSize, tileSize);
    graphics.fill({ color });
  }

  /**
   * 绘制格子集合
   * @param grids 格子集合，key 为 "x,y" 字符串
   * @param color 填充颜色（支持颜色名、十六进制、数字格式）
   * @param options 绘制选项
   * @returns PIXI.Graphics 对象
   */
  static drawGrids(
    grids: GridsMap,
    color: string | number,
    options: GridDrawOptions = {}
  ): PIXI.Graphics {
    const {
      alpha = 0.4,
      eventMode = "static",
      layerName = "spriteLayer",
      autoAttach = true,
    } = options;

    const graphics = new PIXI.Graphics();
    graphics.alpha = alpha;
    graphics.zIndex = 0;
    graphics.eventMode = eventMode;

    graphics.clear();
    if (grids) {
      Object.keys(grids).forEach((key) => {
        const [x, y] = key.split(",").map(Number);
        GridDrawer.drawGridCell(graphics, x, y, color);
      });
    }

    if (autoAttach) {
      GridDrawer.attachToLayer(graphics, layerName);
    }

    return graphics;
  }

  /**
   * 绘制指定坐标列表的格子
   * @param gridCoords 格子坐标数组
   * @param color 填充颜色
   * @param options 绘制选项
   * @returns PIXI.Graphics 对象
   */
  static drawGridList(
    gridCoords: GridCoord[],
    color: string | number,
    options: GridDrawOptions = {}
  ): PIXI.Graphics {
    const grids: GridsMap = {};
    gridCoords.forEach((coord) => {
      grids[`${coord.x},${coord.y}`] = { x: coord.x, y: coord.y, step: 0 };
    });
    return GridDrawer.drawGrids(grids, color, options);
  }

  /**
   * 绘制单个格子
   * @param x 格子 x 坐标
   * @param y 格子 y 坐标
   * @param color 填充颜色
   * @param options 绘制选项
   * @returns PIXI.Graphics 对象
   */
  static drawSingleGrid(
    x: number,
    y: number,
    color: string | number,
    options: GridDrawOptions = {}
  ): PIXI.Graphics {
    return GridDrawer.drawGridList([{ x, y }], color, options);
  }

  /**
   * 将 Graphics 对象附加到指定图层
   * @param graphics PIXI.Graphics 对象
   * @param layerName 图层名称
   * @returns 是否成功附加
   */
  static attachToLayer(
    graphics: PIXI.Graphics,
    layerName: keyof typeof golbalSetting.rlayers = "spriteLayer"
  ): boolean {
    const container = golbalSetting.spriteContainer;
    if (!container) {
      console.warn("Map container not found.");
      return false;
    }

    const layer = golbalSetting.rlayers[layerName];
    if (!layer) {
      console.warn(`Layer '${layerName}' not found in global settings.`);
      return false;
    }

    layer.attach(graphics);
    container.addChild(graphics);
    return true;
  }

  /**
   * 移除 Graphics 对象
   * @param graphics PIXI.Graphics 对象，可为 null
   */
  static removeGraphics(graphics: PIXI.Graphics | null): void {
    if (!graphics) return;

    if (graphics.parent) {
      graphics.parent.removeChild(graphics);
    }
    graphics.destroy();
  }

  /**
   * 清除并重新绘制 Graphics 对象
   * @param oldGraphics 旧的 Graphics 对象
   * @param grids 格子集合
   * @param color 填充颜色
   * @param options 绘制选项
   * @returns 新的 PIXI.Graphics 对象
   */
  static redrawGrids(
    oldGraphics: PIXI.Graphics | null,
    grids: GridsMap,
    color: string | number,
    options: GridDrawOptions = {}
  ): PIXI.Graphics {
    if (oldGraphics) {
      GridDrawer.removeGraphics(oldGraphics);
    }
    return GridDrawer.drawGrids(grids, color, options);
  }

  /**
   * 将像素坐标转换为格子坐标
   * @param x 像素 x 坐标
   * @param y 像素 y 坐标
   * @returns 格子坐标
   */
  static pixelToGrid(x: number, y: number): GridCoord {
    return {
      x: Math.floor(x / tileSize),
      y: Math.floor(y / tileSize),
    };
  }

  /**
   * 将格子坐标转换为像素坐标（左上角）
   * @param gridX 格子 x 坐标
   * @param gridY 格子 y 坐标
   * @returns 像素坐标
   */
  static gridToPixel(gridX: number, gridY: number): { x: number; y: number } {
    return {
      x: gridX * tileSize,
      y: gridY * tileSize,
    };
  }

  /**
   * 将格子坐标转换为像素坐标（中心点）
   * @param gridX 格子 x 坐标
   * @param gridY 格子 y 坐标
   * @returns 像素坐标（中心点）
   */
  static gridToPixelCenter(gridX: number, gridY: number): { x: number; y: number } {
    return {
      x: gridX * tileSize + tileSize / 2,
      y: gridY * tileSize + tileSize / 2,
    };
  }

  /**
   * 从全局坐标获取相对于 rootContainer 的坐标
   * @param globalX 全局 x 坐标
   * @param globalY 全局 y 坐标
   * @returns 相对坐标
   */
  static getRelativePosition(globalX: number, globalY: number): { x: number; y: number } {
    let x = globalX;
    let y = globalY;
    if (golbalSetting.rootContainer) {
      x -= golbalSetting.rootContainer.x;
      y -= golbalSetting.rootContainer.y;
    }
    return { x, y };
  }

  /**
   * 从事件数据中获取格子坐标
   * @param event PIXI 事件对象
   * @returns 格子坐标
   */
  static getGridFromEvent(event: any): GridCoord {
    const { x, y } = event.data.global;
    const relative = GridDrawer.getRelativePosition(x, y);
    return GridDrawer.pixelToGrid(relative.x, relative.y);
  }

  /**
   * 创建格子集合的 Set
   * @param grids 格子集合
   * @returns 格子坐标 Set
   */
  static gridsToSet(grids: GridsMap): Set<GridCoord> {
    const set = new Set<GridCoord>();
    Object.keys(grids).forEach((key) => {
      const [x, y] = key.split(",").map(Number);
      const gridData = grids[key];
      if (gridData) {
        set.add({ x, y });
      }
    });
    return set;
  }

  /**
   * 格子坐标转字符串 key
   * @param x 格子 x 坐标
   * @param y 格子 y 坐标
   * @returns "x,y" 格式的字符串
   */
  static gridToKey(x: number, y: number): string {
    return `${x},${y}`;
  }

  /**
   * 字符串 key 转格子坐标
   * @param key "x,y" 格式的字符串
   * @returns 格子坐标
   */
  static keyToGrid(key: string): GridCoord {
    const [x, y] = key.split(",").map(Number);
    return { x, y };
  }
}
