import * as PIXI from "pixi.js";
import * as envSetting from "../envSetting";
import { golbalSetting } from "../golbalSetting";
export const testDraw = (x: number, y: number, color: string) => {
  const graphics = new PIXI.Graphics();

  graphics.alpha = 0.4;
  graphics.zIndex = envSetting.zIndexSetting.spriteZIndex;
  // 绘制可移动范围
  graphics.clear();
  const tileSize = 64;
  const drawX = x * tileSize;
  const drawY = y * tileSize;
  graphics.rect(drawX, drawY, tileSize, tileSize);
  graphics.fill({ color: color });

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
};
