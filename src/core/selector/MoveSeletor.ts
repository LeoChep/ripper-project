import * as PIXI from "pixi.js";
import { zIndexSetting } from "../envSetting";
import { golbalSetting } from "../golbalSetting";
import { MessageTipSystem } from "../system/MessageTipSystem";
import type { Unit } from "../units/Unit";
import { UnitSystem } from "../system/UnitSystem";
import { GridDrawer } from "./GridDrawer";

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
    selector.graphics?.on("pointermove", (e) => {
      const targetXY = GridDrawer.screenToGrid(e.global.x, e.global.y);

      // 移除旧的悬停 Graphics
      if (this.sizeGraphics) {
        GridDrawer.removeGraphics(this.sizeGraphics);
        this.sizeGraphics = null;
      }

      // 检查是否重叠并绘制
      if (!UnitSystem.getInstance().checkOverlapAt(unit, targetXY.x, targetXY.y)) {
        const size = unit.creature?.size === "big" ? 2 : 1;
        this.sizeGraphics = GridDrawer.createSizeGraphics(
          targetXY.x,
          targetXY.y,
          size,
          0x4488ff,
          { alpha: 0.5 }
        );
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
      // 使用 GridDrawer 移除 sizeGraphics
      if (selector.sizeGraphics) {
        GridDrawer.removeGraphics(selector.sizeGraphics);
        selector.sizeGraphics = null;
      }
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

      // 使用 GridDrawer.screenToGrid 获取格子坐标
      const xy = GridDrawer.screenToGrid(e.global.x, e.global.y);
      console.log("点击位置:", xy, UnitSystem.getInstance().checkOverlapAt(unit, xy.x, xy.y));

      if (!checkPassiable(xy.x, xy.y) || UnitSystem.getInstance().checkOverlapAt(unit, xy.x, xy.y)) {
        console.warn("点击位置不可用");
        return;
      }

      if (this.selected.length < this.selecteNum) {
        this.selected.push(xy);
      }

      if (this.selected.length >= this.selecteNum) {
        // 选择完成
        removeGraphics();
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
    const grids = new Set<string>();
    if (path) {
      Object.keys(path).forEach((key) => {
        const [x, y] = key.split(",").map(Number);
        grids.add(`${x},${y}`);
        const size = unit.creature ? unit.creature.size : undefined;
        // 构建范围数组
        const rangeArrA = [];
        let range = 1; // 默认范围为0，可根据需要调整
        if (size === "big") {
          range = 2;
        }
        for (let dx = 0; dx < range; dx++) {
          for (let dy = 0; dy < range; dy++) {
            rangeArrA.push({
              x: x + dx,
              y: y + dy,
            });
          }
        }
        for (const grid of rangeArrA) {
          grids.add(`${grid.x},${grid.y}`);
        }
      });
    }
    const gridsMap: { [key: string]: { x: number; y: number; step: number } } = {};
    for (const grid of grids) {
      const [x, y] = grid.split(",").map(Number);
      gridsMap[grid] = { x, y, step: 0 };
    }
    this.graphics = GridDrawer.drawGrids(gridsMap, 0x66ccff, {
      zIndex: 0,
    });
    return this.graphics;
  };
  // 生成可移动范围
}
