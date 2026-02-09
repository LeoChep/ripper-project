import * as PIXI from "pixi.js";
import { getContainer, getLayers } from "@/stores/container";
import { tileSize } from "../envSetting";
import { golbalSetting } from "../golbalSetting";
import type { Unit } from "../units/Unit";
import arrowURL from "@/assets/anim/arrow_item/arrow.png";
import { lookOn } from "./LookOnAnim";

export async function playShootItemAnim(
  unit: Unit,
  targetX: number,
  targetY: number,
  shootItem: string
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

  const originX = Math.floor(unit.x / tileSize) * tileSize + tileSize / 2;
  const originY = Math.floor(unit.y / tileSize) * tileSize + tileSize / 2;
  const endX = targetX * tileSize + tileSize / 2;
  const endY = targetY * tileSize + tileSize / 2;
  const angle = Math.atan2(endY - originY, endX - originX);
  const startOffset = tileSize * 0.4;
  const startX = originX + Math.cos(angle) * startOffset;
  const startY = originY + Math.sin(angle) * startOffset;
  const shootItemSprite = await PIXI.Assets.load(arrowURL);
  const shootSprite = new PIXI.Sprite(shootItemSprite);
  const glowSprite = new PIXI.Sprite(shootItemSprite);

  console.log("shootItem", shootItem, shootSprite, startX, startY);
  shootSprite.anchor.set(0.5);
  shootSprite.x = startX;
  shootSprite.y = startY;
  shootSprite.scale.set(1.25);
  // Default sprite faces right; rotate once to aim at target.
  shootSprite.rotation = angle;

  glowSprite.anchor.set(0.5);
  glowSprite.x = startX;
  glowSprite.y = startY;
  glowSprite.rotation = angle;
  glowSprite.scale.set(1.45);
  glowSprite.alpha = 0.6;
  glowSprite.tint = 0xffffff;
  //   glowSprite.blendMode = PIXI.BLEND_MODES.ADD;

  const layers = getLayers();
  const animLayer = layers.spriteLayer;

  golbalSetting.spriteContainer.addChild(glowSprite);
  golbalSetting.spriteContainer.addChild(shootSprite);
  animLayer?.attach(glowSprite);
  animLayer?.attach(shootSprite);

//   await playAirBurst(startX, startY, targetX, targetY, animLayer);

  const distance = Math.sqrt(
    Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)
  );
  const minSpeed = 0.6; // px / ms
  const maxSpeed = 2.2; // px / ms
  const speed = Math.min(maxSpeed, Math.max(minSpeed, 0.6 + distance * 0.003));
  const duration = distance / speed;

  const trailSprites: PIXI.Sprite[] = [];
  let lastTrailTime = 0;
  const trailIntervalMs = 35;

  return new Promise<void>((resolve) => {
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easedProgress = progress * progress;

      const currentX = startX + (endX - startX) * easedProgress;
      const currentY = startY + (endY - startY) * easedProgress;

      shootSprite.x = currentX;
      shootSprite.y = currentY;
      glowSprite.x = currentX;
      glowSprite.y = currentY;
      //   lookOn(currentX, currentY);
      if (timestamp - lastTrailTime >= trailIntervalMs) {
        const trail = new PIXI.Sprite(shootItemSprite);
        trail.anchor.set(0.5);
        trail.x = currentX;
        trail.y = currentY;
        trail.rotation = angle;
        trail.alpha = 0.6;
        trail.scale.set(0.8);
        if (golbalSetting.spriteContainer) {
          golbalSetting.spriteContainer.addChild(trail);
        }
        animLayer?.attach(trail);
        trailSprites.push(trail);
        lastTrailTime = timestamp;
      }

      for (let i = trailSprites.length - 1; i >= 0; i -= 1) {
        const trail = trailSprites[i];
        trail.alpha -= 0.08;
        trail.scale.set(trail.scale.x * 0.98);
        if (trail.alpha <= 0) {
          if (golbalSetting.spriteContainer) {
            golbalSetting.spriteContainer.removeChild(trail);
          }
          trail.destroy();
          trailSprites.splice(i, 1);
        }
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        if (golbalSetting.spriteContainer) {
          for (const trail of trailSprites) {
            golbalSetting.spriteContainer.removeChild(trail);
            trail.destroy();
          }
          golbalSetting.spriteContainer.removeChild(glowSprite);
          golbalSetting.spriteContainer.removeChild(shootSprite);
        }
        glowSprite.destroy();
        shootSprite.destroy();
        resolve();
      }
    };

    requestAnimationFrame(animate);
  });
}

export async function playAirBurst(
  x: number,
  y: number,
  targetX: number,
  targetY: number,
  animLayer: ReturnType<typeof getLayers>["spriteLayer"]
): Promise<void> {
  if (!golbalSetting.spriteContainer) {
    return 
  }
  console.log("playAirBurst", x, y, targetX, targetY);
  const burst = new PIXI.Graphics();
  burst.lineStyle(2, 0xffffff, 1);
  for (let i = 0; i < 6; i += 1) {
    const len = 10 + i * 5;
    const spread = (i - 2.5) * 5;
    burst.moveTo(0, 0);
    burst.lineTo(-len, spread);
    burst.endFill();
  }

  burst.x = x;
  burst.y = y;
  const originX = burst.x;
  const originY = burst.y;
  const endX = targetX 
  const endY = targetY 
  //向量转角度
  const angle = Math.atan2(endY - originY, endX - originX);
  const angleDeg = (angle * 180) / Math.PI;
  console.log("angle", angle,originX, originY, endX, endY);
  console.log("burst", burst);
  burst.angle = angleDeg;
  //   burst.blendMode = PIXI.BLEND_MODES.ADD;

  golbalSetting.spriteContainer.addChild(burst);
  animLayer?.attach(burst);

  const lifetimeMs = 50;
  const start = performance.now();
//   await new Promise((resolve) => setTimeout(resolve, 300));
   await new Promise<void>((resolve) => {
    const animate = (now: number) => {
      const t = Math.min((now - start) / lifetimeMs, 2);
      burst.alpha = 1 - t * 0.9;
      if (t < 0.5) { burst.scale.set(0.5 + t * 0.5);} else if (t<1) { burst.scale.set(0.5 + 0.5 * 1+(t-0.5)*1);}
     
      if (t < 1.2) {
        requestAnimationFrame(animate);
        
      } else {
        golbalSetting.spriteContainer?.removeChild(burst);
        burst.destroy();
        resolve();
      }
    };

    requestAnimationFrame(animate);
  });
 
}
