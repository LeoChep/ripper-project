import * as PIXI from "pixi.js";
import { getContainer, getLayers } from "@/stores/container";
import { tileSize } from "../envSetting";
import { golbalSetting } from "../golbalSetting";
import type { Unit } from "../units/Unit";

export async function playThrowItemAnim(
  unit: Unit,
  targetX: number,
  targetY: number,
  throwItem: string,
): Promise<void> {
  const container = getContainer();
  if (!container) {
    console.error("container 不存在");
    return;
  }
  if (!golbalSetting.spriteContainer) {
    console.error("spriteContainer 不存在");
    return;
  }

  const startX = Math.floor(unit.x / tileSize) * tileSize + tileSize / 2;
  const startY = Math.floor(unit.y / tileSize) * tileSize + tileSize / 2;
  const endX = targetX * tileSize + tileSize / 2;
  const endY = targetY * tileSize + tileSize / 2;

  const throwItemSprite = await PIXI.Assets.load(throwItem);
  const throwSprite = new PIXI.Sprite(throwItemSprite);

  console.log("throwItem", throwItem, throwSprite, startX, startY);
  throwSprite.anchor.set(0.5);
  throwSprite.x = startX;
  throwSprite.y = startY;

  const layers = getLayers();
  const animLayer = layers.spriteLayer;

  golbalSetting.spriteContainer.addChild(throwSprite);
  animLayer?.attach(throwSprite);

  const distance = Math.sqrt(
    Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2),
  );
  const baseSpeed = 1; // px / ms
  const duration = Math.max(300, distance / baseSpeed);

  return new Promise<void>((resolve) => {
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easedProgress = progress * progress;

      const currentX = startX + (endX - startX) * easedProgress;
      const currentY = startY + (endY - startY) * easedProgress;

      throwSprite.x = currentX;
      throwSprite.y = currentY;

      throwSprite.rotation = progress * Math.PI * 4;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        if (golbalSetting.spriteContainer) {
          golbalSetting.spriteContainer.removeChild(throwSprite);
        }
        throwSprite.destroy();
        resolve();
      }
    };

    requestAnimationFrame(animate);
  });
}
