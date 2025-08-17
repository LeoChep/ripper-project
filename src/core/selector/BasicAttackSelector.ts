
import { checkPassiable } from "./../system/FogSystem";
import { tileSize } from "./../envSetting";
import { generateWays } from "../utils/PathfinderUtil";
import * as PIXI from "pixi.js";
import * as envSetting from "../envSetting";
import { golbalSetting } from "../golbalSetting";
import { MessageTipSystem } from "../system/MessageTipSystem";
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
  public isCannelClick: boolean = false; // 记录事件是否是取消点击，用于区分左右键
  public selected: { x: number; y: number }[] = [];
  public selecteNum: number = 0;
  private static instance: BasicAttackSelector | null = null;
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
    this.isCannelClick = false;
    const removeGraphics = () => {
      MessageTipSystem.getInstance().clearBottomMessage();
      MessageTipSystem.getInstance().clearMessage();
      if (graphics.parent) {
      graphics.parent.removeChild(graphics);
      selector.removeFunction = () => {};
      }
    };

    graphics.on("pointerup", (e) => {
      e.stopPropagation();
      if (this.isCannelClick) {
      this.isCannelClick = false;
      return;
      }
      this.isCannelClick = false;
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
      this.isCannelClick = true;
      removeGraphics();
      resolveCallback(input);
    };

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
