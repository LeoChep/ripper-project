import { getContainer, getLayers } from "@/stores/container";
import * as PIXI from "pixi.js";
import { tileSize } from "../envSetting";

export async function createDamageAnim(
  damage: string,
  target: { x: number; y: number }
) {
  const container = getContainer();
  const lineLayer = getLayers().lineLayer;
  if (container === null || lineLayer === null) {
    console.error("Container or lineLayer does not exist");
    return;
  }
  const damageText = new PIXI.Text({
    text: `-${damage}`,
    style: {
      fontFamily: "Arial",
      fontSize: 24,
      fill: 0xffffff,
      // align: "center",
    },
  });

  damageText.x = target.x + tileSize/2 - damageText.width / 2;
  damageText.y = target.y;

  container.addChild(damageText);
  lineLayer.attach(damageText);

  const duration = 800;
  const startY = damageText.y;
  const endY = startY - 40;
  const startAlpha = 1;
  const endAlpha = 0;

  let startTime: number | null = null;

  function animateDamageText(ts: number) {
    if (startTime === null) startTime = ts;
    const elapsed = ts - startTime;
    const t = Math.min(elapsed / duration, 1);
    
    // 使用 easeOutBack 缓动函数，让数字弹出时更有动感
    // c1 = 1.70158
    const c1 = 1.70158;
    const c3 = c1 + 1;
    const easeOutBack = 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    
    // 或者简单的 easeOutCubic
    // const easeOutCubic = 1 - Math.pow(1 - t, 3);

    const easing = easeOutBack;

    damageText.y = startY + (endY - startY) * easing;
    
    // 淡出效果: 前 70% 时间不透明，后 30% 时间淡出
    if (t > 0.7) {
        const fadeProgress = (t - 0.7) / 0.3;
        damageText.alpha = 1 - fadeProgress;
    } else {
        damageText.alpha = 1;
    }

    if (t < 1) {
      requestAnimationFrame(animateDamageText);
    } else {
      if (container && container.children.includes(damageText)) {
        container.removeChild(damageText);
      }
      damageText.destroy();
    }
  }

  requestAnimationFrame(animateDamageText);
}
