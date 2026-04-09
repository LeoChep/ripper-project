

import { generateWays } from "../utils/PathfinderUtil";
import * as PIXI from "pixi.js";
import { golbalSetting } from "../golbalSetting";
import { MessageTipSystem } from "../system/MessageTipSystem";
import { GridDrawer } from "../utils/GridDrawer";
import type { Unit } from "../units/Unit";
import { UnitSystem } from "../system/UnitSystem";
import * as AttackSystem from "../system/AttackSystem";
export class BasicAttackSelector {
  public graphics: PIXI.Graphics | null = null;
  public removeFunction: (input: any) => void = () => {};
  public promise: Promise<any> | null = null;
  static getInstance(): BasicAttackSelector {
    if (BasicAttackSelector.instance) {
      return BasicAttackSelector.instance;
    }
    BasicAttackSelector.instance = new BasicAttackSelector();
    return BasicAttackSelector.instance;
  }
  public canCancel: boolean = true;
  public selected: { x: number; y: number }[] = [];
  public selecteNum: number = 0;
  private static instance: BasicAttackSelector | null = null;
  private gridDrawer: GridDrawer = new GridDrawer();

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
  public selectBasic(options: {
    unit?: Unit,
    range?: number,
    selectNum?: number,
    color?: string,
    canCancel?: boolean,
    checkPassiable?: (x:number,y:number)=>boolean
    } = {}): BasicAttackSelector {
    const {
      unit,
      range = 1,
      selectNum = 1,
      color = "#ff0000",
      canCancel = true,
      checkPassiable = (x,y)=>true
    } = options;

    const selector = BasicAttackSelector.getInstance();
    selector.canCancel = canCancel;
    selector.selected = [];
    selector.selecteNum = selectNum;
    
    MessageTipSystem.getInstance().setBottomMessage(
      `已选择 ${this.selected.length}/${this.selecteNum} 个目标`
    );
    // 选择逻辑
    if (!unit) {
      console.warn("Unit is required for selectBasic.");
      return selector;
    }
    const grids = UnitSystem.getInstance().getUnitGrids(unit);
    const size=unit.creature?.size;
    const path = generateWays({ start: grids, range: range, checkFunction:
      (x,y,...args)=>{return AttackSystem.checkPassiable(unit,x,y)} });
    console.log("生成的攻击范围格子:", path);
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
      if (!golbalSetting.rootContainer) {
        return;
      }
      let { x, y } = e.data.global;
      x -= golbalSetting.rootContainer.x;
      y -= golbalSetting.rootContainer.y;
      const hoverXY = this.getXY(x, y);
      // 显示悬停格子高亮
      this.showHover(hoverXY, path);
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
      e.stopPropagation();
      let { x, y } = e.data.global;
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
      removeGraphics();
      MessageTipSystem.getInstance().clearBottomMessage();
      resolveCallback({
        cancel: false,
        event: e,
        selected: this.selected,
      });
      }
    });

    selector.removeFunction = (input: any) => {
      removeGraphics();
      resolveCallback(input);
    };

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
  private showHover(hoverXY: { x: number; y: number }, validGrids: { [key: string]: { x: number; y: number; step: number } | null }): void {
    // 检查悬停位置是否在有效范围内
    const key = `${hoverXY.x},${hoverXY.y}`;
    if (validGrids[key]) {
      // 显示悬停格子
      this.gridDrawer.showHoverGrids([{ x: hoverXY.x, y: hoverXY.y }], {
        color: "#ff6666",
        alpha: 0.6,
      });
    } else {
      // 不在有效范围内，隐藏悬停
      this.gridDrawer.hideHoverGrids();
    }
  }

  // 生成可移动范围
}
