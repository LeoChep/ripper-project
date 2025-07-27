import { getContainer, getLayers } from "@/stores/container";
import * as PIXI from "pixi.js";

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

  damageText.x = target.x + 32 - damageText.width / 2;
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
    const t = Math.min(elapsed / duration, 1.2);
    damageText.y = startY + (endY - startY) * t;
    damageText.alpha = startAlpha + (endAlpha - startAlpha) * t;
    if (t < 1.2) {
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
