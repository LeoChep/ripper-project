import { checkPassiable } from "./../system/FogSystem";
import { tileSize } from "./../envSetting";
import { generateWays } from "../utils/PathfinderUtil";
import * as PIXI from "pixi.js";
import * as envSetting from "../envSetting";
import { golbalSetting } from "../golbalSetting";
export class BasicSelector {
  public graphics: PIXI.Graphics | null = null;
  public removeFunction: (input: any) => void = () => {};
  public promise: Promise<any> | null = null;
  static getInstance(): BasicSelector {
    if (BasicSelector.instance) {
      return BasicSelector.instance;
    }
    BasicSelector.instance = new BasicSelector();
    return BasicSelector.instance;
  }
  public canCancel: boolean = true;
  public isCannelClick: boolean = false; // 记录事件是否是取消点击，用于区分左右键
  public selected: { x: number; y: number }[] = [];
  public selecteNum: number = 0;
  private static instance: BasicSelector | null = null;
  // 选择基本攻击
  public selectBasic(
    grids: {
      [key: string]: {
        x: number;
        y: number;
        step: number;
      } | null;
    },
    selectNum: number,
    color: string,
    canCancel: boolean = true,
    checkPassiable: (gridX: number, gridY: number) => boolean = () => true
  ): BasicSelector {
    const selector = BasicSelector.getInstance();
    selector.canCancel = canCancel;
    selector.selected = [];
    selector.selecteNum = selectNum;

    // 选择逻辑
    const path = grids;
    this.drawGrids(path, color);
    selector.promise = Promise.resolve({});
    const graphics = selector.graphics;
    if (!graphics) {
      console.warn("Graphics not found in BasicSelector.");
      return selector;
    }
    // 点击其他地方移除移动范围
    this.isCannelClick = false;
    const removeGraphics = () => {
      if (graphics.parent) {
        graphics.parent.removeChild(graphics);
        selector.removeFunction = () => {};
      }
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
      e.stopPropagation();
      if (selector.canCancel && selector.selected.length === 0) {
        this.isCannelClick = true;
        removeGraphics();
        resolveCallback({ cancel: true });
      } else if (selector.selected.length > 0) {
        selector.selected.pop();
      }
    });
    //右键区域外
    const ms = golbalSetting.mapContainer;
    const msRemoveG = (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      if (selector.canCancel && selector.selected.length === 0) {
        this.isCannelClick = true;
        removeGraphics();
        resolveCallback({ cancel: true });
        ms?.off("rightdown", msRemoveG);
      } else if (selector.selected.length > 0) {
        selector.selected.pop();
      }
    };
    ms?.on("rightdown", msRemoveG);

    graphics.on("pointerup", (e) => {
      console.log("pointerup");
      e.stopPropagation();
      if (this.isCannelClick) {
        // resolveCallback({ cannel: true });
        return;
      }
      this.isCannelClick = false;
      const { x, y } = e.data.global;
      const xy = this.getXY(x, y);
      if (!checkPassiable(xy.x, xy.y)) {
        console.warn("点击位置不可通行");
        return;
      }
      if (this.selected.length < this.selecteNum) {
        const { x, y } = e.data.global;
        const xy = this.getXY(x, y);
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
  drawGrids = (
    grids: { [key: string]: { x: number; y: number; step: number } | null },
    color: string
  ) => {
    const graphics = new PIXI.Graphics();
    this.graphics = graphics;
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
    graphics.eventMode = "static";
    const container = golbalSetting.spriteContainer;
    if (!container) {
      console.warn("Map container not found.");
      return this;
    }
    if (!golbalSetting.rlayers.spriteLayer) {
      console.warn("Sprite layer not found in global settings.");
      return this;
    }
    golbalSetting.rlayers.spriteLayer.attach(graphics);
    container.addChild(graphics);
    return this;
  };
  getXY = (x: number, y: number): { x: number; y: number } => {
    const resultX = Math.floor(x / tileSize);
    const resultY = Math.floor(y / tileSize);
    return { x: resultX, y: resultY };
  };
  // 生成可移动范围
}
