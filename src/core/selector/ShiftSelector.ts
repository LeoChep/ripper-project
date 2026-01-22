import { tileSize } from "../envSetting";

import { generateWays } from "../utils/PathfinderUtil";
import * as PIXI from "pixi.js";
import * as envSetting from "../envSetting";
import { golbalSetting } from "../golbalSetting";
import { MessageTipSystem } from "../system/MessageTipSystem";
import { checkPassiable } from "../system/AttackSystem";
import type { Unit } from "../units/Unit";
import { UnitSystem } from "../system/UnitSystem";

export class ShiftSelector {
  public graphics: PIXI.Graphics | null = null;
  public removeFunction: (input: any) => void = () => {};
  public promise: Promise<any> | null = null;
  shiftGraphics: PIXI.Graphics | null = null;
  shiftGridSet: Set<{ x: number; y: number }> = new Set();
  static getInstance(): ShiftSelector {
    if (ShiftSelector.instance) {
      return ShiftSelector.instance;
    }
    ShiftSelector.instance = new ShiftSelector();
    return ShiftSelector.instance;
  }
  public canCancel: boolean = true;
  public selected: { x: number; y: number }[] = [];
  public selecteNum: number = 0;
  public shiftRange: number = 0;
  private static instance: ShiftSelector | null = null;

  public selectBasic(
    grids: {
      [key: string]: {
        x: number;
        y: number;
        step: number;
      } | null;
    },
    shiftUnit: Unit,
    shiftRange: number,
    selectNum: number = 1,
    color: string = "yellow",
    shiftColor: string = "red",
    canCancel: boolean = true,
    checkPassiable: (gridX: number, gridY: number) => boolean = () => true
  ): ShiftSelector {
    const selector = ShiftSelector.getInstance();
    selector.canCancel = canCancel;
    selector.selected = [];
    selector.selecteNum = selectNum;
    selector.shiftRange = shiftRange;

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
      this.drawShiftRange(targetXY, shiftColor, shiftUnit);
    });
    // 点击其他地方移除移动范围
    const removeGraphics = () => {
      MessageTipSystem.getInstance().clearBottomMessage();
      MessageTipSystem.getInstance().clearMessage();
      if (graphics.parent) {
        graphics.parent.removeChild(graphics);
        selector.removeFunction = () => {};
      }
      if (selector.shiftGraphics && selector.shiftGraphics.parent) {
        selector.shiftGraphics.parent.removeChild(selector.shiftGraphics);
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
  drawShiftRange = (
    targetXY: { x: number; y: number },
    color: string,
    unit: Unit
  ) => {
    if (this.shiftGraphics) {
      this.shiftGraphics.clear();
      this.shiftGraphics.destroy();
      if (this.shiftGraphics.parent) {
        this.shiftGraphics.parent.removeChild(this.shiftGraphics);
      }
    }
    console.log("Creating new shiftGraphics");
    this.shiftGraphics = new PIXI.Graphics();

    const { x, y } = targetXY;

    const grids = UnitSystem.getInstance().getGridsBySize(
      x,
      y,
      unit.creature?.size
    );

    this.shiftGridSet.clear();
    for (let grid of grids) {
      this.shiftGridSet.add(grid);
    }
    const sizeWay: { [key: string]: { x: number; y: number; step: number } } =
      {};
    for (let grid of this.shiftGridSet) {
      sizeWay[`${grid.x},${grid.y}`] = { x: grid.x, y: grid.y, step: 0 };
    }
    this.shiftGraphics = this.drawGrids(sizeWay, color);
    this.shiftGraphics.eventMode = "none";
    if (!golbalSetting.rlayers.selectLayer || !golbalSetting.spriteContainer) {
      return;
    }

    this.shiftGraphics.zIndex = envSetting.zIndexSetting.spriteZIndex;
  };
  drawGrids = (
    grids: { [key: string]: { x: number; y: number; step: number } | null },
    color: string
  ) => {
    const graphics = new PIXI.Graphics();
    graphics.alpha = 0.4;
    graphics.zIndex = envSetting.zIndexSetting.spriteZIndex;
    // 绘制可移动范围
    graphics.clear();
    if (grids) {
      Object.keys(grids).forEach((key) => {
        const [x, y] = key.split(",").map(Number);
        const drawX = x * tileSize;
        const drawY = y * tileSize;
        graphics.rect(drawX, drawY, tileSize, tileSize);
        graphics.fill({ color: color });
      });
    }
    // path 是一个以 "x,y" 为 key 的对象，记录每个格子的前驱节点

    const container = golbalSetting.spriteContainer;
    if (!container) {
      console.warn("Map container not found.");
      return graphics;
    }
    if (!golbalSetting.rlayers.spriteLayer) {
      console.warn("Sprite layer not found in global settings.");
      return graphics;
    }
    golbalSetting.rlayers.spriteLayer.attach(graphics);
    container.addChild(graphics);
    return graphics;
  };
  getXY = (x: number, y: number): { x: number; y: number } => {
    const resultX = Math.floor(x / tileSize);
    const resultY = Math.floor(y / tileSize);
    return { x: resultX, y: resultY };
  };
  // 生成可移动范围
}
