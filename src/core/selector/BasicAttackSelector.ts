import { tileSize } from "./../envSetting";
import { generateWays } from "../utils/PathfinderUtil";
import * as PIXI from "pixi.js";
import * as envSetting from "../envSetting";
import { golbalSetting } from "../golbalSetting";
export class BasicAttackSelector {
  public graphics: PIXI.Graphics | null = null;
  public removeFunction: (input: any) => void = () => {};
  public promise: Promise<any> | null = null;
  // 选择基本攻击
  public static selectBasicAttack(
    checkPassiable: (
      x: number,
      y: number,
      preX: number,
      preY: number
    ) => boolean,
    range: number,
    startX: number,
    startY: number
  ): BasicAttackSelector {
    const selector = new BasicAttackSelector();
    const tileSize = envSetting.tileSize;
    // 选择攻击逻辑
    const path = generateWays(startX, startY, range, checkPassiable);
    const graphics = new PIXI.Graphics();
    selector.graphics = graphics;
    graphics.alpha = 0.4;
    graphics.zIndex = envSetting.zIndexSetting.spriteZIndex;
    // 绘制可移动范围
    graphics.clear();
    if (path) {
      Object.keys(path).forEach((key) => {
        const [x, y] = key.split(",").map(Number);
        const drawX = x * tileSize;
        const drawY = y * tileSize;
        graphics.rect(drawX, drawY, tileSize, tileSize);
        graphics.fill({ color: 0xff0000 });
      });
    }
    // path 是一个以 "x,y" 为 key 的对象，记录每个格子的前驱节点
    graphics.eventMode = "static";
    const container = golbalSetting.spriteContainer;
    selector.promise = Promise.resolve({});
    if (!container) {
      console.warn("Map container not found.");
      return selector;
    }
    if (!golbalSetting.rlayers.spriteLayer) {
      console.warn("Sprite layer not found in global settings.");
      return selector;
    }
    golbalSetting.rlayers.spriteLayer.attach(graphics);
    container.addChild(graphics);
    // 点击其他地方移除移动范围
    let cancel = false;
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
      cancel = true;
      removeGraphics();
      resolveCallback(input);
    };
    graphics.on("rightdown", (e) => {
      e.stopPropagation();
      cancel = true;
      removeGraphics();
      resolveCallback({ cancel: true });
    });

    const ms = golbalSetting.mapContainer;
    const msRemoveG = (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      cancel = true;
      removeGraphics();
      resolveCallback({ cancel: true });
      ms?.off("rightdown", msRemoveG);
    };
    ms?.on("rightdown", msRemoveG);
    graphics.on("pointerup", (e) => {
      console.log("pointerup");
      e.stopPropagation();
      removeGraphics();
      if (cancel) {
        resolveCallback({ cancel: true });
        return;
      }

      resolveCallback({
        cancel: false,
         event: e,
      });
      // moveMovement(e, unit, container, path);
    });
    selector.promise = promise;
    return selector;
  }
}
