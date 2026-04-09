import * as PIXI from "pixi.js";
import {
  tileSize,
  zIndexSetting,
  is25dEnabled,
  appSetting,
} from "../envSetting";
import { golbalSetting } from "../golbalSetting";
import { cameraManager } from "../service/2dcanvas/cameraTool";
import { worldToScreen, screenToWorld } from "../service/2dcanvas/renderUtils";

/**
 * 将颜色数值转换为 darker 版本（边框用）
 * @param colorNumber 颜色数值（如 0xff0000）
 * @param factor 变暗因子，0-1 之间，默认 0.7
 * @returns 变暗后的颜色数值
 */
function darkenColor(colorNumber: number, factor: number = 0.7): number {
  const r = ((colorNumber >> 16) & 0xff) * factor;
  const g = ((colorNumber >> 8) & 0xff) * factor;
  const b = (colorNumber & 0xff) * factor;
  return (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
}

/**
 * 将颜色字符串转换为数值
 * @param color 颜色（字符串或数值）
 * @returns 颜色数值
 */
function colorToNumber(color: string | number): number {
  if (typeof color === "number") {
    return color;
  }
  // 处理十六进制字符串
  if (color.startsWith("#")) {
    return parseInt(color.slice(1), 16);
  }
  // 处理 rgb/hsl 等其他格式，使用临时 canvas 转换
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");
  if (tempCtx) {
    tempCtx.fillStyle = color;
    return parseInt(tempCtx.fillStyle.slice(1), 16);
  }
  return 0x000000;
}

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
  /** 是否随相机实时更新（仅在 2.5D 模式下有效），默认 false */
  dynamicUpdate?: boolean;
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
 * 动态格子 Graphics - 随相机移动自动更新
 */
export class DynamicGridGraphics extends PIXI.Graphics {
  private grids: GridsMap;
  private color: string | number;
  private unsubscribe?: () => void;

  constructor(
    grids: GridsMap,
    color: string | number,
    options: GridDrawOptions
  ) {
    super();
    this.grids = grids;
    this.color = color;

    this.alpha = options.alpha ?? 0.4;
    this.zIndex = options.zIndex ?? 0;
    this.eventMode = options.eventMode ?? "static";

    // 初始绘制
    this.redraw();

    // 在 2.5D 模式下订阅相机变化
    setInterval(() => {
      if (this) {
        this.redraw();
      }
      
    }, 100);
  }

  /**
   * 重新绘制格子
   */
  private redraw(): void {
    if (this.destroyed) return;
    this.clear();
    if (this.grids) {
      Object.keys(this.grids).forEach((key) => {
        const [x, y] = key.split(",").map(Number);
        DynamicGridGraphics.drawGridCell(this, x, y, this.color);
      });
    }
  }

  /**
   * 绘制单个格子（静态方法，供内部使用）
   */
  private static drawGridCell(
    graphics: PIXI.Graphics,
    gridX: number,
    gridY: number,
    color: string | number
  ): void {
    // 格子四个角的世界坐标
    console.log(
      `Drawing grid cell at (${gridX}, ${gridY}) with color ${color}`
    );
    const worldCorners = [
      { x: gridX * tileSize, y: gridY * tileSize }, // 左上
      { x: (gridX + 1) * tileSize, y: gridY * tileSize }, // 右上
      { x: (gridX + 1) * tileSize, y: (gridY + 1) * tileSize }, // 右下
      { x: gridX * tileSize, y: (gridY + 1) * tileSize }, // 左下
    ];

    // 计算边框颜色（变暗版本）
    const colorNumber = colorToNumber(color);
    const borderColor = darkenColor(colorNumber, 0.6);

    if (is25dEnabled) {
      // 2.5D 模式：应用透视变换
      const cameraParams = cameraManager.getCameraParams();
      const screenCorners: Point2D[] = [];

      for (const corner of worldCorners) {
        const screenPos = worldToScreen(
          corner.x,
          corner.y,
          appSetting.width,
          appSetting.height,
          cameraParams
        );
        if (screenPos) {
          screenCorners.push(screenPos);
        }
      }

      // 如果四个角都在可见范围内，绘制多边形
      if (screenCorners.length === 4) {
        // 先绘制填充
        graphics.poly(screenCorners.flatMap((p) => [p.x, p.y]));
        graphics.fill({ color });

        // 再绘制边框
        graphics.poly(screenCorners.flatMap((p) => [p.x, p.y]));
        graphics.stroke({ width: 2, color: borderColor });
        return;
      }
    }

    // 2D 模式或变换失败：使用普通矩形
    graphics.rect(worldCorners[0].x, worldCorners[0].y, tileSize, tileSize);
    graphics.fill({ color });
    graphics.rect(worldCorners[0].x, worldCorners[0].y, tileSize, tileSize);
    graphics.stroke({ width: 2, color: borderColor });
  }

  /**
   * 更新格子数据
   */
  updateGrids(grids: GridsMap): void {
    this.grids = grids;
    this.redraw();
  }

  /**
   * 更新颜色
   */
  updateColor(color: string | number): void {
    this.color = color;
    this.redraw();
  }

  /**
   * 销毁时取消订阅
   */
  destroy(options?: {
    children?: boolean;
    texture?: boolean;
    baseTexture?: boolean;
  }): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
    }
    super.destroy(options);
  }
}

/**
 * GridDrawer - 公共格子绘制工具类
 *
 * 封装所有 selector 中共同的格子绘制逻辑，提供统一的绘制接口。
 */
export class GridDrawer {
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
      layerName = "spriteLayer",
      autoAttach = true,
      dynamicUpdate = is25dEnabled, // 2.5D 模式下默认启用动态更新
    } = options;

    // 如果需要动态更新，使用 DynamicGridGraphics
    const graphics = dynamicUpdate
      ? new DynamicGridGraphics(grids, color, options)
      : GridDrawer.createStaticGraphics(grids, color, options);

    if (autoAttach) {
      GridDrawer.attachToLayer(graphics, layerName);
    }

    return graphics;
  }

  /**
   * 创建静态 Graphics（不支持自动更新）
   */
  private static createStaticGraphics(
    grids: GridsMap,
    color: string | number,
    options: GridDrawOptions
  ): PIXI.Graphics {
    const { alpha = 0.4, zIndex = 0, eventMode = "static" } = options;

    const graphics = new PIXI.Graphics();
    graphics.alpha = alpha;
    graphics.zIndex = zIndex;
    graphics.eventMode = eventMode;

    graphics.clear();
    if (grids) {
      Object.keys(grids).forEach((key) => {
        const [x, y] = key.split(",").map(Number);
        GridDrawer.drawGridCell(graphics, x, y, color);
      });
    }

    return graphics;
  }

  /**
   * 绘制单个格子（静态方法，供内部使用）
   */
  private static drawGridCell(
    graphics: PIXI.Graphics,
    gridX: number,
    gridY: number,
    color: string | number
  ): void {
    // 格子四个角的世界坐标
    const worldCorners = [
      { x: gridX * tileSize, y: gridY * tileSize }, // 左上
      { x: (gridX + 1) * tileSize, y: gridY * tileSize }, // 右上
      { x: (gridX + 1) * tileSize, y: (gridY + 1) * tileSize }, // 右下
      { x: gridX * tileSize, y: (gridY + 1) * tileSize }, // 左下
    ];

    // 计算边框颜色（变暗版本）
    const colorNumber = colorToNumber(color);
    const borderColor = darkenColor(colorNumber, 0.6);

    if (is25dEnabled) {
      // 2.5D 模式：应用透视变换
      const cameraParams = cameraManager.getCameraParams();
      const screenCorners: Point2D[] = [];

      for (const corner of worldCorners) {
        const screenPos = worldToScreen(
          corner.x,
          corner.y,
          1700,
          800,
          cameraParams
        );
        if (screenPos) {
          screenCorners.push(screenPos);
        }
      }

      // 如果四个角都在可见范围内，绘制多边形
      if (screenCorners.length === 4) {
        // 先绘制填充
        graphics.poly(screenCorners.flatMap((p) => [p.x, p.y]));
        graphics.fill({ color });

        // 再绘制边框
        graphics.poly(screenCorners.flatMap((p) => [p.x, p.y]));
        graphics.stroke({ width: 2, color: borderColor });
        return;
      }
    }

    // 2D 模式或变换失败：使用普通矩形
    graphics.rect(worldCorners[0].x, worldCorners[0].y, tileSize, tileSize);
    graphics.fill({ color });
    graphics.rect(worldCorners[0].x, worldCorners[0].y, tileSize, tileSize);
    graphics.stroke({ width: 2, color: borderColor });
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
  static gridToPixelCenter(
    gridX: number,
    gridY: number
  ): { x: number; y: number } {
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
  static getRelativePosition(
    globalX: number,
    globalY: number
  ): { x: number; y: number } {
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
    // PIXI v8+ 使用 event.global 而不是 event.data.global
    const global = event.global || event.data?.global;
    return GridDrawer.screenToGrid(global.x, global.y);
  }

  /**
   * 将屏幕坐标转换为格子坐标（自动处理 2.5D 模式）
   * @param screenX 屏幕 x 坐标
   * @param screenY 屏幕 y 坐标
   * @returns 格子坐标
   */
  static screenToGrid(screenX: number, screenY: number): GridCoord {
    // 先获取相对于 rootContainer 的坐标
    const relative = GridDrawer.getRelativePosition(screenX, screenY);

    if (is25dEnabled) {
      // 2.5D 模式：使用 screenToWorld 转换
      const cameraParams = cameraManager.getCameraParams();
      const worldPos = screenToWorld(
        relative.x,
        relative.y,
        1700,
        800,
        cameraParams
      );
      if (worldPos) {
        return {
          x: Math.floor(worldPos.x / tileSize),
          y: Math.floor(worldPos.y / tileSize),
        };
      }
    }

    // 2D 模式或转换失败：直接使用像素坐标
    return GridDrawer.pixelToGrid(relative.x, relative.y);
  }

  /**
   * 创建悬停格子 Graphics（用于指针悬停高亮）
   * @param gridX 格子 x 坐标
   * @param gridY 格子 y 坐标
   * @param color 填充颜色
   * @param options 绘制选项
   * @returns DynamicGridGraphics 对象（自动随相机更新）
   */
  static createHoverGraphics(
    gridX: number,
    gridY: number,
    color: string | number,
    options: GridDrawOptions = {}
  ): PIXI.Graphics {
    const grids: GridsMap = {};
    grids[`${gridX},${gridY}`] = { x: gridX, y: gridY, step: 0 };

    const {
      alpha = 0.5,
      zIndex = zIndexSetting.spriteZIndex + 2,
      eventMode = "none",
      layerName = "selectLayer",
      autoAttach = true,
      dynamicUpdate = is25dEnabled,
    } = options;
    console.log(`Creating hover graphics at (${gridX}, ${gridY}) with color ${color}`);
    return new DynamicGridGraphics(grids, color, {
      alpha,
      zIndex,
      eventMode,
      layerName,
      autoAttach,
      dynamicUpdate,
    });
  }

  /**
   * 创建尺寸格子 Graphics（用于大单位）
   * @param gridX 起始格子 x 坐标
   * @param gridY 起始格子 y 坐标
   * @param size 单位大小（1=1x1, 2=2x2）
   * @param color 填充颜色
   * @param options 绘制选项
   * @returns DynamicGridGraphics 对象（自动随相机更新）
   */
  static createSizeGraphics(
    gridX: number,
    gridY: number,
    size: number,
    color: string | number,
    options: GridDrawOptions = {}
  ): PIXI.Graphics {
    const grids: GridsMap = {};
    for (let dx = 0; dx < size; dx++) {
      for (let dy = 0; dy < size; dy++) {
        grids[`${gridX + dx},${gridY + dy}`] = {
          x: gridX + dx,
          y: gridY + dy,
          step: 0,
        };
      }
    }

    const {
      alpha = 0.5,
      zIndex = 2,
      eventMode = "none",
      layerName = "spriteLayer", // 使用 selectLayer 而不是 spriteLayer
      autoAttach = true,
      dynamicUpdate = is25dEnabled,
    } = options;
    console.log(`Creating size graphics at (${gridX}, ${gridY}) with size ${size} and color ${color}`);
    return this.drawGrids(grids, color, {
      alpha,
      zIndex,
      eventMode,
      layerName,
      autoAttach,
      dynamicUpdate,
    });
    
  }

  /**
   * 更新悬停格子位置
   * @param hoverGraphics 悬停 Graphics 对象
   * @param gridX 新的格子 x 坐标
   * @param gridY 新的格子 y 坐标
   */
  static updateHoverGraphics(
    hoverGraphics: PIXI.Graphics | null,
    gridX: number,
    gridY: number
  ): void {
    if (hoverGraphics instanceof DynamicGridGraphics) {
      const grids: GridsMap = {};
      grids[`${gridX},${gridY}`] = { x: gridX, y: gridY, step: 0 };
      hoverGraphics.updateGrids(grids);
    }
  }

  /**
   * 更新尺寸格子位置
   * @param sizeGraphics 尺寸 Graphics 对象
   * @param gridX 新的格子 x 坐标
   * @param gridY 新的格子 y 坐标
   * @param size 单位大小
   */
  static updateSizeGraphics(
    sizeGraphics: PIXI.Graphics | null,
    gridX: number,
    gridY: number,
    size: number
  ): void {
    if (sizeGraphics instanceof DynamicGridGraphics) {
      const grids: GridsMap = {};
      for (let dx = 0; dx < size; dx++) {
        for (let dy = 0; dy < size; dy++) {
          grids[`${gridX + dx},${gridY + dy}`] = {
            x: gridX + dx,
            y: gridY + dy,
            step: 0,
          };
        }
      }
      sizeGraphics.updateGrids(grids);
    }
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
