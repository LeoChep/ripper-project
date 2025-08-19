
import { getAnimSpriteFromPNGpacks } from "@/core/anim/AnimSpriteFromPNGpacks";
import { Effect } from "@/core/effect/Effect";
import { tileSize, zIndexSetting } from "@/core/envSetting";
import { golbalSetting } from "@/core/golbalSetting";
import type { Unit } from "@/core/units/Unit";
import { Container } from "pixi.js";

export class BurnAreaEffect extends Effect {
  static readonly type = "BurnAreaEffect";
  static readonly name = "BurnAreaEffect";
  owner: Unit | null = null; // 施法单位
  anim: Container | null = null;
  constructor(owner: Unit, uid?: string) {
    super(uid);
    this.owner = owner;
  }
  async build(
    girds: Set<{ x: number; y: number; step: number }>
  ): Promise<void> {
    const container=golbalSetting.mapContainer;
    if (!container)
        return;
    const effectContainer = new Container();
    container.addChild(effectContainer);
    for (const grid of girds) {
      const { x: gridx, y: gridy } = grid;
      // 每个格子2~3个火焰
      const flameCount = 2 + Math.floor(Math.random() * 2); // 2或3
      for (let i = 0; i < flameCount; i++) {
        const sprite = await getAnimSpriteFromPNGpacks("BurnFlame", 15);

        sprite.zIndex = zIndexSetting.spriteZIndex;
        sprite.scale = {
          x: (tileSize / sprite.width) * (0.5 + Math.random()),
          y: (tileSize / sprite.height) * (0.5 + Math.random()),
        };
        // 均匀分布：将tile分成若干扇区，火焰在不同扇区内随机
        const angle =
          (i / flameCount) * Math.PI * 2 +
          Math.random() * ((Math.PI * 2) / flameCount) * 0.5;
        const radius = tileSize * 0.2 + Math.random() * tileSize * 0.25;
        const offsetX = Math.cos(angle) * radius;
        const offsetY = Math.sin(angle) * radius;
        sprite.x = gridx * tileSize + tileSize / 2 + offsetX;
        sprite.y = gridy * tileSize + tileSize / 2 + offsetY;
        sprite.anchor.set(0.5, 0.5);
        const basicLayer = golbalSetting.rlayers.basicLayer;
        if ( basicLayer) {
          effectContainer.addChild(sprite);
          basicLayer.attach(sprite);
          sprite.animationSpeed = 0.5;
          sprite.play();
          // setTimeout(() => {
          //   container.removeChild(sprite);
          //   sprite.destroy();
          // }, 1000);
        }
      }
    }
    this.anim = effectContainer;
  }
  remove() {
    this.anim?.parent?.removeChild(this.anim);
    this.anim?.destroy();
  }
  apply(target: Unit) {
    // 应用灼烧效果
  }
}
