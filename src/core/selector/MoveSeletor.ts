import { tileSize } from "./../envSetting";

import * as PIXI from "pixi.js";
import * as envSetting from "../envSetting";
import { golbalSetting } from "../golbalSetting";
import { MessageTipSystem } from "../system/MessageTipSystem";

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
  public isCannelClick: boolean = false; // 记录事件是否是取消点击，用于区分左右键
  public selected: { x: number; y: number }[] = [];
  public selecteNum: number = 1;
  public sizeGraphics: PIXI.Graphics | null = null;
  private static instance: MoveSelector | null = null;
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
    checkPassiable: (gridX: number, gridY: number) => boolean = () => true,
    onCancel: () => void = () => {}
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
      if (!golbalSetting.rootContainer) {
        return;
      }
      const x = e.data.global.x - golbalSetting.rootContainer?.x;
      const y = e.data.global.y - golbalSetting.rootContainer?.y;
      const targetXY = this.getXY(x, y);
      if (this.sizeGraphics?.parent) {
        this.sizeGraphics.clear();
        this.sizeGraphics.parent.removeChild(this.sizeGraphics);
        this.sizeGraphics.destroy();
      }
      if (!UnitSystem.getInstance().checkOverlapAt(unit, targetXY.x, targetXY.y)) {
        this.sizeGraphics = this.drawSizeGrids(targetXY, unit, "blue");
      } else {
        this.sizeGraphics = this.drawSizeGrids(targetXY, unit, "red");
      }
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
      this.isCannelClick = true;
      removeGraphics();
      resolveCallback(input);
    };
    // 右键取消选择
    graphics.on("rightdown", (e) => {
      this.isCannelClick = true;
      e.stopPropagation();
        onCancel();
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
      if (selector.canCancel) {
        removeGraphics();
        resolveCallback({ cancel: true });
        ms?.off("rightdown", msRemoveG);
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
    const graphics = new PIXI.Graphics();
    graphics.alpha = 0.4;
    graphics.zIndex = envSetting.zIndexSetting.spriteZIndex + 1;
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
    for (const grid of grids) {
      const [x, y] = grid.split(",").map(Number);
      const drawX = x * tileSize;
      const drawY = y * tileSize;
      graphics.rect(drawX, drawY, tileSize, tileSize);
      graphics.fill({ color: 0x66ccff });
    }

    graphics.eventMode = "static";
    // if (FogSystem.instanse.mask)
    //   graphics.setMask({ mask: FogSystem.instanse.mask });
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
    this.graphics = graphics;
    return graphics;
  };
  drawSizeGrids = (
    target: { x: number; y: number },
    unit: Unit,
    color: string
  ) => {
    const graphics = new PIXI.Graphics();
    graphics.alpha = 0.4;
    graphics.zIndex = envSetting.zIndexSetting.spriteZIndex + 1;
    // 绘制可移动范围
    const size = unit.creature ? unit.creature.size : undefined;
    const grids = [];
    let range = 1; // 默认范围为0，可根据需要调整
    if (size === "big") {
      range = 2;
    }

    for (let dx = 0; dx < range; dx++) {
      for (let dy = 0; dy < range; dy++) {
        grids.push({
          x: target.x + dx,
          y: target.y + dy,
        });
      }
    }

    if (grids) {
      grids.forEach((grid) => {
        const drawX = grid.x * tileSize;
        const drawY = grid.y * tileSize;
        graphics.rect(drawX, drawY, tileSize, tileSize);
        graphics.fill({ color: color });
      });
    }
    graphics.eventMode = "none";
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
