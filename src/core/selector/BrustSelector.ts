import { tileSize } from "./../envSetting";
import { generateWays } from "../utils/PathfinderUtil";
import * as PIXI from "pixi.js";
import * as envSetting from "../envSetting";
import { golbalSetting } from "../golbalSetting";
import { MessageTipSystem } from "../system/MessageTipSystem";
import { checkPassiable } from "../system/AttackSystem";
import { GridDrawer } from "../utils/GridDrawer";
import type { Unit } from "../units/Unit";

export class BrustSelector {
  public graphics: PIXI.Graphics | null = null;
  public removeFunction: (input: any) => void = () => {};
  public promise: Promise<any> | null = null;
  static getInstance(): BrustSelector {
    if (BrustSelector.instance) {
      return BrustSelector.instance;
    }
    BrustSelector.instance = new BrustSelector();
    return BrustSelector.instance;
  }
  public canCancel: boolean = true;
  public selected: { x: number; y: number }[] = [];
  public selecteNum: number = 0;
  public brustRange: number = 1;
  public brustGraphics: PIXI.Graphics | null = null;
  public brustGridSet: Set<{ x: number; y: number; step: number }> = new Set();
  private static instance: BrustSelector | null = null;
  private gridDrawer: GridDrawer = new GridDrawer();

  /**
   * 清理所有选择器相关的图形
   * 用于切换控制器时确保没有残留图形
   */
  public cleanup(): void {
    this.gridDrawer.clearAndRemove();
    this.graphics = null;
    this.brustGraphics = null;
    this.selected = [];
  }

  // 选择基本攻击
  public selectBasic(
    grids: {
      [key: string]: {
        x: number;
        y: number;
        step: number;
      } | null;
    },
    brustRange: number,
    selectNum: number = 1,
    color: string = "yellow",
    brustColor: string = "red",
    canCancel: boolean = true,
    checkPassiable: (gridX: number, gridY: number) => boolean = () => true
  ): BrustSelector {
    const selector = BrustSelector.getInstance();
    selector.canCancel = canCancel;
    selector.selected = [];
    selector.selecteNum = selectNum;
    selector.brustRange = brustRange;

    MessageTipSystem.getInstance().setBottomMessage(
      `已选择 ${this.selected.length}/${this.selecteNum} 个目标`
    );
    // 选择逻辑
    const path = grids;
    this.graphics = this.drawGrids(path, color);
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
      console.log("pointermove", targetXY);
      this.drawBrustRange(targetXY, brustColor, brustRange);
    });
    // 点击其他地方移除移动范围
    const removeGraphics = () => {
      MessageTipSystem.getInstance().clearBottomMessage();
      MessageTipSystem.getInstance().clearMessage();
      if (graphics.parent) {
        graphics.parent.removeChild(graphics);
        selector.removeFunction = () => {};
      }
      if (selector.brustGraphics && selector.brustGraphics.parent) {
        selector.brustGraphics.parent.removeChild(selector.brustGraphics);
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
      e.stopPropagation();
      if (selector.canCancel && selector.selected.length === 0) {
        removeGraphics();
        resolveCallback({ cancel: true });
        ms?.off("rightdown", msRemoveG);
      } else if (selector.selected.length > 0) {
        selector.selected.pop();
        MessageTipSystem.getInstance().setBottomMessage(
          `已选择 ${this.selected.length}/${this.selecteNum} 个目标`
        );
      }
    };
    ms?.on("rightdown", msRemoveG);

    graphics.on("click", (e) => {
      console.log("click");
      e.stopPropagation();
      if (!golbalSetting.rootContainer) {
        return;
      }
      const x = e.data.global.x - golbalSetting.rootContainer?.x;
      const y = e.data.global.y - golbalSetting.rootContainer?.y;
      const xy = this.getXY(x, y);
      if (!checkPassiable(xy.x, xy.y)) {
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
        MessageTipSystem.getInstance().setBottomMessage(
          `已选择 ${this.selected.length}/${this.selecteNum} 个目标`
        );
      }
      if (this.selected.length >= this.selecteNum) {
        // 选择完成
        removeGraphics();
        MessageTipSystem.getInstance().clearBottomMessage();
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
  drawBrustRange = (
    targetXY: { x: number; y: number },
    color: string,
    range: number
  ) => {
    // GridDrawer 会自动清理旧的 brustGraphics
    console.log("Creating new brustGraphics");

    const { x, y } = targetXY;

    const brustGridsWay = generateWays({
      start: { x, y },
      range: range,
      checkFunction: (
        gridX: number,
        gridY: number,
        preX: number,
        preY: number
      ) => {
        return checkPassiable(
          { x: x * tileSize, y: y * tileSize } as Unit,
          gridX,
          gridY,
        );
      },
    });
    const brustGridSet = new Set<{ x: number; y: number; step: number }>();
    Object.keys(brustGridsWay).forEach((grid) => {
      const [x, y] = grid.split(",").map(Number);
      const gridData = brustGridsWay[grid];
      if (grid && gridData) {
        brustGridSet.add({ x, y, step: gridData.step });
      }
    });
    brustGridSet.add({ x: x, y: y, step: 0 });
    this.brustGridSet.clear();
    this.brustGridSet = brustGridSet;

    // 使用 gridDrawer 的悬停功能
    this.brustGraphics = this.gridDrawer.showHoverGrids(brustGridsWay, {
      color,
    });
  };

  drawGrids = (
    grids: { [key: string]: { x: number; y: number; step: number } | null },
    color: string
  ) => {
    return this.gridDrawer.drawGrids(grids, { color });
  };

  getXY = (x: number, y: number): { x: number; y: number } => {
    return GridDrawer.getXY(x, y);
  };
  // 生成可移动范围
}
