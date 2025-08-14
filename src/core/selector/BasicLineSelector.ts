import { checkPassiable } from "../system/FogSystem";
import { tileSize } from "../envSetting";
import { generateWays } from "../utils/PathfinderUtil";
import * as PIXI from "pixi.js";
import * as envSetting from "../envSetting";
import { golbalSetting } from "../golbalSetting";
import { MessageTipSystem } from "../system/MessageTipSystem";
export type ScanData = {
  x: number;
  y: number;
  inRange: boolean;
  linePathGrid: {
    [key: string]: { x: number; y: number; step: number } | null;
  };
  startPosition: { x: number; y: number } | null;
  oldXY: { x: number; y: number };
  selected: { x: number; y: number }[];
  selecteNum: number;
  pixix: number;
  pixiy: number;
  gridx: number;
  gridy: number;
};
export class BasicLineSelector {
  public graphics: PIXI.Graphics | null = null;
  public removeFunction: (input: any) => void = () => {};
  public promise: Promise<any> | null = null;

  // 添加预览线条相关属性
  private previewLine: PIXI.Graphics | null = null;
  private startPosition: { x: number; y: number } | null = null;
  private oldXY: { x: number; y: number } = { x: 0, y: 0 }; //防抖

  static getInstance(): BasicLineSelector {
    if (BasicLineSelector.instance) {
      return BasicLineSelector.instance;
    }
    BasicLineSelector.instance = new BasicLineSelector();
    return BasicLineSelector.instance;
  }

  public canCancel: boolean = true;
  public isCannelClick: boolean = false;
  public selected: { x: number; y: number }[] = [];
  public selecteNum: number = 0;
  private linePathGrid: {
    [key: string]: { x: number; y: number; step: number } | null;
  } = {};
  private static instance: BasicLineSelector | null = null;

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
    checkPassiable: (gridX: number, gridY: number) => boolean = () => true,
    scanFunction: (scanData: ScanData) => any = () => {},
    startPos?: { x: number; y: number } // 添加起始位置参数
  ): BasicLineSelector {
    const selector = BasicLineSelector.getInstance();
    selector.canCancel = canCancel;
    selector.selected = [];
    selector.selecteNum = selectNum;
    selector.startPosition = startPos || null;

    // 创建预览线条
    selector.createPreviewLine();

    MessageTipSystem.getInstance().setBottomMessage(
      `已选择 ${this.selected.length}/${this.selecteNum} 个目标`
    );

    const path = grids;
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

      // 移除预览线条
      selector.removePreviewLine();

      if (graphics.parent) {
        graphics.parent.removeChild(graphics);
        selector.removeFunction = () => {};
      }
    };

    graphics.on("pointerup", (e) => {
      console.log("pointerup");
      e.stopPropagation();
      if (this.isCannelClick) {
        this.isCannelClick = false;
        return;
      }
      this.isCannelClick = false;
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
        removeGraphics();
        MessageTipSystem.getInstance().clearBottomMessage();
        resolveCallback({
          cancel: false,
          event: e,
          selected: this.selected,
          linePathGrid: this.linePathGrid,
        });
      }
    });

    const ms = golbalSetting.mapContainer;
    console.log("golbalSetting", golbalSetting);
    const scanInPIXI = (x: number, y: number, inRange: boolean = false) => {
      if (selector.startPosition) {
        if (golbalSetting.rootContainer) {
          x -= golbalSetting.rootContainer.x;
          y -= golbalSetting.rootContainer.y;
        }
        if (this.oldXY) {
          const dx = x - this.oldXY.x;
          const dy = y - this.oldXY.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance > 5) {
            this.oldXY = { x, y };
            console.log("uppreviewLine");
            selector.updatePreviewLine(selector.startPosition, { x: x, y: y });

            const scanData: ScanData = {
              x,
              y,
              pixix: x,
              pixiy: y,
              gridx: Math.floor(x / tileSize),
              gridy: Math.floor(y / tileSize),
              inRange,
              linePathGrid: this.linePathGrid,
              startPosition: selector.startPosition,
              oldXY: this.oldXY,
              selected: this.selected,
              selecteNum: this.selecteNum,
            };
            scanFunction(scanData);
          }
        }
        // const targetXY = selector.getXY(x, y);
      }
    };
    // 添加鼠标移动事件监听
    const scanInPIXIEvent = (e: { x: number; y: number }) => {
      scanInPIXI(e.x, e.y);
    };
    const scanInPIXIEventInGraphics = (e: { x: number; y: number }) => {
      scanInPIXI(e.x, e.y, true);
    };
    ms?.on("pointermove", scanInPIXIEvent);
    graphics.on("pointermove", scanInPIXIEventInGraphics);
    graphics.on("rightdown", (e) => {
      this.isCannelClick = true;
      e.stopPropagation();

      if (selector.canCancel && selector.selected.length === 0) {
        removeGraphics();
        ms?.off("pointermove", scanInPIXIEvent);
        resolveCallback({ cancel: true });
      } else if (selector.selected.length > 0) {
        selector.selected.pop();
        MessageTipSystem.getInstance().setBottomMessage(
          `已选择 ${this.selected.length}/${this.selecteNum} 个目标`
        );
      }
    });
    selector.removeFunction = (input: any) => {
      this.isCannelClick = true;
      removeGraphics();
      ms?.off("pointermove", scanInPIXIEvent);
      graphics.off("pointermove", scanInPIXIEventInGraphics);
      resolveCallback(input);
    };

    // 添加鼠标离开事件监听
    // graphics?.on("pointerleave", (e) => {
    //   let { x, y } = e.data.global;

    //   if (golbalSetting.rootContainer) {
    //     x -= golbalSetting.rootContainer.x;
    //     y -= golbalSetting.rootContainer.y;
    //   }
    //   if (this.oldXY) {
    //     const dx = x - this.oldXY.x;
    //     const dy = y - this.oldXY.y;
    //     const distance = Math.sqrt(dx * dx + dy * dy);
    //     if (distance > 5) {
    //       this.oldXY = { x, y };
    //       selector.hidePreviewLine();
    //     }
    //   }

    // });

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

  // 创建预览线条
  private createPreviewLine() {
    if (this.previewLine) {
      this.removePreviewLine();
    }

    this.previewLine = new PIXI.Graphics();
    this.previewLine.zIndex = envSetting.zIndexSetting.tipZIndex + 1;
    this.previewLine.eventMode = "none";
    const container = golbalSetting.spriteContainer;
    if (container && golbalSetting.rlayers.spriteLayer) {
      golbalSetting.rlayers.spriteLayer.attach(this.previewLine);
      container.addChild(this.previewLine);
    }
  }

  // 更新预览线条
  private updatePreviewLine(
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) {
    if (!this.previewLine) return;

    this.previewLine.clear();

    // 计算格子中心点坐标
    const startX = start.x * tileSize + tileSize / 2;
    const startY = start.y * tileSize + tileSize / 2;
    // const endX = end.x * tileSize + tileSize / 2;
    // const endY = end.y * tileSize + tileSize / 2;
    const endX = end.x;
    const endY = end.y;
    // 计算线条长度和采样间隔
    const dx = endX - startX;
    const dy = endY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 采样间隔，确保能覆盖每个格子
    const sampleInterval = tileSize / 8; // 增加采样密度
    const samples = Math.max(Math.ceil(distance / sampleInterval), 1);

    // 收集经过的格子（按顺序）
    const passedGridsList: { x: number; y: number }[] = [];
    const gridSet = new Set<string>();

    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const x = startX + dx * t;
      const y = startY + dy * t;

      // 转换为格子坐标
      const gridX = Math.floor(x / tileSize);
      const gridY = Math.floor(y / tileSize);
      const gridKey = `${gridX},${gridY}`;

      if (!gridSet.has(gridKey)) {
        gridSet.add(gridKey);
        passedGridsList.push({ x: gridX, y: gridY });
      }
    }

    // 路径优化：移除不必要的中间格子
    const optimizedPath = this.optimizePath(passedGridsList);
    //记录路径
    const linePathGrid: {
      [key: string]: { x: number; y: number; step: number } | null;
    } = {};
    for (let i = 1; i < optimizedPath.length; i++) {
      const preGrid = optimizedPath[i - 1];
      const grid = optimizedPath[i];
      const key = `${grid.x},${grid.y}`;
      linePathGrid[key] = { ...preGrid, step: i };
    }
    this.linePathGrid = linePathGrid;
    // 绘制优化后的格子
    // this.previewLine.lineStyle(0); // 无边框
    optimizedPath.forEach((grid) => {
      const drawX = grid.x * tileSize;
      const drawY = grid.y * tileSize;

      // 绘制半透明的红色方格
      if (this.previewLine) {
        this.previewLine.rect(drawX, drawY, tileSize, tileSize);
        this.previewLine.fill({ color: 0xff6b6b, alpha: 0.3 });
      }
    });

    // 绘制中心线条（可选，用于更清晰地显示方向）
    this.previewLine.lineStyle(2, 0xff6b6b, 0.8);
    this.previewLine.moveTo(startX, startY);
    this.previewLine.lineTo(endX, endY);
    this.previewLine.stroke();
  }

  // 路径优化函数：移除不必要的中间格子
  private optimizePath(
    path: { x: number; y: number }[]
  ): { x: number; y: number }[] {
    if (path.length <= 2) return path;

    const optimized: { x: number; y: number }[] = [path[0]]; // 总是保留起点

    for (let i = 1; i < path.length - 1; i++) {
      const current = path[i];
      const last = optimized[optimized.length - 1];
      const next = path[i + 1];

      // 检查当前格子是否是必要的
      if (this.isGridNecessary(last, current, next)) {
        optimized.push(current);
      }
    }

    optimized.push(path[path.length - 1]); // 总是保留终点
    return optimized;
  }

  // 判断格子是否必要
  private isGridNecessary(
    prev: { x: number; y: number },
    current: { x: number; y: number },
    next: { x: number; y: number }
  ): boolean {
    // 如果前一个格子和下一个格子相邻（包括对角线），则当前格子可能不必要
    const dx = Math.abs(next.x - prev.x);
    const dy = Math.abs(next.y - prev.y);

    // 如果前一个和下一个格子相邻（距离小于等于√2），检查是否可以跳过当前格子

    if (dx <= 1 && dy <= 1) {
      return false; // 可以跳过当前格子
    }

    // // 如果方向发生显著变化，保留这个格子
    // if (dir1.x !== dir2.x || dir1.y !== dir2.y) {
    //   return true;
    // }

    return true; // 可以跳过
  }

  // 隐藏预览线条
  private hidePreviewLine() {
    if (this.previewLine) {
      this.previewLine.clear();
    }
  }

  // 移除预览线条
  private removePreviewLine() {
    if (this.previewLine) {
      if (this.previewLine.parent) {
        this.previewLine.parent.removeChild(this.previewLine);
      }
      this.previewLine.destroy();
      this.previewLine = null;
    }
  }

  drawGrids = (
    grids: { [key: string]: { x: number; y: number; step: number } | null },
    color: string
  ) => {
    const graphics = new PIXI.Graphics();
    this.graphics = graphics;
    graphics.eventMode = "static";
    graphics.alpha = 0.4;
    graphics.zIndex = envSetting.zIndexSetting.spriteZIndex;

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

    // graphics.eventMode = "static";
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
}
