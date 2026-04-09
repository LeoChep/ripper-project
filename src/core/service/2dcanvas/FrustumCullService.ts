/**
 * 视锥体裁剪服务
 * 用于判断世界坐标中的物体是否在2.5D相机的视野内
 */

import { cameraManager } from './cameraTool';
import { worldToScreen, buildCameraParams, type CameraParams } from './renderUtils';
import * as envSetting from '@/core/envSetting';

/**
 * 视锥体裁剪服务类（单例）
 */
export class FrustumCullService {
  private static instance: FrustumCullService;
  private viewportWidth: number = 640;
  private viewportHeight: number = 360;
  private cameraParams: CameraParams | null = null;

  private constructor() {}

  static getInstance(): FrustumCullService {
    if (!FrustumCullService.instance) {
      FrustumCullService.instance = new FrustumCullService();
    }
    return FrustumCullService.instance;
  }

  /**
   * 设置视窗大小
   */
  setViewportSize(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
  }

  /**
   * 更新相机参数缓存
   */
  private updateCameraParams(): void {
    const camera = cameraManager.getCamera();
    const config = camera.getConfig();
    const forward = camera.getForward();
    const right = camera.getRight();
    const up = camera.getUp();

    this.cameraParams = buildCameraParams(
      config.position,
      forward,
      right,
      up,
      config.fov,
      this.viewportWidth / this.viewportHeight,
      config.far
    );
  }

  /**
   * 判断世界坐标点是否在视窗内
   * @param worldX 世界X坐标
   * @param worldY 世界Y坐标
   * @returns 是否在视窗内
   */
  isInViewport(worldX: number, worldY: number): boolean {
    // 如果不在2.5D模式，始终返回true（显示所有物体）
    if (!envSetting.is25dEnabled) {
      return true;
    }

    // 更新相机参数
    this.updateCameraParams();
    if (!this.cameraParams) {
      return true;
    }

    // 转换为屏幕坐标
    const screenPos = worldToScreen(
      worldX,
      worldY,
      this.viewportWidth,
      this.viewportHeight,
      this.cameraParams
    );

    if (!screenPos) {
      return false; // 在相机后面或视锥体外
    }

    // 检查是否在视窗范围内（添加一些缓冲区，让物体在边缘逐渐显示）
    const buffer = 50; // 缓冲区大小（像素）
    return (
      screenPos.x >= -buffer &&
      screenPos.x <= this.viewportWidth + buffer &&
      screenPos.y >= -buffer &&
      screenPos.y <= this.viewportHeight + buffer
    );
  }

  /**
   * 获取世界坐标点在屏幕上的位置
   * @param worldX 世界X坐标
   * @param worldY 世界Y坐标
   * @returns 屏幕坐标，如果在视窗外返回 null
   */
  getScreenPosition(worldX: number, worldY: number): { x: number; y: number } | null {
    if (!envSetting.is25dEnabled) {
      // 非2.5D模式，返回世界坐标作为屏幕坐标
      return { x: worldX, y: worldY };
    }

    this.updateCameraParams();
    if (!this.cameraParams) {
      return { x: worldX, y: worldY };
    }

    return worldToScreen(
      worldX,
      worldY,
      this.viewportWidth,
      this.viewportHeight,
      this.cameraParams
    );
  }

  /**
   * 判断矩形区域是否在视窗内（用于大尺寸物体）
   * @param x 中心X坐标
   * @param y 中心Y坐标
   * @param width 宽度
   * @param height 高度
   * @returns 是否在视窗内（任意角点在视窗内即返回true）
   */
  isRectInViewport(x: number, y: number, width: number, height: number): boolean {
    if (!envSetting.is25dEnabled) {
      return true;
    }

    // 检查四个角点
    const halfW = width / 2;
    const halfH = height / 2;

    return (
      this.isInViewport(x - halfW, y - halfH) ||
      this.isInViewport(x + halfW, y - halfH) ||
      this.isInViewport(x - halfW, y + halfH) ||
      this.isInViewport(x + halfW, y + halfH)
    );
  }
}

/** 导出单例实例 */
export const frustumCullService = FrustumCullService.getInstance();
