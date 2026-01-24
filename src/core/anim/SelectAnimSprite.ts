import { Container, Graphics } from "pixi.js";
import { tileSize } from "../envSetting";

export class SelectAnimSprite extends Container {
  private selected: boolean = false;
  private borderGraphics: Graphics;
  private fillGraphics: Graphics;
  private animationTime: number = 0;
  private animationSpeed: number = 0.05;
  private borderThickness: number = 3;
  private unitWidth: number;
  private unitHeight: number;

  constructor(width: number = tileSize, height: number = tileSize) {
    super();
    this.unitWidth = width;
    this.unitHeight = height;

    // 底部填充层 - 微弱的高亮
    this.fillGraphics = new Graphics();
    this.addChild(this.fillGraphics);

    // 边框层
    this.borderGraphics = new Graphics();
    this.addChild(this.borderGraphics);

    this.drawInitialState();
  }

  private drawInitialState() {
    // 绘制底部微弱的填充
    this.fillGraphics.clear();
    this.fillGraphics.rect(0, 0, this.unitWidth, this.unitHeight);
    this.fillGraphics.fill({ color: 0xffffff, alpha: 0.1 });

    // 绘制边框
    this.updateBorder(1.0);
  }

  private updateBorder(alpha: number) {
    if (!this.borderGraphics.context) return;
    console.log(
      'SelectAnimSprite:', this)
    this.borderGraphics.clear();

    const inset = this.borderThickness / 2;
    const sizeW = this.unitWidth - this.borderThickness;
    const sizeH = this.unitHeight - this.borderThickness;
    const minSize = Math.min(this.unitWidth, this.unitHeight);

    // 绘制四个角的强调线
    const cornerSize = minSize * 0.25;

    // 左上角
    this.borderGraphics.moveTo(inset, inset + cornerSize);
    this.borderGraphics.lineTo(inset, inset);
    this.borderGraphics.lineTo(inset + cornerSize, inset);

    // 右上角
    this.borderGraphics.moveTo(sizeW + inset - cornerSize, inset);
    this.borderGraphics.lineTo(sizeW + inset, inset);
    this.borderGraphics.lineTo(sizeW + inset, inset + cornerSize);

    // 右下角
    this.borderGraphics.moveTo(sizeW + inset, sizeH + inset - cornerSize);
    this.borderGraphics.lineTo(sizeW + inset, sizeH + inset);
    this.borderGraphics.lineTo(sizeW + inset - cornerSize, sizeH + inset);

    // 左下角
    this.borderGraphics.moveTo(inset + cornerSize, sizeH + inset);
    this.borderGraphics.lineTo(inset, sizeH + inset);
    this.borderGraphics.lineTo(inset, sizeH + inset - cornerSize);

    this.borderGraphics.stroke({
      color: 0xffff00,
      width: this.borderThickness,
      alpha: alpha,
    });
  }

  select() {
    this.selected = true;
    this.animationTime = 0;
  }

  deselect() {
    this.selected = false;
    this.animationTime = 0;
  }

  isSelected(): boolean {
    return this.selected;
  }

  // 更新动画（需要在游戏循环中调用）
  update(delta: number = 1) {
    if (this.selected) {
      this.animationTime += this.animationSpeed * delta;

      // 呼吸效果：alpha 在 0.6 到 1.0 之间变化
      const pulse = Math.sin(this.animationTime) * 0.2 + 0.8;
      this.updateBorder(pulse);

      // 填充也跟随呼吸
      this.fillGraphics.alpha = pulse * 0.15;
    } else {
      // 未选中时保持静态
      this.fillGraphics.alpha = 0;
      this.borderGraphics.alpha = 0;
    }
  }
}
