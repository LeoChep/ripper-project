import { generateWays } from "../utils/PathfinderUtil";
import * as PIXI from "pixi.js";
import { zIndexSetting, tileSize } from "../envSetting";
import { golbalSetting } from "../golbalSetting";
import { MessageTipSystem } from "../system/MessageTipSystem";
import { checkPassiable } from "../system/AttackSystem";
import type { Unit } from "../units/Unit";
import { GridDrawer } from "./GridDrawer";

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
    selector.graphics?.on("pointermove", (e) => {
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
    if (this.brustGraphics) {
      this.brustGraphics.clear();
      this.brustGraphics.destroy();
      if (this.brustGraphics.parent) {
        this.brustGraphics.parent.removeChild(this.brustGraphics);
      }
    }
    console.log("Creating new brustGraphics");
    this.brustGraphics = new PIXI.Graphics();

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
        // If you have a unit context, replace `null` with the actual unit
        return checkPassiable(
          { x: x*tileSize , y: y*tileSize  } as Unit,
          gridX,
          gridY ,
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
    this.brustGraphics = this.drawGrids(brustGridsWay, color);
    this.brustGraphics.eventMode = "none";
    if (!golbalSetting.rlayers.selectLayer || !golbalSetting.spriteContainer) {
      return;
    }

    this.brustGraphics.zIndex = zIndexSetting.spriteZIndex;
  };
  drawGrids = (
    grids: { [key: string]: { x: number; y: number; step: number } | null },
    color: string
  ) => {
    return GridDrawer.drawGrids(grids, color);
  };
  getXY = (x: number, y: number): { x: number; y: number } => {
    return GridDrawer.pixelToGrid(x, y);
  };
  // 生成可移动范围
}
