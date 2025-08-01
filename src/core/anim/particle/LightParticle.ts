import { distance } from "./../../system/DoorSystem";
import * as PIXI from "pixi.js";
import basic from "@/assets/partics/basic.png";
export class LightParticle {
  public instance?: PIXI.ParticleContainer;
  coreParticle?: PIXI.Particle; // 核心粒子：高亮频闪
  borderParticle?: PIXI.Particle; // 边框粒子：稳定发光
  mainRayParticle?: PIXI.Particle; // 主要条状粒子：跟随rotation角度
  rayParticles: PIXI.Particle[] = []; // 条状射线粒子
  rayTrailPositions: Array<{ x: number; y: number }> = []; // 射线拖尾位置记录
  mainPraticles: PIXI.Particle[] = [];
  trailParticles: Array<{
    particle: PIXI.Particle;
    life: number;
    maxLife: number;
    initialScale: number; // 记录初始缩放
    pulseOffset: number; // 脉冲偏移，让每个粒子的频闪不同步
  }> = []; // 拖尾粒子数组
  palyTime: number = 0;
  x: number = 0;
  y: number = 0;
  rotation: number = 0; // 旋转角度
  constructor() {}
  async init() {
    await PIXI.Assets.load(basic);

    // 创建边框粒子（稳定发光）
    this.borderParticle = new PIXI.Particle({
      texture: PIXI.Texture.from(basic),
    });
    const borderHsb = { h: 220, s: 15, b: 30 }; // 较暗的边框，改为蓝色
    this.borderParticle.tint = toHsl([
      borderHsb.h / 360,
      borderHsb.s / 100,
      borderHsb.b / 100,
    ]);
    this.borderParticle.anchorX = 0.5;
    this.borderParticle.anchorY = 0.5;
    this.borderParticle.alpha = 0.6; // 稳定透明度

    // 创建核心粒子（高亮频闪）
    this.coreParticle = new PIXI.Particle({
      texture: PIXI.Texture.from(basic),
    });
    const coreHsb = { h: 220, s: 25, b: 90 }; // 更亮的核心，改为蓝色
    this.coreParticle.tint = toHsl([
      coreHsb.h / 360,
      coreHsb.s / 100,
      coreHsb.b / 100,
    ]);
    this.coreParticle.anchorX = 0.5;
    this.coreParticle.anchorY = 0.5;

    this.instance = new PIXI.ParticleContainer({
      dynamicProperties: {
        position: true, // default
        scale: true,
        rotation: true,
        color: true,
      },
    });

    // 先添加边框粒子（底层），再添加核心粒子（顶层）
    this.instance.addParticle(this.borderParticle);

    // 创建条状射线粒子
    this.createRayParticles();

    // 创建主要条状粒子
    this.createMainRayParticle();

    this.instance.addParticle(this.coreParticle);
  }
  play() {
    this.renderFunc();
  }
  renderFunc = () => {
    if (!this.coreParticle || !this.borderParticle) return;

    // 脉冲频闪效果参数
    const ax = this.palyTime * 0.3; // 增加频率让频闪更明显
    const pulseFreq = this.palyTime * 0.8; // 快速频闪频率

    // === 边框粒子：稳定发光 ===
    this.borderParticle.alpha = 0.6; // 保持稳定透明度
    const borderScale = 0.3; // 更大的边框
    this.borderParticle.scaleX = borderScale;
    this.borderParticle.scaleY = borderScale;
    this.borderParticle.x = this.x;
    this.borderParticle.y = this.y;

    // === 核心粒子：高亮频闪 ===
    // 基础脉冲透明度 + 快速频闪效果
    const basePulse = 0.3 + Math.abs(Math.sin(ax)) * 0.7;
    const flashEffect = Math.sin(pulseFreq) > 0.7 ? 1.0 : 0; // 频闪条件
    const finalAlpha = Math.min(basePulse + flashEffect * 0.3, 1.0);

    this.coreParticle.alpha = finalAlpha;

    // 颜色也跟随脉冲变化，增加频闪 时的亮度
    const coreHsb = { h: 220, s: 25, b: 90 }; // 改为蓝色
    const brightnessPulse = Math.abs(Math.sin(ax)) * 40 + 10;
    const flashBrightness = flashEffect * 30; // 频闪时额外亮度
    coreHsb.b = Math.min(brightnessPulse + flashBrightness, 100);

    this.coreParticle.tint = toHsl([
      coreHsb.h / 360,
      coreHsb.s / 100,
      coreHsb.b / 100,
    ]);

    // 缩放效果：基础脉冲 + 频闪时的额外缩放
    const scaleMultiplier = Math.pow(Math.sin(ax * 0.5), 2);
    const baseScale = 0.1; // 更大的核心粒子
    const scaleRange = 0.1; // 更大的变化范围
    const flashScale = flashEffect * 0.1; // 频闪时额外缩放
    const currentScale = baseScale + scaleMultiplier * scaleRange + flashScale;

    this.coreParticle.scaleY = currentScale;
    this.coreParticle.scaleX = currentScale;

    // 更新核心粒子位置
    this.coreParticle.x = this.x;
    this.coreParticle.y = this.y;

    // 创建拖尾粒子（每2帧创建一组，避免粒子过多）
    if (this.palyTime % 2 === 0) this.createTrailParticle();

    // 更新射线粒子
    this.updateRayParticles();

    // 更新主要条状粒子
    this.updateMainRayParticle();

    // 更新拖尾粒子
    this.updateTrailParticles();

    console.log(
      "core scale",
      currentScale.toFixed(2),
      "core alpha",
      this.coreParticle.alpha.toFixed(2),
      "flash",
      flashEffect,
      "trail count",
      this.trailParticles.length
    );

    this.instance?.update();
  };

  // 创建拖尾粒子
  private createTrailParticle() {
    if (!this.instance || !this.coreParticle) return;

    // 在当前位置周围创建多个小粒子
    const particleCount = 5; // 减少一些粒子数量
    const spreadRadius = 6; // 稍大的散布半径

    for (let i = 0; i < particleCount; i++) {
      const trailParticle = new PIXI.Particle({
        texture: this.coreParticle.texture,
      });

      // 计算随机偏移位置
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5; // 均匀分布 + 随机偏移
      const distance = Math.random() * spreadRadius; // 随机距离
      const offsetX = Math.cos(angle) * distance;
      const offsetY = Math.sin(angle) * distance;

      // 拖尾粒子的初始属性
      trailParticle.x = this.x + offsetX;
      trailParticle.y = this.y + offsetY;
      trailParticle.anchorX = 0.5;
      trailParticle.anchorY = 0.5;

      // 更小更亮的拖尾粒子（跟随核心粒子的特性）
      const baseScale = 0.05; // 更大的拖尾粒子
      const scaleVariation = 0.02; // 更大的变化范围
      const trailScale = baseScale + Math.random() * scaleVariation;
      trailParticle.scaleX = trailScale;
      trailParticle.scaleY = trailScale;

      // 拖尾粒子更亮，颜色接近核心粒子
      const brightnessVariation = Math.random() * 15 - 5; // 较小的变化
      const trailHsb = {
        h: 220 + Math.random() * 5 - 2.5, // 色相轻微变化，改为蓝色
        s: 25 + Math.random() * 5 - 2.5, // 饱和度轻微变化
        b: Math.max(0, Math.min(100, 85 + brightnessVariation)), // 更高的基础亮度
      };
      trailParticle.tint = toHsl([
        trailHsb.h / 360,
        trailHsb.s / 100,
        trailHsb.b / 100,
      ]);
      trailParticle.alpha = 0.8 + Math.random() * 0.15; // 0.8-0.95 的透明度

      // 添加到容器
      this.instance.addParticle(trailParticle);

      // 添加到拖尾粒子数组，稍短的生命周期
      const lifeVariation = Math.floor(Math.random() * 8) - 4; // -4 到 +4 帧的变化
      const maxLife = Math.max(20, 25 + lifeVariation);
      this.trailParticles.push({
        particle: trailParticle,
        life: maxLife,
        maxLife: maxLife,
        initialScale: trailScale, // 记录初始缩放
        pulseOffset: Math.random() * Math.PI * 2, // 随机脉冲偏移
      });
    }
  }

  // 更新拖尾粒子
  private updateTrailParticles() {
    if (!this.instance) return;

    for (let i = this.trailParticles.length - 1; i >= 0; i--) {
      const trailData = this.trailParticles[i];
      trailData.life--;

      // 计算生命周期比例
      const lifeRatio = trailData.life / trailData.maxLife;

      // 使用更平滑的衰减曲线，让拖尾更渐进
      const smoothLifeRatio = Math.pow(lifeRatio, 0.5); // 平方根衰减，更平缓

      // 添加脉冲频闪效果（类似主粒子）
      const trailPulseTime = this.palyTime + trailData.pulseOffset;
      const trailPulseFreq = trailPulseTime * 0.6; // 稍慢一些的频闪
      const trailFlashEffect = Math.sin(trailPulseFreq) > 0.8 ? 1.0 : 0; // 更高的阈值，频闪更少

      // 透明度：基础衰减 + 脉冲效果
      const baseAlpha = 0.6 * smoothLifeRatio;
      const pulseAlpha =
        Math.abs(Math.sin(trailPulseTime * 0.4)) * 0.3 * smoothLifeRatio;
      const flashAlpha = trailFlashEffect * 0.2 * smoothLifeRatio;
      trailData.particle.alpha = baseAlpha + pulseAlpha + flashAlpha;

      // 缩放：基础衰减 + 脉冲效果
      const baseScale = trailData.initialScale * smoothLifeRatio;
      const pulseScale =
        Math.abs(Math.sin(trailPulseTime * 0.4)) *
        trailData.initialScale *
        0.3 *
        smoothLifeRatio;
      const flashScale =
        trailFlashEffect * trailData.initialScale * 0.2 * smoothLifeRatio;
      const finalScale = baseScale + pulseScale + flashScale;

      trailData.particle.scaleX = finalScale;
      trailData.particle.scaleY = finalScale;

      // 颜色也随生命周期和脉冲变化
      const age = 1 - lifeRatio;
      const pulseBrightness = Math.abs(Math.sin(trailPulseTime * 0.4)) * 20;
      const flashBrightness = trailFlashEffect * 15;
      const trailHsb = {
        h: 220, // 色相保持不变，改为蓝色
        s: Math.max(0, 20 - age * 5), // 饱和度逐渐降低
        b: Math.min(
          100,
          Math.max(0, 80 - age * 30 + pulseBrightness + flashBrightness)
        ),
      };
      trailData.particle.tint = toHsl([
        trailHsb.h / 360,
        trailHsb.s / 100,
        trailHsb.b / 100,
      ]);

      // 生命周期结束，移除粒子
      if (trailData.life <= 0) {
        this.instance.removeParticle(trailData.particle);
        this.trailParticles.splice(i, 1);
      }
    }
  }

  // 清理所有拖尾粒子
  public clearTrailParticles() {
    if (!this.instance) return;

    for (const trailData of this.trailParticles) {
      this.instance.removeParticle(trailData.particle);
    }
    this.trailParticles = [];

    // 清理射线粒子
    for (const rayParticle of this.rayParticles) {
      this.instance.removeParticle(rayParticle);
    }
    this.rayParticles = [];

    // 清理主要条状粒子
    if (this.mainRayParticle) {
      this.instance.removeParticle(this.mainRayParticle);
      this.mainRayParticle = undefined;
    }
  }

  // 创建条状射线粒子
  private createRayParticles() {
    if (!this.instance) return;

    const rayCount = 8; // 创建8条拖尾射线

    // 初始化拖尾位置记录
    this.rayTrailPositions = [];
    for (let i = 0; i < 15; i++) {
      // 记录15个历史位置
      this.rayTrailPositions.push({ x: this.x, y: this.y });
    }

    for (let i = 0; i < rayCount; i++) {
      const rayParticle = new PIXI.Particle({
        texture: PIXI.Texture.from(basic),
      });

      rayParticle.anchorX = 0.5;
      rayParticle.anchorY = 0.1;

      // 条状射线的尺寸：长而窄，更明显一些
      rayParticle.scaleX = 0.1; // 稍微宽一点
      rayParticle.scaleY = 0.1; // 更长一些
      rayParticle.x = this.x;
      rayParticle.y = this.y;
      // 射线颜色：更亮的蓝色
      const rayHsb = { h: 220, s: 35, b: 80 }; // 改为更亮的蓝色
      rayParticle.tint = toHsl([
        rayHsb.h / 360,
        rayHsb.s / 100,
        rayHsb.b / 100,
      ]);
      rayParticle.alpha = 0.7; // 提高初始透明度

      // 添加到容器
      this.instance.addParticle(rayParticle);
      this.rayParticles.push(rayParticle);
    }
  }

  // 创建主要条状粒子
  private createMainRayParticle() {
    if (!this.instance) return;

    this.mainRayParticle = new PIXI.Particle({
      texture: PIXI.Texture.from(basic),
    });

    this.mainRayParticle.anchorX = 0.5;
    this.mainRayParticle.anchorY = 0.1;

    // 主要条状粒子：更大更亮，更明显
    this.mainRayParticle.scaleX = 0.16; // 更宽
    this.mainRayParticle.scaleY = 0.16; // 更长

    // 主要射线颜色：非常亮的蓝白色
    const mainRayHsb = { h: 220, s: 15, b: 95 }; // 更亮的蓝色
    this.mainRayParticle.tint = toHsl([
      mainRayHsb.h / 360,
      mainRayHsb.s / 100,
      mainRayHsb.b / 100,
    ]);
    this.mainRayParticle.alpha = 0.95; // 很高的透明度
    this.mainRayParticle.x = this.x;
    this.mainRayParticle.y = this.y;
    // 添加到容器
    this.instance.addParticle(this.mainRayParticle);
  }

  // 更新射线粒子
  private updateRayParticles() {
    if (!this.instance) return;

    // 更新拖尾位置记录
    //随机位置
    const randomOffset = Math.random() * 15 - 7.5; // 随机偏移量
    const centerXInway = (this.x + this.rayTrailPositions[0].x) / 2;
    const centerYInway = (this.y + this.rayTrailPositions[0].y) / 2;
    console.log(
      "rayTrailPositions",
      this.rayTrailPositions[0],
      { X: this.x, Y: this.y },
      this.rayTrailPositions
    );
    this.rayTrailPositions.unshift({
      x: centerXInway + randomOffset,
      y: randomOffset + centerYInway,
    });
    console.log(
      "rayTrailPositions2",
      this.rayTrailPositions[0],
      { X: this.x, Y: this.y },
      this.rayTrailPositions
    );
    if (this.rayTrailPositions.length > 15) {
      this.rayTrailPositions.pop();
    }

    // 频闪效果参数（与核心粒子同步）
    const pulseFreq = this.palyTime * 0.8;
    const flashEffect = Math.sin(pulseFreq) > 0.7 ? 1.0 : 0;

    for (let i = 0; i < this.rayParticles.length; i++) {
      const rayParticle = this.rayParticles[i];

      // 计算拖尾位置索引（越靠后的射线使用越早的位置）
      const trailIndex = Math.min(
        Math.floor(i * 1.8) + 2,
        this.rayTrailPositions.length - 1
      );
      const trailPos = this.rayTrailPositions[trailIndex];

      if (trailPos) {
        rayParticle.x = trailPos.x;
        rayParticle.y = trailPos.y;
      }

      // 设置射线角度为rotation方向
      rayParticle.rotation = this.rotation;

      // 根据拖尾位置调整透明度和大小（越远越小越暗）
      const fadeRatio = 1 - trailIndex / 15;

      // 添加频闪效果到透明度
      const baseAlpha = 0.6 * fadeRatio;
      const flashAlpha = flashEffect * 0.2 * fadeRatio;
      rayParticle.alpha = baseAlpha + flashAlpha;

      // 添加频闪效果到长度
      const oldXY = this.rayTrailPositions[this.rayTrailPositions.length - 1];
      const distance = Math.sqrt(
        (rayParticle.x - oldXY.x) ** 2 + (rayParticle.y - oldXY.y) ** 2
      );

      const lengthRatio = Math.min(0.8, distance / 50);
      const baseLength = lengthRatio;
      const lengthPulse =
        baseLength + Math.sin(this.palyTime * 0.12) * 0.2 * lengthRatio;

      const flashLength = flashEffect * 0.15 * fadeRatio*lengthRatio;
      rayParticle.scaleY = (lengthPulse + flashLength) ;

      // 轻微的亮度变化 + 频闪亮度
      const brightnessVariation = Math.sin(this.palyTime * 0.06 + i * 0.3) * 5;
      const flashBrightness = flashEffect * 25;
      const rayHsb = {
        h: 220, // 改为蓝色
        s: flashEffect > 0 ? 10 : 35, // 频闪时饱和度变化
        b: Math.min(
          100,
          (70 + brightnessVariation + flashBrightness) * fadeRatio
        ),
      };
      rayParticle.tint = toHsl([
        rayHsb.h / 360,
        rayHsb.s / 100,
        rayHsb.b / 100,
      ]);
    }
  }

  // 更新主要条状粒子
  private updateMainRayParticle() {
    if (!this.mainRayParticle) return;

    // 主要条状粒子位置跟随核心粒子
    this.mainRayParticle.x = this.x;
    this.mainRayParticle.y = this.y;

    // 角度跟随rotation
    this.mainRayParticle.rotation = this.rotation;

    // 频闪效果参数（与核心粒子同步）
    const ax = this.palyTime * 0.3;
    const pulseFreq = this.palyTime * 0.8;
    const flashEffect = Math.sin(pulseFreq) > 0.7 ? 1.0 : 0;

    // 强烈的脉冲效果 + 频闪
    const basePulse = 0.8 + Math.sin(this.palyTime * 0.15) * 0.1;
    const flashAlpha = flashEffect * 0.2;
    this.mainRayParticle.alpha = Math.min(basePulse + flashAlpha, 1.0);

    // 长度的脉冲变化 + 频闪增强
    const oldXY = this.rayTrailPositions[this.rayTrailPositions.length - 1];
    console.log("oldXY", oldXY);
    console.log(
      "mainRayParticle oldXY",
      this.mainRayParticle.x,
      this.mainRayParticle.y
    );

    const distance = Math.sqrt(
      (this.mainRayParticle.x - oldXY.x) ** 2 +
        (this.mainRayParticle.y - oldXY.y) ** 2
    );
    console.log(
      "mainRayParticle oldXY distance",
      distance,
      oldXY,
      this.x,
      this.y
    );
    const lengthRatio = Math.min(0.8, distance / 50);
    const baseLength = lengthRatio;
    const lengthPulse =
      baseLength + Math.sin(this.palyTime * 0.12) * 0.2 * lengthRatio;
    const flashLength = flashEffect * 0.4 * lengthRatio;
    this.mainRayParticle.scaleY = lengthPulse + flashLength;
    console.log(
      "mainRayParticle scaleY",
      this.mainRayParticle.scaleY.toFixed(2),
      "baseLength",
      baseLength.toFixed(2),
      "lengthPulse",
      lengthPulse.toFixed(2),
      "flash",
      flashLength
    );
    // 宽度的脉冲变化 + 频闪增强
    const widthPulse = 0.1 + Math.sin(this.palyTime * 0.1) * 0.01;
    const flashWidth = flashEffect * 0.02;
    this.mainRayParticle.scaleX = widthPulse + flashWidth;

    // 亮度脉冲 + 频闪增强
    const brightnessPulse = Math.sin(this.palyTime * 0.1) * 5;
    const flashBrightness = flashEffect * 30;
    const mainRayHsb = {
      h: 220, // 改为蓝色
      s: flashEffect > 0 ? 10 : 15, // 频闪时饱和度变化
      b:
        flashEffect > 0
          ? 100
          : Math.min(100, 80 + brightnessPulse + flashBrightness),
    };
    this.mainRayParticle.tint = toHsl([
      mainRayHsb.h / 360,
      mainRayHsb.s / 100,
      mainRayHsb.b / 100,
    ]);
  }
}
function toHsl(hsbArray: number[]): PIXI.ColorSource {
  const [h, s, b] = hsbArray;

  // HSB到RGB转换
  const c = b * s; // chroma
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
  const m = b - c;

  let r = 0,
    g = 0,
    bl = 0;

  if (h >= 0 && h < 1 / 6) {
    r = c;
    g = x;
    bl = 0;
  } else if (h >= 1 / 6 && h < 2 / 6) {
    r = x;
    g = c;
    bl = 0;
  } else if (h >= 2 / 6 && h < 3 / 6) {
    r = 0;
    g = c;
    bl = x;
  } else if (h >= 3 / 6 && h < 4 / 6) {
    r = 0;
    g = x;
    bl = c;
  } else if (h >= 4 / 6 && h < 5 / 6) {
    r = x;
    g = 0;
    bl = c;
  } else if (h >= 5 / 6 && h <= 1) {
    r = c;
    g = 0;
    bl = x;
  }

  // 添加明度偏移并转换为0-255范围
  const red = Math.round((r + m) * 255);
  const green = Math.round((g + m) * 255);
  const blue = Math.round((bl + m) * 255);

  // 返回RGB十六进制数值
  return { r: red, g: green, b: blue };
}
