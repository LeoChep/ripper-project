import { Container, Graphics } from "pixi.js";
import { tileSize } from "../envSetting";

export class EnemyTurnUnitAnimSprite extends Container {
  private active: boolean = false;
  private borderGraphics: Graphics;
  private fillGraphics: Graphics;
  private innerRingGraphics: Graphics;
  private animationTime: number = 0;
  private animationSpeed: number = 0.06;
  private borderThickness: number = 4;

  constructor() {
    super();

    // 底部填充层 - 红色警示效果
    this.fillGraphics = new Graphics();
    this.addChild(this.fillGraphics);

    // 内圈旋转层
    this.innerRingGraphics = new Graphics();
    this.addChild(this.innerRingGraphics);

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

    // 绘制边框和内圈
    this.updateBorder(1.0);
    this.updateInnerRing(0);
  }

  private updateBorder(alpha: number) {
    this.borderGraphics.clear();
    
    const inset = this.borderThickness / 2;
    const size = tileSize - this.borderThickness;

    // 绘制完整的矩形边框（红色）
    this.borderGraphics.rect(inset, inset, size, size);
    this.borderGraphics.stroke({ 
      color: 0xff3333, 
      width: this.borderThickness,
      alpha: alpha 
    });

    // 在四个角添加额外的三角形标记
    const cornerSize = tileSize * 0.15;
    const triangleInset = this.borderThickness + 2;
    
    // 左上角三角形
    this.borderGraphics.moveTo(triangleInset, triangleInset);
    this.borderGraphics.lineTo(triangleInset + cornerSize, triangleInset);
    this.borderGraphics.lineTo(triangleInset, triangleInset + cornerSize);
    this.borderGraphics.lineTo(triangleInset, triangleInset);
    this.borderGraphics.fill({ color: 0xff0000, alpha: alpha * 0.6 });
    
    // 右上角三角形
    this.borderGraphics.moveTo(size + inset - triangleInset, triangleInset);
    this.borderGraphics.lineTo(size + inset - triangleInset - cornerSize, triangleInset);
    this.borderGraphics.lineTo(size + inset - triangleInset, triangleInset + cornerSize);
    this.borderGraphics.lineTo(size + inset - triangleInset, triangleInset);
    this.borderGraphics.fill({ color: 0xff0000, alpha: alpha * 0.6 });
    
    // 右下角三角形
    this.borderGraphics.moveTo(size + inset - triangleInset, size + inset - triangleInset);
    this.borderGraphics.lineTo(size + inset - triangleInset - cornerSize, size + inset - triangleInset);
    this.borderGraphics.lineTo(size + inset - triangleInset, size + inset - triangleInset - cornerSize);
    this.borderGraphics.lineTo(size + inset - triangleInset, size + inset - triangleInset);
    this.borderGraphics.fill({ color: 0xff0000, alpha: alpha * 0.6 });
    
    // 左下角三角形
    this.borderGraphics.moveTo(triangleInset, size + inset - triangleInset);
    this.borderGraphics.lineTo(triangleInset + cornerSize, size + inset - triangleInset);
    this.borderGraphics.lineTo(triangleInset, size + inset - triangleInset - cornerSize);
    this.borderGraphics.lineTo(triangleInset, size + inset - triangleInset);
    this.borderGraphics.fill({ color: 0xff0000, alpha: alpha * 0.6 });
  }

  private updateInnerRing(rotation: number) {
    this.innerRingGraphics.clear();
    
    const center = tileSize / 2;
    const radius = tileSize * 0.3;
    const segments = 4;
    const segmentAngle = (Math.PI * 2) / segments;
    const gapAngle = segmentAngle * 0.3;

    // 绘制四段圆弧
    for (let i = 0; i < segments; i++) {
      const startAngle = i * segmentAngle + rotation;
      const endAngle = startAngle + segmentAngle - gapAngle;
      
      this.innerRingGraphics.arc(center, center, radius, startAngle, endAngle);
      this.innerRingGraphics.stroke({ 
        color: 0xff6666, 
        width: 2,
        alpha: 0.8 
      });
    }
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
      
      // 快速脉冲效果：alpha 在 0.7 到 1.0 之间快速变化
      const pulse = Math.sin(this.animationTime * 1.5) * 0.15 + 0.85;
      this.updateBorder(pulse);
      
      // 填充闪烁效果
      this.fillGraphics.alpha = pulse * 0.2;
      
      // 内圈旋转
      const rotation = this.animationTime * 0.02;
      this.updateInnerRing(rotation);
    } else {
      // 未激活时隐藏
      this.fillGraphics.alpha = 0;
      this.borderGraphics.alpha = 0;
      this.innerRingGraphics.alpha = 0;
    }
  }
}
