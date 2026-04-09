import * as PIXI from "pixi.js";
import { tileSize, zIndexSetting } from "../envSetting";
import { golbalSetting } from "../golbalSetting";

/**
 * 呼吸效果配置
 */
export interface BreathingEffect {
  /** 是否启用呼吸效果 */
  enabled: boolean;
  /** 最小透明度 */
  minAlpha: number;
  /** 最大透明度 */
  maxAlpha: number;
  /** 呼吸周期（毫秒） */
  period: number;
}

/**
 * 格子数据格式
 */
export type GridData = {
  x: number;
  y: number;
  step?: number;
};

/**
 * 格子系统的多种输入格式
 */
export type GridInput =
  | { [key: string]: GridData | null }  // "x,y": {x, y, step} 格式
  | GridData[]                            // 数组格式
  | Set<GridData>;                        // Set 格式

/**
 * 图层类型
 */
export type LayerType = keyof typeof golbalSetting.rlayers;

/**
 * GridDrawer 配置选项
 */
export interface GridDrawerOptions {
  /** 格子颜色 */
  color?: string | number;
  /** 透明度 (默认: 0.4) */
  alpha?: number;
  /** 层级 (默认: spriteZIndex) */
  zIndex?: number;
  /** 事件模式 (默认: "static") */
  eventMode?: "static" | "none" | "passive" | "dynamic";
  /** 目标图层 (默认: spriteLayer) */
  layer?: LayerType;
  /** 是否立即添加到容器 (默认: true) */
  addToContainer?: boolean;
  /** 是否在绘制前清理旧的graphics (默认: true) */
  clearPrevious?: boolean;
  /** 是否绘制格子边框 (默认: true) */
  showBorder?: boolean;
  /** 边框宽度 (默认: 2) */
  borderWidth?: number;
  /** 边框颜色暗化程度 0-1，值越大边框越暗 (默认: 0.3) */
  borderDarken?: number;
}

/**
 * 格子绘制器 - 统一的格子绘制工具类
 *
 * 用于绘制游戏中的可选格子、范围提示等视觉效果
 *
 * @example
 * ```ts
 * const drawer = new GridDrawer();
 * const grids = { "0,0": { x: 0, y: 0, step: 0 }, "0,1": { x: 0, y: 1, step: 1 } };
 * const graphics = drawer.drawGrids(grids, { color: "#66ccff" });
 * ```
 */
export class GridDrawer {
  /** 当前使用的 Graphics 对象 */
  public graphics: PIXI.Graphics | null = null;
  /** 悬停格子专用的 Graphics 对象 */
  public hoverGraphics: PIXI.Graphics | null = null;

  /**
   * 绘制格子
   *
   * @param grids - 格子系统数据
   * @param options - 绘制配置选项
   * @returns PIXI.Graphics 对象
   */
  drawGrids(grids: GridInput, options: GridDrawerOptions = {}): PIXI.Graphics {
    const {
      color = 0x66ccff,
      alpha = 0.4,
      zIndex = zIndexSetting.spriteZIndex,
      eventMode = "static",
      layer = "spriteLayer",
      addToContainer = true,
      clearPrevious = true,
      showBorder = true,
      borderWidth = 2,
      borderDarken = 0.3,
    } = options;

    // 清理旧的 graphics，避免重复绘制
    if (clearPrevious) {
      this.clearAndRemove();
    }

    // 转换颜色格式
    const fillColor = this.parseColor(color);
    const borderColor = this.darkenColor(fillColor, borderDarken);

    // 创建新的 Graphics 对象
    const graphics = new PIXI.Graphics();
    graphics.alpha = alpha;
    graphics.zIndex = zIndex;
    graphics.eventMode = eventMode;
    graphics.clear();

    // 绘制格子
    const gridList = this.normalizeGrids(grids);
    for (const grid of gridList) {
      const drawX = grid.x * tileSize;
      const drawY = grid.y * tileSize;

      // 绘制填充
      graphics.rect(drawX, drawY, tileSize, tileSize);
      graphics.fill({ color: fillColor });

      // 绘制边框
      if (showBorder) {
        graphics.rect(drawX, drawY, tileSize, tileSize);
        graphics.stroke({
          width: borderWidth,
          color: borderColor,
        });
      }
    }

    // 添加到容器
    if (addToContainer) {
      this.addToContainer(graphics, layer);
    }

    this.graphics = graphics;
    return graphics;
  }

  /**
   * 更新现有 Graphics 的格子
   *
   * @param grids - 新的格子系统数据
   * @param options - 绘制配置选项（color, alpha, showBorder, borderWidth, borderDarken 可选）
   */
  updateGrids(grids: GridInput, options: Pick<GridDrawerOptions, "color" | "alpha" | "showBorder" | "borderWidth" | "borderDarken"> = {}): void {
    if (!this.graphics) {
      throw new Error("No graphics to update. Call drawGrids first.");
    }

    const {
      color,
      alpha,
      showBorder = true,
      borderWidth = 2,
      borderDarken = 0.3,
    } = options;

    if (alpha !== undefined) {
      this.graphics.alpha = alpha;
    }

    this.graphics.clear();

    // 使用默认颜色或新颜色
    const fillColor = color !== undefined ? this.parseColor(color) : 0x66ccff;
    const borderColor = this.darkenColor(fillColor, borderDarken);

    const gridList = this.normalizeGrids(grids);
    for (const grid of gridList) {
      const drawX = grid.x * tileSize;
      const drawY = grid.y * tileSize;

      // 绘制填充
      this.graphics.rect(drawX, drawY, tileSize, tileSize);
      this.graphics.fill({ color: fillColor });

      // 绘制边框
      if (showBorder) {
        this.graphics.rect(drawX, drawY, tileSize, tileSize);
        this.graphics.stroke({
          width: borderWidth,
          color: borderColor,
        });
      }
    }
  }

  /**
   * 显示悬停格子
   * 使用独立的 graphics 对象，不干扰主要格子绘制
   *
   * @param grids - 格子系统数据
   * @param options - 绘制配置选项
   * @returns PIXI.Graphics 对象
   */
  showHoverGrids(grids: GridInput, options: Omit<GridDrawerOptions, "clearPrevious"> = {}): PIXI.Graphics {
    const {
      color = 0xffff00,
      alpha = 0.6,
      zIndex = zIndexSetting.spriteZIndex + 1,
      eventMode = "none",
      layer = "spriteLayer",
      addToContainer = true,
      showBorder = true,
      borderWidth = 2,
      borderDarken = 0.3,
    } = options;

    // 清理旧的 hover graphics
    this.hideHoverGrids();

    // 转换颜色格式
    const fillColor = this.parseColor(color);
    const borderColor = this.darkenColor(fillColor, borderDarken);

    // 创建新的 Graphics 对象用于悬停效果
    const graphics = new PIXI.Graphics();
    graphics.alpha = alpha;
    graphics.zIndex = zIndex;
    graphics.eventMode = eventMode;
    graphics.clear();

    // 绘制格子
    const gridList = this.normalizeGrids(grids);
    for (const grid of gridList) {
      const drawX = grid.x * tileSize;
      const drawY = grid.y * tileSize;

      // 绘制填充
      graphics.rect(drawX, drawY, tileSize, tileSize);
      graphics.fill({ color: fillColor });

      // 绘制边框
      if (showBorder) {
        graphics.rect(drawX, drawY, tileSize, tileSize);
        graphics.stroke({
          width: borderWidth,
          color: borderColor,
        });
      }
    }

    // 添加到容器
    if (addToContainer) {
      this.addToContainer(graphics, layer);
    }

    this.hoverGraphics = graphics;
    return graphics;
  }

  /**
   * 更新悬停格子
   *
   * @param grids - 新的格子系统数据
   * @param options - 绘制配置选项
   */
  updateHoverGrids(grids: GridInput, options: Pick<GridDrawerOptions, "color" | "alpha" | "showBorder" | "borderWidth" | "borderDarken"> = {}): void {
    if (!this.hoverGraphics) {
      this.showHoverGrids(grids, options);
      return;
    }

    const {
      color,
      alpha,
      showBorder = true,
      borderWidth = 2,
      borderDarken = 0.3,
    } = options;

    if (alpha !== undefined) {
      this.hoverGraphics.alpha = alpha;
    }

    this.hoverGraphics.clear();

    // 使用默认颜色或新颜色
    const fillColor = color !== undefined ? this.parseColor(color) : 0xffff00;
    const borderColor = this.darkenColor(fillColor, borderDarken);

    const gridList = this.normalizeGrids(grids);
    for (const grid of gridList) {
      const drawX = grid.x * tileSize;
      const drawY = grid.y * tileSize;

      // 绘制填充
      this.hoverGraphics.rect(drawX, drawY, tileSize, tileSize);
      this.hoverGraphics.fill({ color: fillColor });

      // 绘制边框
      if (showBorder) {
        this.hoverGraphics.rect(drawX, drawY, tileSize, tileSize);
        this.hoverGraphics.stroke({
          width: borderWidth,
          color: borderColor,
        });
      }
    }
  }

  /**
   * 隐藏悬停格子
   * 清除 hoverGraphics 并从容器中移除
   */
  hideHoverGrids(): void {
    if (this.hoverGraphics) {
      // 先从父容器中移除
      if (this.hoverGraphics.parent) {
        this.hoverGraphics.parent.removeChild(this.hoverGraphics);
      }
      // 销毁 graphics 对象
      this.hoverGraphics.destroy({ children: true });
      this.hoverGraphics = null;
    }
  }

  /**
   * 清除 Graphics 内容并从容器中移除
   * 安全处理：即使 graphics 未添加到容器也能正常清理
   * 同时也会清理 hoverGraphics
   */
  clearAndRemove(): void {
    // 清理主 graphics
    if (this.graphics) {
      // 先从父容器中移除
      if (this.graphics.parent) {
        this.graphics.parent.removeChild(this.graphics);
      }
      // 销毁 graphics 对象
      this.graphics.destroy({ children: true });
      this.graphics = null;
    }
    // 同时清理悬停 graphics
    this.hideHoverGrids();
  }

  /**
   * 只清除 Graphics 内容，不从容器移除
   */
  clear(): void {
    if (this.graphics) {
      this.graphics.clear();
    }
  }

  /**
   * 设置 Graphics 的事件模式
   */
  setEventMode(mode: "static" | "none" | "passive" | "dynamic"): void {
    if (this.graphics) {
      this.graphics.eventMode = mode;
    }
  }

  /**
   * 设置 Graphics 的透明度
   */
  setAlpha(alpha: number): void {
    if (this.graphics) {
      this.graphics.alpha = alpha;
    }
  }

  /**
   * 设置 Graphics 的层级
   */
  setZIndex(zIndex: number): void {
    if (this.graphics) {
      this.graphics.zIndex = zIndex;
    }
  }

  /**
   * 将像素坐标转换为格子坐标
   *
   * @param x - 像素 X 坐标
   * @param y - 像素 Y 坐标
   * @returns 格子坐标
   */
  static getXY(x: number, y: number): { x: number; y: number } {
    return {
      x: Math.floor(x / tileSize),
      y: Math.floor(y / tileSize),
    };
  }

  /**
   * 获取全局的单例 GridDrawer 实例
   */
  private static instance: GridDrawer | null = null;

  static getInstance(): GridDrawer {
    if (!GridDrawer.instance) {
      GridDrawer.instance = new GridDrawer();
    }
    return GridDrawer.instance;
  }

  /**
   * 标准化格子系统数据为统一的数组格式
   */
  private normalizeGrids(grids: GridInput): GridData[] {
    if (Array.isArray(grids)) {
      return grids;
    }

    if (grids instanceof Set) {
      return Array.from(grids);
    }

    // 对象格式 { "x,y": {x, y, step} | null }
    const result: GridData[] = [];
    for (const key in grids) {
      const value = grids[key];
      if (value !== null) {
        const [xStr, yStr] = key.split(",");
        result.push({x:parseInt(xStr), y: parseInt(yStr), step: value.step});
      }
    }
    return result;
  }

  /**
   * 解析颜色格式
   * 支持 "#hex", "0xhex", 数字格式，以及颜色名称 (如 "red", "blue" 等)
   */
  private parseColor(color: string | number): number {
    if (typeof color === "number") {
      return color;
    }

    if (typeof color === "string") {
      // 使用 PIXI.Color 来解析所有颜色格式，包括颜色名称
      try {
        const pixiColor = new PIXI.Color(color);
        return pixiColor.toNumber();
      } catch {
        // 如果解析失败，返回默认颜色
        return 0x66ccff;
      }
    }

    return 0x66ccff; // 默认颜色
  }

  /**
   * 将颜色变暗
   * @param color 原始颜色（数字格式）
   * @param amount 变暗程度 0-1，值越大越暗
   * @returns 变暗后的颜色
   */
  private darkenColor(color: number, amount: number): number {
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;

    const newR = Math.floor(r * (1 - amount));
    const newG = Math.floor(g * (1 - amount));
    const newB = Math.floor(b * (1 - amount));

    return (newR << 16) | (newG << 8) | newB;
  }

  /**
   * 将 Graphics 添加到容器
   */
  private addToContainer(graphics: PIXI.Graphics, layer: LayerType): void {
    const container = golbalSetting.spriteContainer;
    if (!container) {
      console.warn("GridDrawer: spriteContainer not found.");
      return;
    }

    const layerObj = golbalSetting.rlayers[layer];
    if (!layerObj) {
      console.warn(`GridDrawer: layer "${layer}" not found in rlayers.`);
      return;
    }

    layerObj.attach(graphics);
    container.addChild(graphics);
  }
}
