import * as PIXI from 'pixi.js';
import type { Unit } from '../units/Unit';
import { getContainer, getLayers } from '@/stores/container';
import hitURL from "@/assets/effect/Impact_03_Regular_Yellow_400x400.webm";
import missHRL from "@/assets/effect/Miss_02_White_200x200.webm";
export async function createMissOrHitAnimation(
  target: { x: number; y: number },
  hitFlag: boolean,
) {
  const container = getContainer();
  const lineLayer = getLayers().lineLayer;
  if (container === null || lineLayer === null) {
    console.error('Container or lineLayer does not exist');
    return;
  }
  let texture: PIXI.Texture;
  let video: HTMLVideoElement | null = null;

  video = document.createElement("video");
  // document.body.appendChild(video);
  if (hitFlag) {
    video.src = hitURL;

  } else {
    video.src = missHRL;
  }

  video.loop = false;
  video.autoplay = false;
  video.muted = true;
  await video.play(); // 兼容自动播放策略
  texture = PIXI.Texture.from(video);
  if (video) {
    console.log("重播");
    video.currentTime = 0;
    video.play();
  }
  console.log("texturetexture", texture);
  const sprite = new PIXI.Sprite(texture);
  // 设置 sprite 位置和大小

  if (hitFlag) {
      sprite.x = target.x +32
    sprite.y = target.y+32
  } else {
    sprite.x = target.x + 32;
    sprite.y = target.y - 32;
  }
  // alert(video.width)
  sprite.anchor.set(0.5, 0.5); // 设置锚点为中心
  sprite.scale = (1 / (sprite.width / 64)) * 2;
  // sprite.width=64
  // sprite.height=64
  // alert(sprite.width)
  container.addChild(sprite);
  lineLayer.attach(sprite);
  if (!hitFlag) {
    const baseY = sprite.y;
    const start = performance.now();
    const durationMs = 700;
    const bounceHeight = 18;
    const animate = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1);
      const bounce = Math.sin(t * Math.PI * 2) * (1 - t) * bounceHeight;
      sprite.y = baseY - bounce;
      if (t < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }
  setTimeout(() => {
    container.removeChild(sprite);
  }, 1000);
}
