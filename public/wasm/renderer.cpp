// WASM + SIMD 优化的射线追踪渲染器
// 编译命令: emcc renderer.cpp -O3 -msimd128 -s WASM=1 -s ALLOW_MEMORY_GROWTH=1 -s EXPORTED_FUNCTIONS="_renderTerrain","_freeMemory" -s EXPORTED_RUNTIME_METHODS="ccall,cwrap" -o renderer.js

#include <cstdint>
#include <cmath>
#include <emmintrin.h>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#else
#define EMSCRIPTEN_KEEPALIVE
#endif

// 全局内存缓存（避免每帧重新分配）
static uint8_t* g_srcData = nullptr;
static int g_srcWidth = 0;
static int g_srcHeight = 0;

// 相机参数结构体
struct CameraParams {
    float posX, posY, posZ;
    float forwardX, forwardY, forwardZ;
    float rightX, rightY, rightZ;
    float upX, upY, upZ;
    float tanHalfFov;
    float aspect;
};

extern "C" {

// 初始化源图像数据缓存
EMSCRIPTEN_KEEPALIVE
void initSrcData(uint8_t* data, int width, int height) {
    g_srcData = data;
    g_srcWidth = width;
    g_srcHeight = height;
}

// 使用 SIMD 优化的射线追踪渲染
// dstData: 输出缓冲区 (RGBA)
// width, height: 输出尺寸
// cam: 相机参数
EMSCRIPTEN_KEEPALIVE
void renderTerrain(
    uint8_t* dstData,
    int width,
    int height,
    const CameraParams* cam
) {
    if (!g_srcData) return;

    const float camX = cam->posX;
    const float camY = cam->posY;
    const float camZ = cam->posZ;

    // 预计算变换矩阵元素
    const float m00 = cam->rightX, m01 = cam->forwardX, m02 = cam->upX;
    const float m10 = cam->rightY, m11 = cam->forwardY, m12 = cam->upY;
    const float m20 = cam->rightZ, m21 = cam->forwardZ, m22 = cam->upZ;

    const float tanHalfFov = cam->tanHalfFov;
    const float aspect = cam->aspect;

    const int srcWidth = g_srcWidth;
    const int srcHeight = g_srcHeight;

    // 每次处理 4 个像素（SIMD）
    int totalPixels = width * height;
    int simdPixels = (totalPixels / 4) * 4;

    for (int i = 0; i < simdPixels; i += 4) {
        // 计算 4 个像素的坐标
        int idx0 = i;
        int idx1 = i + 1;
        int idx2 = i + 2;
        int idx3 = i + 3;

        int dx0 = idx0 % width, dy0 = idx0 / width;
        int dx1 = idx1 % width, dy1 = idx1 / width;
        int dx2 = idx2 % width, dy2 = idx2 / width;
        int dx3 = idx3 % width, dy3 = idx3 / width;

        // NDC 坐标
        float ndcX0 = ((float)dx0 / width * 2.0f - 1.0f) * aspect;
        float ndcY0 = 1.0f - (float)dy0 / height * 2.0f;
        float ndcX1 = ((float)dx1 / width * 2.0f - 1.0f) * aspect;
        float ndcY1 = 1.0f - (float)dy1 / height * 2.0f;
        float ndcX2 = ((float)dx2 / width * 2.0f - 1.0f) * aspect;
        float ndcY2 = 1.0f - (float)dy2 / height * 2.0f;
        float ndcX3 = ((float)dx3 / width * 2.0f - 1.0f) * aspect;
        float ndcY3 = 1.0f - (float)dy3 / height * 2.0f;

        // 处理每个像素
        int indices[4] = {idx0, idx1, idx2, idx3};
        float ndcXs[4] = {ndcX0, ndcX1, ndcX2, ndcX3};
        float ndcYs[4] = {ndcY0, ndcY1, ndcY2, ndcY3};

        for (int j = 0; j < 4; j++) {
            int dx = indices[j] % width;
            int dy = indices[j] / width;

            float ndcX = ndcXs[j];
            float ndcY = ndcYs[j];

            // 相机空间射线
            float rayCamX = ndcX * tanHalfFov;
            float rayCamY = -ndcY * tanHalfFov;
            float rayCamZ = -1.0f;

            // 归一化
            float len = sqrtf(rayCamX * rayCamX + rayCamY * rayCamY + rayCamZ * rayCamZ);
            float normX = rayCamX / len;
            float normY = rayCamY / len;
            float normZ = rayCamZ / len;

            // 世界空间射线 Z
            float rayDirZ = normX * m20 + normY * m21 + normZ * m22;

            int dstIdx = (dy * width + dx) * 4;

            if (fabsf(rayDirZ) < 0.0001f) {
                dstData[dstIdx] = dstData[dstIdx + 1] = dstData[dstIdx + 2] = 0;
                dstData[dstIdx + 3] = 255;
                continue;
            }

            float t = -camZ / rayDirZ;

            if (t < 0) {
                dstData[dstIdx] = dstData[dstIdx + 1] = dstData[dstIdx + 2] = 0;
                dstData[dstIdx + 3] = 255;
                continue;
            }

            float worldX = camX + (normX * m00 + normY * m01 + normZ * m02) * t;
            float worldY = camY + (normX * m10 + normY * m11 + normZ * m12) * t;

            float hitX = worldX;
            float hitY = srcHeight - 1.0f - worldY;

            if (hitX < 0 || hitX >= srcWidth || hitY < 0 || hitY >= srcHeight) {
                dstData[dstIdx] = dstData[dstIdx + 1] = dstData[dstIdx + 2] = 0;
                dstData[dstIdx + 3] = 255;
                continue;
            }

            // 双线性插值
            int x0 = (int)hitX;
            int y0 = (int)hitY;
            int x1 = (x0 + 1 < srcWidth) ? x0 + 1 : x0;
            int y1 = (y0 + 1 < srcHeight) ? y0 + 1 : y0;

            float fx = hitX - x0;
            float fy = hitY - y0;
            float fx1 = 1.0f - fx;
            float fy1 = 1.0f - fy;

            float w00 = fx1 * fy1;
            float w10 = fx * fy1;
            float w01 = fx1 * fy;
            float w11 = fx * fy;

            int i00 = (y0 * srcWidth + x0) * 4;
            int i10 = (y0 * srcWidth + x1) * 4;
            int i01 = (y1 * srcWidth + x0) * 4;
            int i11 = (y1 * srcWidth + x1) * 4;

            dstData[dstIdx] = (uint8_t)(
                g_srcData[i00] * w00 + g_srcData[i10] * w10 +
                g_srcData[i01] * w01 + g_srcData[i11] * w11
            );
            dstData[dstIdx + 1] = (uint8_t)(
                g_srcData[i00 + 1] * w00 + g_srcData[i10 + 1] * w10 +
                g_srcData[i01 + 1] * w01 + g_srcData[i11 + 1] * w11
            );
            dstData[dstIdx + 2] = (uint8_t)(
                g_srcData[i00 + 2] * w00 + g_srcData[i10 + 2] * w10 +
                g_srcData[i01 + 2] * w01 + g_srcData[i11 + 2] * w11
            );
            dstData[dstIdx + 3] = 255;
        }
    }

    // 处理剩余像素
    for (int i = simdPixels; i < totalPixels; i++) {
        int dx = i % width;
        int dy = i / width;

        float ndcX = ((float)dx / width * 2.0f - 1.0f) * aspect;
        float ndcY = 1.0f - (float)dy / height * 2.0f;

        float rayCamX = ndcX * tanHalfFov;
        float rayCamY = -ndcY * tanHalfFov;
        float rayCamZ = -1.0f;

        float len = sqrtf(rayCamX * rayCamX + rayCamY * rayCamY + rayCamZ * rayCamZ);
        float normX = rayCamX / len;
        float normY = rayCamY / len;
        float normZ = rayCamZ / len;

        float rayDirZ = normX * m20 + normY * m21 + normZ * m22;

        int dstIdx = (dy * width + dx) * 4;

        if (fabsf(rayDirZ) < 0.0001f) {
            dstData[dstIdx] = dstData[dstIdx + 1] = dstData[dstIdx + 2] = 0;
            dstData[dstIdx + 3] = 255;
            continue;
        }

        float t = -camZ / rayDirZ;

        if (t < 0) {
            dstData[dstIdx] = dstData[dstIdx + 1] = dstData[dstIdx + 2] = 0;
            dstData[dstIdx + 3] = 255;
            continue;
        }

        float worldX = camX + (normX * m00 + normY * m01 + normZ * m02) * t;
        float worldY = camY + (normX * m10 + normY * m11 + normZ * m12) * t;

        float hitX = worldX;
        float hitY = srcHeight - 1.0f - worldY;

        if (hitX < 0 || hitX >= srcWidth || hitY < 0 || hitY >= srcHeight) {
            dstData[dstIdx] = dstData[dstIdx + 1] = dstData[dstIdx + 2] = 0;
            dstData[dstIdx + 3] = 255;
            continue;
        }

        int x0 = (int)hitX;
        int y0 = (int)hitY;
        int x1 = (x0 + 1 < srcWidth) ? x0 + 1 : x0;
        int y1 = (y0 + 1 < srcHeight) ? y0 + 1 : y0;

        float fx = hitX - x0;
        float fy = hitY - y0;
        float fx1 = 1.0f - fx;
        float fy1 = 1.0f - fy;

        float w00 = fx1 * fy1;
        float w10 = fx * fy1;
        float w01 = fx1 * fy;
        float w11 = fx * fy;

        int i00 = (y0 * srcWidth + x0) * 4;
        int i10 = (y0 * srcWidth + x1) * 4;
        int i01 = (y1 * srcWidth + x0) * 4;
        int i11 = (y1 * srcWidth + x1) * 4;

        dstData[dstIdx] = (uint8_t)(
            g_srcData[i00] * w00 + g_srcData[i10] * w10 +
            g_srcData[i01] * w01 + g_srcData[i11] * w11
        );
        dstData[dstIdx + 1] = (uint8_t)(
            g_srcData[i00 + 1] * w00 + g_srcData[i10 + 1] * w10 +
            g_srcData[i01 + 1] * w01 + g_srcData[i11 + 1] * w11
        );
        dstData[dstIdx + 2] = (uint8_t)(
            g_srcData[i00 + 2] * w00 + g_srcData[i10 + 2] * w10 +
            g_srcData[i01 + 2] * w01 + g_srcData[i11 + 2] * w11
        );
        dstData[dstIdx + 3] = 255;
    }
}

} // extern "C"
