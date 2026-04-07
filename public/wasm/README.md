# WASM + SIMD 渲染器

当前项目已使用优化的 TypeScript 渲染器。如需进一步使用 WASM + SIMD 获得更高性能，请按以下步骤操作：

## 编译 WASM 模块

### 1. 安装 Emscripten

```bash
# Windows (使用 apt 或直接下载安装包)
# 或访问: https://emscripten.org/docs/getting_started/downloads.html

# 验证安装
emcc --version
```

### 2. 编译 renderer.cpp

```bash
cd public/wasm
emcc renderer.cpp -O3 -msimd128 -s WASM=1 \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s EXPORTED_FUNCTIONS="_initSrcData,_renderTerrain" \
  -s EXPORTED_RUNTIME_METHODS="ccall,cwrap" \
  -o renderer.js
```

### 3. 生成的文件

- `renderer.wasm` - WASM 二进制文件
- `renderer.js` - JavaScript glue 代码

## 性能对比

| 实现方式 | 相对性能 | 说明 |
|---------|---------|------|
| 原始 JS 版本 | 1x | CPU 逐像素射线追踪 |
| 优化 JS 版本 | ~2-3x | 缓存 + 位运算 + Float32Array |
| WASM + SIMD | ~5-8x | 原生性能 + 向量化（需编译） |

## 当前已实现的优化

1. **ImageData 缓存** - 源图像数据只加载一次
2. **Float32Array** - 避免对象创建
3. **位运算** - 使用 `| 0` 代替 `Math.floor`
4. **预计算矩阵** - 避免重复计算相机变换
5. **内存复用** - 目标缓冲区重用
