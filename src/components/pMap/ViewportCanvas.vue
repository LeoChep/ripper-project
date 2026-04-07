<template>
  <div class="viewport-canvas">
    <canvas ref="canvasRef" :width="width" :height="height" id="viewport-canvas"></canvas>
    <div class="info">视窗 {{ width }}×{{ height }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { cameraManager } from '@/core/service/2dcanvas/cameraTool';
import { TerrainRenderer, buildCameraParams } from '@/core/service/2dcanvas/renderUtils';
import { getMapAssetFile } from '@/utils/utils';

const props = withDefaults(
  defineProps<{
    width?: number;
    height?: number;
  }>(),
  {
    width: 640,
    height: 360,
  }
);

const canvasRef = ref<HTMLCanvasElement>();
const groundImage = new Image();
groundImage.src = getMapAssetFile('road');

// 使用优化的渲染器
const renderer = new TerrainRenderer();
let srcImageData: ImageData | null = null;

let unsubscribe: (() => void) | null = null;

/**
 * 初始化源图像数据缓存
 */
function initSrcImageData(): void {
  if (srcImageData) return; // 已缓存

  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = groundImage.naturalWidth;
  srcCanvas.height = groundImage.naturalHeight;
  const srcCtx = srcCanvas.getContext('2d');
  if (!srcCtx) return;
  srcCtx.drawImage(groundImage, 0, 0);
  srcImageData = srcCtx.getImageData(0, 0, groundImage.naturalWidth, groundImage.naturalHeight);
  renderer.initSrcData(srcImageData);
}

/**
 * 透视渲染：使用优化的渲染器
 */
function render() {
  if (!canvasRef.value) return;
  const ctx = canvasRef.value.getContext('2d');
  if (!ctx) return;

  // 清空画布为天空色（黑色）
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, props.width, props.height);

  // 等待图片加载
  if (!groundImage.complete || groundImage.naturalWidth === 0) {
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('加载中...', props.width / 2 - 30, props.height / 2);
    return;
  }

  // 初始化源图像数据缓存
  initSrcImageData();
  if (!srcImageData) return;

  // 获取相机参数
  const camera = cameraManager.getCamera();
  const config = camera.getConfig();
  const camPos = config.position;
  const forward = camera.getForward();
  const right = camera.getRight();
  const up = camera.getUp();

  // 构建相机参数
  const camParams = buildCameraParams(
    camPos,
    forward,
    right,
    up,
    config.fov,
    props.width / props.height,
    config.far  // 视距限制
  );

  // 使用优化的渲染器渲染
  renderer.render(camParams, props.width, props.height);
  const imageData = renderer.getImageData();

  // 将渲染结果写入画布
  ctx.putImageData(imageData, 0, 0);
}

function updateRender() {
  requestAnimationFrame(render);
}

onMounted(() => {
  groundImage.onload = () => {
    render();
  };

  unsubscribe = cameraManager.subscribe(() => {
    updateRender();
  });

  if (groundImage.complete) {
    render();
  }
});

onUnmounted(() => {
  unsubscribe?.();
});

watch(() => [props.width, props.height], () => {
  render();
});
</script>

<style scoped>
.viewport-canvas {
  display: inline-block;
  border: 2px solid #444;
  background: #000;
  position: relative;
}

canvas {
  display: block;
}

.info {
  position: absolute;
  top: 4px;
  left: 4px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 2px;
}
</style>
