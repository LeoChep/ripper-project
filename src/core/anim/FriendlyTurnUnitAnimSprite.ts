import { Container, Graphics } from "pixi.js";
import { tileSize } from "../envSetting";

/**
 * 友军回合单位动画精灵
 * 用绿色边框和柔和的效果表示友方单位的回合
 */
export class FriendlyTurnUnitAnimSprite extends Container {
  private active: boolean = false;
  private borderGraphics: Graphics;
  private fillGraphics: Graphics;
  private animationTime: number = 0;
  private animationSpeed: number = 0.06; // 比敌方慢一点，更柔和
  private borderThickness: number = 3;
  private unitWidth: number;
  private unitHeight: number;

  constructor(width: number = tileSize, height: number = tileSize) {
    super();
    this.unitWidth = width;
    this.unitHeight = height;

    // 底部填充层 - 绿色友好效果
    this.fillGraphics = new Graphics();
    this.addChild(this.fillGraphics);

    // 边框层
    this.borderGraphics = new Graphics();
    this.addChild(this.borderGraphics);

    this.drawInitialState();
  }

  private drawInitialState() {
    // 绘制底部绿色填充
    this.fillGraphics.clear();
    this.fillGraphics.rect(0, 0, this.unitWidth, this.unitHeight);
    this.fillGraphics.fill({ color: 0x00ff00, alpha: 0.12 });

    // 绘制边框
    this.updateBorder(1.0);
  }

  private updateBorder(alpha: number) {
    this.borderGraphics.clear();
    
    const inset = this.borderThickness / 2;
    const sizeW = this.unitWidth - this.borderThickness;
    const sizeH = this.unitHeight - this.borderThickness;
    const minSize = Math.min(this.unitWidth, this.unitHeight);

    // 绘制四个角的圆润强调线
    const cornerSize = minSize * 0.28;
    
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
      color: 0x33ff33, 
      width: this.borderThickness,
      alpha: alpha 
    });

    // 添加柔和的内角装饰线
    const decorLength = minSize * 0.12;
    const decorInset = minSize * 0.15;
    
    // 左上装饰
    this.borderGraphics.moveTo(decorInset, decorInset + decorLength);
    this.borderGraphics.lineTo(decorInset, decorInset);
    this.borderGraphics.lineTo(decorInset + decorLength, decorInset);
    
    // 右上装饰
    this.borderGraphics.moveTo(sizeW + inset - decorInset - decorLength, decorInset);
    this.borderGraphics.lineTo(sizeW + inset - decorInset, decorInset);
    this.borderGraphics.lineTo(sizeW + inset - decorInset, decorInset + decorLength);
    
    // 右下装饰
    this.borderGraphics.moveTo(sizeW + inset - decorInset, sizeH + inset - decorInset - decorLength);
    this.borderGraphics.lineTo(sizeW + inset - decorInset, sizeH + inset - decorInset);
    this.borderGraphics.lineTo(sizeW + inset - decorInset - decorLength, sizeH + inset - decorInset);
    
    // 左下装饰
    this.borderGraphics.moveTo(decorInset + decorLength, sizeH + inset - decorInset);
    this.borderGraphics.lineTo(decorInset, sizeH + inset - decorInset);
    this.borderGraphics.lineTo(decorInset, sizeH + inset - decorInset - decorLength);
    
    this.borderGraphics.stroke({ 
      color: 0x55ff55, 
      width: 2,
      alpha: alpha * 0.6
    });
  }

  activate() {
    this.active = true;
    this.animationTime = 0;
  }

  deactivate() {
    this.active = false;
    this.animationTime = 0;
    // 恢复到初始状态
    this.updateBorder(1.0);
  }

  isActive(): boolean {
    return this.active;
  }

  // 更新动画（需要在游戏循环中调用）
  update(delta: number = 1) {
    if (this.active) {
      this.animationTime += this.animationSpeed * delta;

      // 呼吸效果：alpha 在 0.7 到 1.0 之间变化（比敌方更柔和）
      const alpha = 0.7 + Math.sin(this.animationTime) * 0.15;
      this.updateBorder(alpha);
    }
  }
}
