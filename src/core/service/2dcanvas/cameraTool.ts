/**
 * 3D 点类型
 */
export interface Point3 {
  x: number;
  y: number;
  z: number;
}

/**
 * 向量运算工具类
 */
export class Vec3 {
  constructor(public x: number = 0, public y: number = 0, public z: number = 0) {}

  static create(x: number, y: number, z: number): Vec3 {
    return new Vec3(x, y, z);
  }

  static fromPoint3(p: Point3): Vec3 {
    return new Vec3(p.x, p.y, p.z);
  }

  add(v: Vec3): Vec3 {
    return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z);
  }

  sub(v: Vec3): Vec3 {
    return new Vec3(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  scale(s: number): Vec3 {
    return new Vec3(this.x * s, this.y * s, this.z * s);
  }

  dot(v: Vec3): number {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  cross(v: Vec3): Vec3 {
    return new Vec3(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  normalize(): Vec3 {
    const len = this.length();
    if (len === 0) return new Vec3();
    return new Vec3(this.x / len, this.y / len, this.z / len);
  }

  toPoint3(): Point3 {
    return { x: this.x, y: this.y, z: this.z };
  }
}

/**
 * 透视投影相机配置（类似 Unity/Unreal）
 *
 * 坐标系说明：
 * - X轴向右，Y轴向前，Z轴向上（右手坐标系）
 * - 相机默认朝向Y轴负方向
 */
export interface PerspectiveCameraConfig {
  // 位置（世界坐标）
  position: Point3;
  // 旋转（欧拉角：度）
  pitch: number;  // 俯仰角（绕X轴），正数向下看，负数向上看
  yaw: number;    // 偏航角（绕Z轴），0度朝向Y轴负方向，正数顺时针
  // 视野
  fov: number;    // 垂直视野角度（度）
  // 裁剪面
  near: number;   // 近裁剪面距离
  far: number;    // 远裁剪面距离
}

/**
 * 透视投影相机类
 */
export class PerspectiveCamera {
  private config: PerspectiveCameraConfig;

  constructor(config: Partial<PerspectiveCameraConfig> = {}) {
    this.config = {
      position: { x: 0, y: 0, z: 100 },
      pitch: 60,      // 向下看45度
      yaw: 0,         // 朝向Y轴负方向（前方）
      fov: 60,
      near: 1,
      far: 1000,
      ...config,
    };
  }

  getConfig(): PerspectiveCameraConfig {
    return { ...this.config };
  }

  setConfig(config: Partial<PerspectiveCameraConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /** 获取相机位置 */
  getPosition(): Point3 {
    return { ...this.config.position };
  }

  /** 设置相机位置 */
  setPosition(pos: Point3): void {
    this.config.position = { ...pos };
  }

  /**
   * 获取相机的朝向向量（世界空间）
   * 默认朝向 Y轴负方向，先绕 Z 轴旋转（yaw），再绕 X 轴旋转（pitch）
   */
  getForward(): Vec3 {
    const yawRad = (-this.config.yaw * Math.PI) / 180;  // 负号使顺时针为正
    const pitchRad = (-this.config.pitch * Math.PI) / 180;  // 负号使向下为正

    // 欧拉角旋转：先绕Z轴，再绕旋转后的X轴
    // 默认朝向 (0, -1, 0)
    const x = Math.sin(yawRad) * Math.cos(pitchRad);
    const y = Math.cos(yawRad) * Math.cos(pitchRad);
    const z = Math.sin(pitchRad);

    return Vec3.create(x, y, z).normalize();
  }

  /**
   * 获取相机的右方向向量
   */
  getRight(): Vec3 {
    const forward = this.getForward();
  
    // 世界向上是 Z 轴
    const worldUp = Vec3.create(0, 0, 1);
    return worldUp.cross(forward).normalize();
  }

  /**
   * 获取相机的上方向向量
   */
  getUp(): Vec3 {
    const forward = this.getForward();
    const right = this.getRight();
    return forward.cross(right).normalize();
  }

  /**
   * 计算视锥体在给定距离处的高度和宽度
   */
  private getFrustumSize(distance: number): { height: number; width: number } {
    const fovRad = (this.config.fov * Math.PI) / 180;
    const height = 2 * distance * Math.tan(fovRad / 2);
    const aspect = 16 / 9;  // 默认宽高比
    const width = height * aspect;
    return { height, width };
  }

  /**
   * 计算射线与水平面 z = planeZ 的交点
   * @param origin 射线起点
   * @param direction 射线方向（单位向量）
   * @param planeZ 平面高度
   * @returns 交点坐标，如果射线与平面平行返回 null
   */
  static rayPlaneIntersection(origin: Vec3, direction: Vec3, planeZ: number): Point3 | null {
    if (Math.abs(direction.z) < 1e-10) {
      return null;  // 射线与平面平行
    }

    const t = (planeZ - origin.z) / direction.z;
    if (t < 0) {
      return null;  // 交点在射线反方向
    }

    return origin.add(direction.scale(t)).toPoint3();
  }

  /**
   * 获取视锥体四个角在地面（z = groundZ）上的投影
   * @param groundZ 地面高度（默认 0）
   * @returns 四个角点（左上、右上、右下、左下），如果地面不在视锥体内返回 null
   */
  getGroundProjection(groundZ: number = 0): Point3[] | null {
    const pos = Vec3.fromPoint3(this.config.position);
    const forward = this.getForward();
    const right = this.getRight();
    const up = this.getUp();

    // 在远裁剪面处计算视锥体大小
    const farSize = this.getFrustumSize(this.config.far);
    const farCenter = pos.add(forward.scale(this.config.far));

    const farHalfW = farSize.width / 2;
    const farHalfH = farSize.height / 2;

    // 远裁剪面四个角
    const farTopLeft = farCenter.add(up.scale(farHalfH)).sub(right.scale(farHalfW));
    const farTopRight = farCenter.add(up.scale(farHalfH)).add(right.scale(farHalfW));
    const farBottomLeft = farCenter.sub(up.scale(farHalfH)).sub(right.scale(farHalfW));
    const farBottomRight = farCenter.sub(up.scale(farHalfH)).add(right.scale(farHalfW));

    // 计算四条射线与地面的交点
    const topLeft = PerspectiveCamera.rayPlaneIntersection(pos, farTopLeft.sub(pos).normalize(), groundZ);
    const topRight = PerspectiveCamera.rayPlaneIntersection(pos, farTopRight.sub(pos).normalize(), groundZ);
    const bottomLeft = PerspectiveCamera.rayPlaneIntersection(pos, farBottomLeft.sub(pos).normalize(), groundZ);
    const bottomRight = PerspectiveCamera.rayPlaneIntersection(pos, farBottomRight.sub(pos).normalize(), groundZ);

    if (!topLeft || !topRight || !bottomLeft || !bottomRight) {
      return null;
    }

    // 返回顺序：左上、右上、右下、左下（对应屏幕布局）
    return [topLeft, topRight, bottomRight, bottomLeft];
  }
}

/**
 * 相机管理类（单例）
 */
export class CameraManager {
  private static instance: CameraManager;
  private camera: PerspectiveCamera;

  private constructor() {
    this.camera = new PerspectiveCamera();
  }

  static getInstance(): CameraManager {
    if (!CameraManager.instance) {
      CameraManager.instance = new CameraManager();
    }
    return CameraManager.instance;
  }

  getCamera(): PerspectiveCamera {
    return this.camera;
  }

  getConfig(): PerspectiveCameraConfig {
    return this.camera.getConfig();
  }

  setConfig(config: Partial<PerspectiveCameraConfig>): void {
    this.camera.setConfig(config);
    this.notify();
  }

  private listeners: Set<() => void> = new Set();

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify(): void {
    this.listeners.forEach(cb => cb());
  }
}

/** 导出单例实例 */
export const cameraManager = CameraManager.getInstance();

/** 导出便捷函数 */
export function getGroundProjection(groundZ: number = 0): Point3[] | null {
  return cameraManager.getCamera().getGroundProjection(groundZ);
}
