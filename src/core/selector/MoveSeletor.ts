import * as PIXI from "pixi.js";
import { golbalSetting } from "../golbalSetting";
import { MessageTipSystem } from "../system/MessageTipSystem";
import { GridDrawer } from "../utils/GridDrawer";

import type { Unit } from "../units/Unit";
import { UnitSystem } from "../system/UnitSystem";

export class MoveSelector {
  public graphics: PIXI.Graphics | null = null;
  public removeFunction: (input: any) => void = () => {};
  public promise: Promise<any> | null = null;
  static getInstance(): MoveSelector {
    if (MoveSelector.instance) {
      return MoveSelector.instance;
    }
    MoveSelector.instance = new MoveSelector();
    return MoveSelector.instance;
  }
  public canCancel: boolean = true;
  public selected: { x: number; y: number }[] = [];
  public selecteNum: number = 1;
  public sizeGraphics: PIXI.Graphics | null = null;
  private static instance: MoveSelector | null = null;
  private gridDrawer: GridDrawer = new GridDrawer();

  /**
   * 清理所有选择器相关的图形
   * 用于切换控制器时确保没有残留图形
   */
  public cleanup(): void {
    this.gridDrawer.clearAndRemove(); // 也会清理悬停格子
    this.graphics = null;
    this.sizeGraphics = null;
    this.selected = [];
  }

  // 选择基本攻击
  public selectBasic(
    path: {
      [key: string]: {
        x: number;
        y: number;
        step: number;
      } | null;
    },
    unit: Unit,
    canCancel: boolean = true,
    checkPassiable: (gridX: number, gridY: number) => boolean = () => true
  ): MoveSelector {
    const selector = MoveSelector.getInstance();
    selector.canCancel = canCancel;
    selector.selected = [];

    // 选择逻辑

    this.graphics = this.drawGraphics(path, unit);
    this.graphics.eventMode = "static";
    selector.promise = Promise.resolve({});
    const graphics = selector.graphics;
    if (!graphics) {
      console.warn("Graphics not found in BasicSelector.");
      return selector;
    }
    // 保存 graphics 的引用，用于检查是否已被清理
    const graphicsRef = graphics;
    graphics.on("pointermove", (e) => {
      // 检查 selector 的 graphics 是否还存在（用于判断是否被清理）
      if (selector.graphics !== graphicsRef) {
        return; // 如果不匹配，说明已经被清理，不再处理
      }
      if (!golbalSetting.rootContainer) {
        return;
      }
      const x = e.data.global.x - golbalSetting.rootContainer?.x;
      const y = e.data.global.y - golbalSetting.rootContainer?.y;
      const targetXY = this.getXY(x, y);
      if (!UnitSystem.getInstance().checkOverlapAt(unit, targetXY.x, targetXY.y)) {
        this.drawSizeGrids(targetXY, unit, "blue");
      } else {
        // 隐藏悬停格子
        this.gridDrawer.hideHoverGrids();
        this.sizeGraphics = null;
      }
    });
    // 点击其他地方移除移动范围
    const removeGraphics = () => {
      MessageTipSystem.getInstance().clearBottomMessage();
      MessageTipSystem.getInstance().clearMessage();
      if (graphics.parent) {
        graphics.parent.removeChild(graphics);
        selector.removeFunction = () => {};
      }
      if (selector.sizeGraphics && selector.sizeGraphics.parent) {
        selector.sizeGraphics.parent.removeChild(selector.sizeGraphics);
      }
      selector.removeFunction = () => {};
    };
    let resolveCallback: (arg0: any) => void = () => {};
    const promise = new Promise<any>((resolve) => {
      resolveCallback = resolve;
    });
    selector.removeFunction = (input: any) => {
      removeGraphics();
      resolveCallback(input);
    };
    // 右键取消选择
    graphics.on("rightdown", (e) => {
      e.stopPropagation();

      if (selector.canCancel && selector.selected.length === 0) {
        removeGraphics();
        resolveCallback({ cancel: true });
      } else if (selector.selected.length > 0) {
        selector.selected.pop();
        MessageTipSystem.getInstance().setBottomMessage(
          `已选择 ${this.selected.length}/${this.selecteNum} 个目标`
        );
      }
    });
    //右键区域外
    const ms = golbalSetting.mapContainer;
    const msRemoveG = (e: { stopPropagation: () => void }) => {
      if (e.stopPropagation)
        e.stopPropagation();
      if (selector.canCancel) {
        removeGraphics();
        resolveCallback({ cancel: true });
        ms?.off("rightdown", msRemoveG);
      }
    };
    ms?.on("rightdown", msRemoveG);
    // this.removeFunction = msRemoveG;
    graphics.on("click", (e) => {
      console.log("click");
      e.stopPropagation();
      if (!golbalSetting.rootContainer) {
        return;
      }
      const x = e.data.global.x - golbalSetting.rootContainer?.x;
      const y = e.data.global.y - golbalSetting.rootContainer?.y;
      const xy = this.getXY(x, y);
      console.log("点击位置:", xy, UnitSystem.getInstance().checkOverlapAt(unit, xy.x, xy.y));
      if (!checkPassiable(xy.x, xy.y)|| UnitSystem.getInstance().checkOverlapAt(unit, xy.x, xy.y)) {
        console.warn("点击位置不可用");
        return;
      }
      if (this.selected.length < this.selecteNum) {
        if (!golbalSetting.rootContainer) {
          return;
        }
        const x = e.data.global.x - golbalSetting.rootContainer?.x;
        const y = e.data.global.y - golbalSetting.rootContainer?.y;
        const xy = this.getXY(x, y);
        this.selected.push(xy);
       
      }
      if (this.selected.length >= this.selecteNum) {
        // 选择完成
        removeGraphics();
       // MessageTipSystem.getInstance().clearBottomMessage();
        resolveCallback({
          cancel: false,
          event: e,
          selected: this.selected,
        });
      }
    });
    selector.promise = promise;
    return selector;
  }
  drawGraphics = (
    path: { [x: string]: { x: number; y: number; step: number } | null },
    unit: Unit
  ) => {
    // 计算所有需要绘制的格子（考虑单位大小）
    const grids = new Set<string>();
    if (path) {
      Object.keys(path).forEach((key) => {
        const [x, y] = key.split(",").map(Number);
        grids.add(`${x},${y}`);
        const size = unit.creature?.size;
        let range = 1;
        if (size === "big") {
          range = 2;
        }
        for (let dx = 0; dx < range; dx++) {
          for (let dy = 0; dy < range; dy++) {
            grids.add(`${x + dx},${y + dy}`);
          }
        }
      });
    }

    // 转换为GridDrawer支持的格式
    const gridArray: { x: number; y: number }[] = [];
    for (const grid of grids) {
      const [x, y] = grid.split(",").map(Number);
      gridArray.push({ x, y });
    }

    this.graphics = this.gridDrawer.drawGrids(gridArray, {
      color: 0x66ccff,
      zIndex: 21,
    });
    return this.graphics;
  };

  drawSizeGrids = (
    target: { x: number; y: number },
    unit: Unit,
    color: string
  ) => {
    // 计算单位占用的格子
    const size = unit.creature?.size;
    let range = 1;
    if (size === "big") {
      range = 2;
    }

    const grids: { x: number; y: number }[] = [];
    for (let dx = 0; dx < range; dx++) {
      for (let dy = 0; dy < range; dy++) {
        grids.push({
          x: target.x + dx,
          y: target.y + dy,
        });
      }
    }

    // 使用 gridDrawer 的悬停功能
    this.sizeGraphics = this.gridDrawer.showHoverGrids(grids, {
      color,
      zIndex: 21,
    });
    return this.sizeGraphics;
  };

  getXY = (x: number, y: number): { x: number; y: number } => {
    return GridDrawer.getXY(x, y);
  };
  // 生成可移动范围
}
