
import { generateWays } from "../utils/PathfinderUtil";
import * as PIXI from "pixi.js";
import { golbalSetting } from "../golbalSetting";
import { MessageTipSystem } from "../system/MessageTipSystem";
import { GridDrawer } from "../utils/GridDrawer";

export class BasicSelector {
  public graphics: PIXI.Graphics | null = null;
  public removeFunction: (input: any) => void = () => {};
  public promise: Promise<any> | null = null;
  private gridDrawer: GridDrawer = new GridDrawer();

  static getInstance(): BasicSelector {
    if (BasicSelector.instance) {
      return BasicSelector.instance;
    }
    BasicSelector.instance = new BasicSelector();
    return BasicSelector.instance;
  }

  public canCancel: boolean = true;
  public selected: { x: number; y: number }[] = [];
  public selecteNum: number = 0;
  private static instance: BasicSelector | null = null;

  /**
   * 清理所有选择器相关的图形
   * 用于切换控制器时确保没有残留图形
   */
  public cleanup(): void {
    this.gridDrawer.clearAndRemove();
    this.graphics = null;
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
    selectNum: number,
    color: string,
    canCancel: boolean = true,
    checkPassiable: (gridX: number, gridY: number) => boolean = () => true
  ): BasicSelector {
    const selector = BasicSelector.getInstance();
    selector.canCancel = canCancel;
    selector.selected = [];
    selector.selecteNum = selectNum;

    MessageTipSystem.getInstance().setBottomMessage(
      `已选择 ${this.selected.length}/${this.selecteNum} 个目标`
    );

    // 选择逻辑
    const path = grids;
    console.log("path", path);
    this.drawGrids(path, color);

    selector.promise = Promise.resolve({});
    let resolveCallback: (arg0: any) => void = () => {};
    const promise = new Promise<any>((resolve) => {
      resolveCallback = resolve;
    });

    const graphics = selector.graphics;
    if (!graphics) {
      console.warn("Graphics not found in BasicSelector.");
      return selector;
    }

    // 保存 graphics 的引用，用于检查是否已被清理
    const graphicsRef = graphics;
    // 添加悬停效果
    graphics.on("pointermove", (e) => {
      // 检查 selector 的 graphics 是否还存在（用于判断是否被清理）
      if (selector.graphics !== graphicsRef) {
        return; // 如果不匹配，说明已经被清理，不再处理
      }
      let { x, y } = e.data.global;
      if (golbalSetting.rootContainer) {
        x -= golbalSetting.rootContainer.x;
        y -= golbalSetting.rootContainer.y;
      }
      const hoverXY = this.getXY(x, y);
      // 显示悬停格子高亮
      this.showHover(hoverXY, path, checkPassiable, color);
    });

    const removeGraphics = () => {
      MessageTipSystem.getInstance().clearBottomMessage();
      MessageTipSystem.getInstance().clearMessage();
      if (graphics.parent) {
        graphics.parent.removeChild(graphics);
        selector.removeFunction = () => {};
      }
    };

    graphics.on("click", (e) => {
      console.log("click");
      e.stopPropagation();
      let { x, y } = e.data.global;
      console.log("rootContainer", golbalSetting.rootContainer);
      if (golbalSetting.rootContainer) {
        x -= golbalSetting.rootContainer.x;
        y -= golbalSetting.rootContainer.y;
      }
      const xy = this.getXY(x, y);
      if (!checkPassiable(xy.x, xy.y)) {
        console.warn("点击位置不可用");
        return;
      }
      if (this.selected.length < this.selecteNum) {
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

    // 点击其他地方移除移动范围
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

    // 右键区域外
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

    selector.promise = promise;
    return selector;
  }

  drawGrids = (
    grids: { [key: string]: { x: number; y: number; step: number } | null },
    color: string
  ) => {
    this.graphics = this.gridDrawer.drawGrids(grids, { color });
    return this;
  };

  getXY = (x: number, y: number): { x: number; y: number } => {
    return GridDrawer.getXY(x, y);
  };

  /**
   * 显示悬停格子高亮
   */
  private showHover(
    hoverXY: { x: number; y: number },
    validGrids: { [key: string]: { x: number; y: number; step: number } | null },
    checkPassiable: (gridX: number, gridY: number) => boolean,
    color: string
  ): void {
    // 检查悬停位置是否在有效范围内
    const key = `${hoverXY.x},${hoverXY.y}`;
    if (validGrids[key] && checkPassiable(hoverXY.x, hoverXY.y)) {
      // 显示悬停格子
      this.gridDrawer.showHoverGrids([{ x: hoverXY.x, y: hoverXY.y }], {
        color: color,
        alpha: 0.6,
      });
    } else {
      // 不在有效范围内，隐藏悬停
      this.gridDrawer.hideHoverGrids();
    }
  }

  // 生成可移动范围
}
