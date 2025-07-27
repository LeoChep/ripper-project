import { Container, Graphics } from "pixi.js";
import { tileSize } from "../envSetting";

export class SelectAnimSprite extends Container {
  private selected: boolean = false;

  constructor() {
    super();

    const graphics = new Graphics();
    graphics.rect(0, 0, tileSize, tileSize);
    graphics.fill({ color: 0x00ff00, alpha: 0.5 });
    this.addChild(graphics);
  }

  select() {
    this.selected = true;
    // 触发选中动画
  }

  deselect() {
    this.selected = false;
    // 触发取消选中动画
  }

  isSelected(): boolean {
    return this.selected;
  }
}
