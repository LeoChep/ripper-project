import { tileSize } from "../envSetting";
import * as PIXI from "pixi.js";
import * as envSetting from "../envSetting";
import { golbalSetting } from "../golbalSetting";
import { MessageTipSystem } from "../system/MessageTipSystem";

export class BlastSelector {
  public graphics: PIXI.Graphics | null = null;
  public removeFunction: (input: any) => void = () => {};
  public promise: Promise<any> | null = null;
  static instance: BlastSelector | null = null;
  public canCancel: boolean = true;
  public isCancelClick: boolean = false;
  public selected: { x: number; y: number }[][] = [];
  public selectNum: number = 1;
  public blastRange: number = 3;
  public blastGraphics: PIXI.Graphics | null = null;
  public blastGridSet: Set<{ x: number; y: number; step: number }> = new Set();
  public hoverGraphics: PIXI.Graphics | null = null;

  static getInstance(): BlastSelector {
    if (BlastSelector.instance) return BlastSelector.instance;
    BlastSelector.instance = new BlastSelector();
    return BlastSelector.instance;
  }

  /**
   * 选择冲击范围，n*n矩阵，且必须紧贴起始格一侧
   * @param startGrids 起始格（通常是玩家所占的格子数组）
   * @param blastRange 冲击范围n，表示n*n矩阵
   * @param selectNum 选择目标数
   * @param color 范围颜色
   * @param canCancel 是否可取消
   * @param checkPassiable 检查格子是否可用
   */
  public selectBlast(
    startGrids: { x: number; y: number }[],
    blastRange: number,
    selectNum: number = 1,
    color: string = "yellow",
    blastColor: string = "red",
    canCancel: boolean = true,
    checkPassiable: (gridX: number, gridY: number) => boolean = () => true
  ): BlastSelector {
    const selector = BlastSelector.getInstance();
    selector.canCancel = canCancel;
    selector.selected = [];
    selector.selectNum = selectNum;
    selector.blastRange = blastRange;
    MessageTipSystem.getInstance().setBottomMessage(
      `请选择冲击区域（${blastRange}×${blastRange}），已选${this.selected.length}/${this.selectNum}`
    );
    // 绘制所有可选冲击区块
    this.graphics?.clear();
    this.graphics = this.drawBlastGrids(
      startGrids,
      blastRange,
      color,
      checkPassiable
    );
    this.graphics.eventMode = "static";
    let resolveCallback: (arg0: any) => void = () => {};
    selector.promise = new Promise<any>((resolve) => {
      resolveCallback = resolve;
    });
    const graphics = selector.graphics;
    if (!graphics) {
      console.warn("Graphics not found in BlastSelector.");
      return selector;
    }
    // 鼠标悬停高亮
    graphics.on("pointermove", (e) => {
      if (!golbalSetting.rootContainer) return;
      const x = e.data.global.x - golbalSetting.rootContainer.x;
      const y = e.data.global.y - golbalSetting.rootContainer.y;
      const xy = this.getXY(x, y);
      const area = this.getBlastAreaByEdge(xy, startGrids, blastRange);
      this.drawHoverArea(area, blastColor);
    });
    // graphics.on("pointerout", () => {
    //   this.drawHoverArea([], "orange");
    // });
    // 右键取消
    graphics.on("rightdown", (e) => {
      e.stopPropagation();
      if (selector.canCancel && selector.selected.length === 0) {
        this.removeGraphics();
        selector.promise = Promise.resolve({ cancel: true });
      } else if (selector.selected.length > 0) {
        selector.selected.pop();
        MessageTipSystem.getInstance().setBottomMessage(
          `请选择冲击区域（${blastRange}×${blastRange}），已选${this.selected.length}/${this.selectNum}`
        );
      }
    });
    // 左键选择
    graphics.on("click", (e) => {
      e.stopPropagation();
      if (!golbalSetting.rootContainer) return;
      const x = e.data.global.x - golbalSetting.rootContainer.x;
      const y = e.data.global.y - golbalSetting.rootContainer.y;
      const xy = this.getXY(x, y);
      const area = this.getBlastAreaByEdge(xy, startGrids, blastRange);
      if (!area.length) return;
      if (!area.every((g) => checkPassiable(g.x, g.y))) return;
      if (this.selected.length < this.selectNum) {
        this.selected.push(area);
        MessageTipSystem.getInstance().setBottomMessage(
          `请选择冲击区域（${blastRange}×${blastRange}），已选${this.selected.length}/${this.selectNum}`
        );
      }
      if (this.selected.length >= this.selectNum) {
        this.removeGraphics();
        MessageTipSystem.getInstance().clearBottomMessage();
        resolveCallback({
          cancel: false,
          selected: this.selected,
        });
      }
    });
    return selector;
  }

  /**
   * 绘制所有紧贴起始格一侧的n*n矩阵（不包含起始格本身）
   */
  drawBlastGrids(
    startGrids: { x: number; y: number }[],
    blastRange: number,
    color: string,
    checkPassiable: (gridX: number, gridY: number) => boolean
  ) {
    const graphics = new PIXI.Graphics();
    graphics.alpha = 0.4;
    graphics.zIndex = envSetting.zIndexSetting.spriteZIndex;
    graphics.clear();
    this.blastGridSet.clear();
    startGrids.forEach((start) => {
      const dirs = [
        { dx: 1, dy: 0 },
        { dx: -1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: 0, dy: -1 },
      ];
      dirs.forEach((dir) => {
        let area: { x: number; y: number }[] = [];
        for (let i = 0; i < blastRange; i++) {
          for (let j = 0; j < blastRange; j++) {
            let tx, ty;
            if (dir.dx !== 0) {
              tx = start.x + dir.dx + (dir.dx === 1 ? 0 : -blastRange + 1) + i;
              ty = start.y - Math.floor(blastRange / 2) + j;
            } else {
              tx = start.x - Math.floor(blastRange / 2) + i;
              ty = start.y + dir.dy + (dir.dy === 1 ? 0 : -blastRange + 1) + j;
            }
            if (tx === start.x && ty === start.y) continue;
            if (!checkPassiable(tx, ty)) continue;
            area.push({ x: tx, y: ty });

            graphics.rect(tx * tileSize, ty * tileSize, tileSize, tileSize);
            graphics.fill({ color });
          }
        }
      });
    });
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
  }

  /**
   * 获取以xy为中心、紧贴startGrids某一侧的n*n冲击区块
   */
  getBlastAreaByEdge(
    xy: { x: number; y: number },
    startGrids: { x: number; y: number }[],
    blastRange: number
  ): { x: number; y: number }[] {
    for (const start of startGrids) {
      const dirs = [
        { dx: 1, dy: 0 },
        { dx: -1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: 0, dy: -1 },
      ];
      for (const dir of dirs) {
        let area: { x: number; y: number }[] = [];
        for (let i = 0; i < blastRange; i++) {
          for (let j = 0; j < blastRange; j++) {
            let tx, ty;
            if (dir.dx !== 0) {
              tx = start.x + dir.dx + (dir.dx === 1 ? 0 : -blastRange + 1) + i;
              ty = start.y - Math.floor(blastRange / 2) + j;
            } else {
              tx = start.x - Math.floor(blastRange / 2) + i;
              ty = start.y + dir.dy + (dir.dy === 1 ? 0 : -blastRange + 1) + j;
            }
            if (tx === start.x && ty === start.y) continue;
            area.push({ x: tx, y: ty });
          }
        }
        if (area.some((g) => g.x === xy.x && g.y === xy.y)) {
          return area;
        }
      }
    }
    return [];
  }

  drawHoverArea(area: { x: number; y: number }[], color: string) {
    if (this.hoverGraphics) {
      this.hoverGraphics.clear();
      this.hoverGraphics.destroy();
      if (this.hoverGraphics.parent) {
        this.hoverGraphics.parent.removeChild(this.hoverGraphics);
      }
    }
    if (!area.length) return;
    this.hoverGraphics = new PIXI.Graphics();
    this.hoverGraphics.eventMode = "none";
    this.hoverGraphics.alpha = 0.5;
    this.hoverGraphics.zIndex = envSetting.zIndexSetting.spriteZIndex + 1;
    this.blastGridSet.clear();
    area.forEach((g) => {
      this.hoverGraphics!.rect(
        g.x * tileSize,
        g.y * tileSize,
        tileSize,
        tileSize
      );
      this.hoverGraphics!.fill({ color });
      this.blastGridSet.add({ x: g.x, y: g.y, step: 0 });
    });
    const container = golbalSetting.spriteContainer;
    if (!container) return;
    if (!golbalSetting.rlayers.spriteLayer) return;
    golbalSetting.rlayers.spriteLayer.attach(this.hoverGraphics);
    container.addChild(this.hoverGraphics);
  }

  getXY(x: number, y: number): { x: number; y: number } {
    return { x: Math.floor(x / tileSize), y: Math.floor(y / tileSize) };
  }

  removeGraphics() {
    MessageTipSystem.getInstance().clearBottomMessage();
    MessageTipSystem.getInstance().clearMessage();
    if (this.graphics && this.graphics.parent) {
      this.graphics.parent.removeChild(this.graphics);
    }
    if (this.blastGraphics && this.blastGraphics.parent) {
      this.blastGraphics.parent.removeChild(this.blastGraphics);
    }
    if (this.hoverGraphics && this.hoverGraphics.parent) {
      this.hoverGraphics.parent.removeChild(this.hoverGraphics);
    }
    this.removeFunction = () => {};
  }
}
