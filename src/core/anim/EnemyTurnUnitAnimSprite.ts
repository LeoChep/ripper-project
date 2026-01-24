import { Container, Graphics } from "pixi.js";
import { tileSize } from "../envSetting";

export class EnemyTurnUnitAnimSprite extends Container {
  private active: boolean = false;
  private borderGraphics: Graphics;
  private fillGraphics: Graphics;
  private animationTime: number = 0;
  private animationSpeed: number = 0.08;
  private borderThickness: number = 3;

  constructor() {
    super();

    // 底部填充层 - 红色警示效果
    this.fillGraphics = new Graphics();
    this.addChild(this.fillGraphics);

    // 边框层
    this.borderGraphics = new Graphics();
    this.addChild(this.borderGraphics);

    this.drawInitialState();
  }

  private drawInitialState() {
    // 绘制底部红色填充
    this.fillGraphics.clear();
    this.fillGraphics.rect(0, 0, tileSize, tileSize);
    this.fillGraphics.fill({ color: 0xff0000, alpha: 0.15 });

    // 绘制边框
    this.updateBorder(1.0);
  }

  private updateBorder(alpha: number) {
    this.borderGraphics.clear();
    
    const inset = this.borderThickness / 2;
    const size = tileSize - this.borderThickness;

    // 绘制四个角的尖锐强调线（比友方更长更锐利）
    const cornerSize = tileSize * 0.3;
    
    // 左上角
    this.borderGraphics.moveTo(inset, inset + cornerSize);
    this.borderGraphics.lineTo(inset, inset);
    this.borderGraphics.lineTo(inset + cornerSize, inset);
    
    // 右上角
    this.borderGraphics.moveTo(size + inset - cornerSize, inset);
    this.borderGraphics.lineTo(size + inset, inset);
    this.borderGraphics.lineTo(size + inset, inset + cornerSize);
    
    // 右下角
    this.borderGraphics.moveTo(size + inset, size + inset - cornerSize);
    this.borderGraphics.lineTo(size + inset, size + inset);
    this.borderGraphics.lineTo(size + inset - cornerSize, size + inset);
    
    // 左下角
    this.borderGraphics.moveTo(inset + cornerSize, size + inset);
    this.borderGraphics.lineTo(inset, size + inset);
    this.borderGraphics.lineTo(inset, size + inset - cornerSize);

    this.borderGraphics.stroke({ 
      color: 0xff3333, 
      width: this.borderThickness,
      alpha: alpha 
    });

    // 添加对角线增强威胁感
    const diagonalLength = tileSize * 0.15;
    const diagonalInset = tileSize * 0.1;
    
    this.borderGraphics.moveTo(diagonalInset, diagonalInset);
    this.borderGraphics.lineTo(diagonalInset + diagonalLength, diagonalInset + diagonalLength);
    
    this.borderGraphics.moveTo(size + inset - diagonalInset, diagonalInset);
    this.borderGraphics.lineTo(size + inset - diagonalInset - diagonalLength, diagonalInset + diagonalLength);
    
    this.borderGraphics.stroke({ 
      color: 0xff5555, 
      width: 2,
      alpha: alpha * 0.7
    });
  }

  activate() {
    this.active = true;
    this.animationTime = 0;
  }

  deactivate() {
    this.active = false;
    this.animationTime = 0;
  }

  isActive(): boolean {
    return this.active;
  }

  // 更新动画（需要在游戏循环中调用）
  update(delta: number = 1) {
    if (this.active) {
      this.animationTime += this.animationSpeed * delta;
      
      // 快速脉冲效果：alpha 在 0.7 到 1.0 之间快速变化（比友方更快更明显）
      const pulse = Math.sin(this.animationTime * 1.8) * 0.15 + 0.85;
      this.updateBorder(pulse);
      
      // 填充闪烁效果
      this.fillGraphics.alpha = pulse * 0.2;
    } else {
      // 未激活时隐藏
      this.fillGraphics.alpha = 0;
      this.borderGraphics.alpha = 0;
    }
  }
}
