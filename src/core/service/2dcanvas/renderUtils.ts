/**
 * 高性能渲染工具模块
 * 使用 TypedArray 和位运算优化
 */

// 相机参数结构（与 WASM 对齐）
export interface CameraParams {
  posX: number;
  posY: number;
  posZ: number;
  forwardX: number;
  forwardY: number;
  forwardZ: number;
  rightX: number;
  rightY: number;
  rightZ: number;
  upX: number;
  upY: number;
  upZ: number;
  tanHalfFov: number;
  aspect: number;
  far: number;     // 远裁剪面距离（视距限制）
}

/**
 * 高性能射线追踪渲染器
 * 使用 Float32Array 和位运算优化
 */
export class TerrainRenderer {
  private srcData: Uint8ClampedArray | null = null;
  private srcWidth = 0;
  private srcHeight = 0;
  private dstData: Uint8ClampedArray | null = null;
  private dstWidth = 0;
  private dstHeight = 0;

  // 使用 Float32Array 避免对象创建
  private readonly rayCam = new Float32Array(3);
  private readonly rayWorld = new Float32Array(3);

  /**
   * 初始化源图像数据
   */
  initSrcData(imageData: ImageData): void {
    this.srcData = imageData.data;
    this.srcWidth = imageData.width;
    this.srcHeight = imageData.height;
  }

  /**
   * 高性能渲染（优化版）
   */
  render(camera: CameraParams, width: number, height: number): Uint8ClampedArray {
    if (!this.srcData) {
      throw new Error('Source data not initialized');
    }

    // 分配或重用目标缓冲区
    if (!this.dstData || this.dstWidth !== width || this.dstHeight !== height) {
      this.dstData = new Uint8ClampedArray(width * height * 4);
      this.dstWidth = width;
      this.dstHeight = height;
    }

    const dstData = this.dstData!;
    const srcData = this.srcData!;
    const srcWidth = this.srcWidth;
    const srcHeight = this.srcHeight;

    const camX = camera.posX;
    const camY = camera.posY;
    const camZ = camera.posZ;

    // 预计算变换矩阵
    const m00 = camera.rightX, m01 = camera.forwardX, m02 = camera.upX;
    const m10 = camera.rightY, m11 = camera.forwardY, m12 = camera.upY;
    const m20 = camera.rightZ, m21 = camera.forwardZ, m22 = camera.upZ;

    const tanHalfFov = camera.tanHalfFov;
    const aspect = camera.aspect;
    const invWidth = 1 / width;
    const invHeight = 1 / height;

    // 预计算常量
    const SKY_R = 0, SKY_G = 0, SKY_B = 0, SKY_A = 255;

    let dstIdx = 0;

    for (let dy = 0; dy < height; dy++) {
      const ndcYBase = 1 - dy * invHeight * 2;

      for (let dx = 0; dx < width; dx++) {
        // NDC 坐标
        const ndcX = (1-dx * invWidth * 2 ) * aspect;
        const ndcY = ndcYBase;

        // 相机空间射线
        let rayCamX = ndcX * tanHalfFov;
        let rayCamY = -ndcY * tanHalfFov;
        const rayCamZ = -1;

        // 归一化（使用平方根倒数近似）
        let lenSq = rayCamX * rayCamX + rayCamY * rayCamY + 1;
        let invLen = 1 / Math.sqrt(lenSq);
        let normX = rayCamX * invLen;
        let normY = rayCamY * invLen;
        let normZ = -invLen;

        // 世界空间射线 Z
        let rayDirZ = normX * m20 + normY * m21 + normZ * m22;

        if (Math.abs(rayDirZ) < 0.0001) {
          dstData[dstIdx++] = SKY_R;
          dstData[dstIdx++] = SKY_G;
          dstData[dstIdx++] = SKY_B;
          dstData[dstIdx++] = SKY_A;
          continue;
        }

        const t = -camZ / rayDirZ;

        if (t < 0) {
          dstData[dstIdx++] = SKY_R;
          dstData[dstIdx++] = SKY_G;
          dstData[dstIdx++] = SKY_B;
          dstData[dstIdx++] = SKY_A;
          continue;
        }

        // 世界坐标交点
        const worldX = camX + (normX * m00 + normY * m01 + normZ * m02) * t;
        const worldY = camY + (normX * m10 + normY * m11 + normZ * m12) * t;

        // 视距限制：只检查 Y 轴方向（远端边界为直线）
        const deltaY = Math.abs(worldY - camY);
        if (deltaY > camera.far) {
          dstData[dstIdx++] = SKY_R;
          dstData[dstIdx++] = SKY_G;
          dstData[dstIdx++] = SKY_B;
          dstData[dstIdx++] = SKY_A;
          continue;
        }

        // 图像坐标
        const hitX = worldX;
        const hitY =  worldY;

        // 边界检查
        if (hitX < 0 || hitX >= srcWidth || hitY < 0 || hitY >= srcHeight) {
          dstData[dstIdx++] = SKY_R;
          dstData[dstIdx++] = SKY_G;
          dstData[dstIdx++] = SKY_B;
          dstData[dstIdx++] = SKY_A;
          continue;
        }

        // 双线性插值
        const x0 = hitX | 0;  // 位运算取整
        const y0 = hitY | 0;
        const x1 = Math.min(x0 + 1, srcWidth - 1);
        const y1 = Math.min(y0 + 1, srcHeight - 1);

        const fx = hitX - x0;
        const fy = hitY - y0;
        const fx1 = 1 - fx;
        const fy1 = 1 - fy;

        const w00 = fx1 * fy1;
        const w10 = fx * fy1;
        const w01 = fx1 * fy;
        const w11 = fx * fy;

        const i00 = (y0 * srcWidth + x0) << 2;  // 乘以4用位移
        const i10 = (y0 * srcWidth + x1) << 2;
        const i01 = (y1 * srcWidth + x0) << 2;
        const i11 = (y1 * srcWidth + x1) << 2;

        // RGB 插值
        dstData[dstIdx++] =
          srcData[i00] * w00 + srcData[i10] * w10 +
          srcData[i01] * w01 + srcData[i11] * w11;
        dstData[dstIdx++] =
          srcData[i00 + 1] * w00 + srcData[i10 + 1] * w10 +
          srcData[i01 + 1] * w01 + srcData[i11 + 1] * w11;
        dstData[dstIdx++] =
          srcData[i00 + 2] * w00 + srcData[i10 + 2] * w10 +
          srcData[i01 + 2] * w01 + srcData[i11 + 2] * w11;
        dstData[dstIdx++] = 255;
      }
    }

    return dstData;
  }

  /**
   * 获取渲染结果的 ImageData
   */
  getImageData(): ImageData {
    if (!this.dstData) {
      throw new Error('No rendered data available');
    }
    // 创建新的 Uint8ClampedArray 避免类型问题
    const data = new Uint8ClampedArray(this.dstData);
    return new ImageData(data, this.dstWidth, this.dstHeight);
  }
}

/**
 * 屏幕坐标转世界坐标
 * @param screenX 屏幕X坐标
 * @param screenY 屏幕Y坐标
 * @param screenWidth 屏幕宽度
 * @param screenHeight 屏幕高度
 * @param camera 相机参数
 * @returns 世界坐标，射线向上时返回 null
 */
export function screenToWorld(
  screenX: number,
  screenY: number,
  screenWidth: number,
  screenHeight: number,
  camera: CameraParams
): { x: number; y: number } | null {
  const DEBUG = false;

  const invWidth = 1 / screenWidth;
  const invHeight = 1 / screenHeight;

  // NDC 坐标
  const ndcX = (1-screenX * invWidth * 2 ) * camera.aspect;
  const ndcY = 1 - screenY * invHeight * 2;

  if (DEBUG) {
    console.log('[screenToWorld DEBUG] 输入屏幕坐标:', `(${screenX.toFixed(2)}, ${screenY.toFixed(2)})`);
    console.log('[screenToWorld DEBUG] NDC坐标:', `ndcX=${ndcX.toFixed(4)}, ndcY=${ndcY.toFixed(4)}`);
  }

  // 相机空间射线
  const rayCamX = ndcX * camera.tanHalfFov;
  const rayCamY = -ndcY * camera.tanHalfFov;

  if (DEBUG) {
    console.log('[screenToWorld DEBUG] 相机空间射线:', `rayCamX=${rayCamX.toFixed(4)}, rayCamY=${rayCamY.toFixed(4)}`);
  }

  // 归一化
  const lenSq = rayCamX * rayCamX + rayCamY * rayCamY + 1;
  const invLen = 1 / Math.sqrt(lenSq);
  const normX = rayCamX * invLen;
  const normY = rayCamY * invLen;
  const normZ = -invLen;

  // 世界空间射线 Z 分量
  const rayDirZ = normX * camera.rightZ + normY * camera.forwardZ + normZ * camera.upZ;

  if (Math.abs(rayDirZ) < 0.0001) {
    if (DEBUG) console.log('[screenToWorld DEBUG] ❌ 射线与地面平行');
    return null; // 射线与地面平行
  }

  const t = -camera.posZ / rayDirZ;
  if (t < 0) {
    if (DEBUG) console.log('[screenToWorld DEBUG] ❌ 地面在相机后面');
    return null; // 地面在相机后面
  }

  if (DEBUG) {
    console.log('[screenToWorld DEBUG] t参数:', t.toFixed(4));
  }

  // 世界坐标交点
  const worldDirX = normX * camera.rightX + normY * camera.forwardX + normZ * camera.upX;
  const worldDirY = normX * camera.rightY + normY * camera.forwardY + normZ * camera.upY;

  const result = {
    x: camera.posX + worldDirX * t,
    y: camera.posY + worldDirY * t,
  };

  if (DEBUG) {
    console.log('[screenToWorld DEBUG] 输出世界坐标:', `(${result.x.toFixed(2)}, ${result.y.toFixed(2)})`);
  }

  return result;
}

/**
 * 世界坐标转屏幕坐标
 * @param worldX 世界X坐标
 * @param worldY 世界Y坐标
 * @param screenWidth 屏幕宽度
 * @param screenHeight 屏幕高度
 * @param camera 相机参数
 * @returns 屏幕坐标，点在相机后面或视锥体外时返回 null
 */
export function worldToScreen(
  worldX: number,
  worldY: number,
  screenWidth: number,
  screenHeight: number,
  camera: CameraParams
): { x: number; y: number } | null {
  const DEBUG = false;

  // 世界坐标点（假设 Z=0 在地面上）
  const worldZ = 0;

  // 世界坐标相对于相机的向量
  const dx = worldX - camera.posX;
  const dy = worldY - camera.posY;
  const dz = worldZ - camera.posZ;

  // 变换到相机空间（使用视图矩阵的逆，即相机的 right/forward/up 作为基向量）
  // 相机空间：X=right, Y=forward, Z=up (注意这里的 up 是正 Z 方向)
  const camX = dx * camera.rightX + dy * camera.rightY + dz * camera.rightZ;
  const camY = dx * camera.forwardX + dy * camera.forwardY + dz * camera.forwardZ;
  const camZ = dx * camera.upX + dy * camera.upY + dz * camera.upZ;

  if (DEBUG) {
    console.log('[worldToScreen DEBUG] 输入世界坐标:', `(${worldX.toFixed(2)}, ${worldY.toFixed(2)})`);
    console.log('[worldToScreen DEBUG] 相机位置:', `(${camera.posX.toFixed(2)}, ${camera.posY.toFixed(2)}, ${camera.posZ.toFixed(2)})`);
    console.log('[worldToScreen DEBUG] 相机空间坐标:', `camX=${camX.toFixed(2)}, camY=${camY.toFixed(2)}, camZ=${camZ.toFixed(2)}`);
  }

  // 检查点是否在相机前面（camZ < 0，因为相机看向 -Z 方向）
  if (camZ >= 0) {
    if (DEBUG) console.log('[worldToScreen DEBUG] ❌ 点在相机后面');
    return null; // 点在相机后面
  }

  // 透视投影到 NDC（归一化设备坐标）
  const ndcX = camX / (-camZ * camera.tanHalfFov);
  const ndcY = -camY / (-camZ * camera.tanHalfFov);

  if (DEBUG) {
    console.log('[worldToScreen DEBUG] NDC坐标:', `ndcX=${ndcX.toFixed(4)}, ndcY=${ndcY.toFixed(4)}`);
    console.log('[worldToScreen DEBUG] tanHalfFov=', camera.tanHalfFov.toFixed(4), 'aspect=', camera.aspect);
  }

  // 检查是否在视锥体内
  // if (Math.abs(ndcX) > 1 || Math.abs(ndcY) > 1) {
  //   if (DEBUG) console.log('[worldToScreen DEBUG] ❌ 点在视锥体外');
  //   return null; // 点在视锥体外
  // }

  // NDC 转换到屏幕坐标
  // 屏幕坐标：左上为原点 (0,0)，X 右正，Y 下正
  const screenX = (1 - ndcX / camera.aspect) * screenWidth / 2;
  const screenY = (1 - ndcY) * screenHeight / 2;

  if (DEBUG) {
    console.log('[worldToScreen DEBUG] 输出屏幕坐标:', `(${screenX.toFixed(2)}, ${screenY.toFixed(2)})`);
  }

  return { x: screenX, y: screenY };
}

/**
 * 从 PerspectiveCameraConfig 构建 CameraParams
 */
export function buildCameraParams(
  position: { x: number; y: number; z: number },
  forward: { x: number; y: number; z: number },
  right: { x: number; y: number; z: number },
  up: { x: number; y: number; z: number },
  fov: number,
  aspect: number,
  far: number
): CameraParams {
  const fovRad = (fov * Math.PI) / 180;
  return {
    posX: position.x,
    posY: position.y,
    posZ: position.z,
    forwardX: forward.x,
    forwardY: forward.y,
    forwardZ: forward.z,
    rightX: right.x,
    rightY: right.y,
    rightZ: right.z,
    upX: up.x,
    upY: up.y,
    upZ: up.z,
    tanHalfFov: Math.tan(fovRad / 2),
    aspect,
    far,
  };
}
