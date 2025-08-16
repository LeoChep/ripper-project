import { tileSize } from "./../envSetting";

import { generateWays } from "../utils/PathfinderUtil";
import * as PIXI from "pixi.js";
import * as envSetting from "../envSetting";
import { golbalSetting } from "../golbalSetting";
import { MessageTipSystem } from "../system/MessageTipSystem";
import { checkPassiable } from "../system/AttackSystem";
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
  public isCannelClick: boolean = false; // 记录事件是否是取消点击，用于区分左右键
  public selected: { x: number; y: number }[] = [];
  public selecteNum: number = 0;
  public brustRange: number = 1;
  public brustGraphics: PIXI.Graphics | null = null;
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
    this.isCannelClick = false;
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
      this.isCannelClick = true;
      removeGraphics();
      resolveCallback(input);
    };
    // 右键取消选择
    graphics.on("rightdown", (e) => {
      this.isCannelClick = true;
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
      this.isCannelClick = true;
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

    graphics.on("pointerup", (e) => {
      console.log("pointerup");
      e.stopPropagation();
      if (this.isCannelClick) {
        this.isCannelClick = false;
        // resolveCallback({ cannel: true });
        return;
      }
      this.isCannelClick = false;
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

    const brustGrids = generateWays({
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
          { x: x * tileSize, y: y * tileSize } as Unit,
          gridX * tileSize,
          gridY * tileSize,
          golbalSetting.map
        );
      },
    });
    this.brustGraphics = this.drawGrids(brustGrids, color);
    this.brustGraphics.eventMode = "none";
    if (!golbalSetting.rlayers.selectLayer || !golbalSetting.spriteContainer) {
      return;
    }

    this.brustGraphics.zIndex = envSetting.zIndexSetting.spriteZIndex;
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
