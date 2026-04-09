<template>
  <div class="viewport-container">
    <div class="test-controls">
      <h3>测试矩形（世界坐标）</h3>
      <div class="corner-inputs">
        <div class="corner-row" v-for="(corner, index) in testRect" :key="index">
          <label>{{ ['左上', '右上', '右下', '左下'][index] }}:</label>
          <input type="number" v-model.number="corner.x" placeholder="X" step="10">
          <input type="number" v-model.number="corner.y" placeholder="Y" step="10">
        </div>
      </div>
      <div class="button-row">
        <button @click="drawTestRect = !drawTestRect" :class="{ active: drawTestRect }">
          {{ drawTestRect ? '隐藏' : '显示' }}测试矩形
        </button>
        <button @click="resetTestRect">重置</button>
      </div>
      <WorldPointPanel></WorldPointPanel>
    </div>
    <div class="viewport-canvas">
      <canvas ref="canvasRef" :width="width" :height="height" @click="handleClick"  id="viewport-canvas"></canvas>
      <div class="info">视窗 {{ width }}×{{ height }}</div>
      <div v-if="worldPos" class="world-pos">世界坐标: ({{ worldPos.x.toFixed(1) }}, {{ worldPos.y.toFixed(1) }})</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { cameraManager } from '@/core/service/2dcanvas/cameraTool';
import { TerrainRenderer, buildCameraParams, screenToWorld, worldToScreen, type CameraParams } from '@/core/service/2dcanvas/renderUtils';
import { getMapAssetFile } from '@/utils/utils';
import { useWorldPoints } from '@/core/composables/useWorldPoints';
import WorldPointPanel from './WorldPointPanel.vue';

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
const worldPos = ref<{ x: number; y: number } | null>(null);
const groundImage = new Image();
groundImage.src = getMapAssetFile('road');

// 使用世界点管理
const { allGroups } = useWorldPoints();


// 测试矩形的世界坐标（四个角）
const testRect = ref<{ x: number; y: number }[]>([
  { x: 200, y: 200 },  // 左上
  { x: 400, y: 200 },  // 右上
  { x: 400, y: 400 },  // 右下
  { x: 200, y: 400 },  // 左下
]);

const drawTestRect = ref(false);

// 使用优化的渲染器
const renderer = new TerrainRenderer();
let srcImageData: ImageData | null = null;

let unsubscribe: (() => void) | null = null;

/**
 * 重置测试矩形
 */
function resetTestRect() {
  testRect.value = [
    { x: 200, y: 200 },
    { x: 400, y: 200 },
    { x: 400, y: 400 },
    { x: 200, y: 400 },
  ];
}

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

  // 绘制测试矩形
  if (drawTestRect.value) {
    drawTestRectOnCanvas(ctx, camParams);
  }

  // 绘制外部世界点组
  drawWorldPointGroups(ctx, camParams);
}

/**
 * 在 Canvas 上绘制测试矩形
 */
function drawTestRectOnCanvas(ctx: CanvasRenderingContext2D, camParams: CameraParams) {
  const screenPoints: Array<{ x: number; y: number } | null> = [];

  // 将四个角转换为屏幕坐标
  for (let i = 0; i < testRect.value.length; i++) {
    const worldPos = testRect.value[i];
    const screenPos = worldToScreen(worldPos.x, worldPos.y, props.width, props.height, camParams);
    screenPoints.push(screenPos);
  }

  // 绘制矩形边框
  ctx.strokeStyle = '#ff0';
  ctx.lineWidth = 2;
  ctx.beginPath();

  for (let i = 0; i < screenPoints.length; i++) {
    const p = screenPoints[i];
    const nextIndex = (i + 1) % screenPoints.length;
    const nextP = screenPoints[nextIndex];

    if (p && nextP) {
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(nextP.x, nextP.y);
    }
  }
  ctx.stroke();

  // 绘制角点和标签
  const labels = ['左上', '右上', '右下', '左下'];
  for (let i = 0; i < screenPoints.length; i++) {
    const p = screenPoints[i];
    if (p) {
      // 绘制点
      ctx.fillStyle = 'red';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();

      // 绘制标签
      ctx.fillStyle = '#fff';
      ctx.font = '12px sans-serif';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.strokeText(labels[i], p.x + 8, p.y - 8);
      ctx.fillText(labels[i], p.x + 8, p.y - 8);

      // 绘制坐标文字
      const worldPos = testRect.value[i];
      const coordText = `(${worldPos.x.toFixed(0)}, ${worldPos.y.toFixed(0)})`;
      ctx.strokeText(coordText, p.x + 8, p.y + 8);
      ctx.fillText(coordText, p.x + 8, p.y + 8);
    } else {
      console.log(`[TestRect] 角点 ${labels[i]} 世界坐标 (${testRect.value[i].x}, ${testRect.value[i].y}) 在视锥体外`);
    }
  }
}

/**
 * 绘制世界点组
 */
function drawWorldPointGroups(ctx: CanvasRenderingContext2D, camParams: CameraParams) {
  // 按组绘制点
  for (const group of allGroups.value) {
    if (!group.visible || group.points.length === 0) continue;

    const color = group.color;
    const screenPoints: Array<{ x: number; y: number } | null> = [];

    // 将所有点转换为屏幕坐标
    for (const point of group.points) {
      const screenPos = worldToScreen(point.x, point.y, props.width, props.height, camParams);
      screenPoints.push(screenPos);
      console.log(`[WorldPointGroup] ${group.name} 点 (${point.x}, ${point.y}) -> 屏幕坐标:`, screenPos);
      console.log(`[WorldPointGroup] 当前相机参数:`, camParams);
    }

    // 如果有多个点，绘制连线
    if (screenPoints.length > 1) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      for (let i = 0; i < screenPoints.length; i++) {
        const p = screenPoints[i];
        const nextIndex = (i + 1) % screenPoints.length;
        const nextP = screenPoints[nextIndex];

        if (p && nextP) {
          if (i === 0) {
            ctx.moveTo(p.x, p.y);
          }
          ctx.lineTo(nextP.x, nextP.y);
        }
      }
      ctx.stroke();
    }

    // 绘制每个点
    for (let i = 0; i < screenPoints.length; i++) {
      const p = screenPoints[i];
      const point = group.points[i];

      if (p) {
        // 绘制点
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();

        // 绘制边框
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();

        // 绘制标签和坐标
        const label = point.label || `P${i}`;
        const coordText = `(${point.x.toFixed(0)}, ${point.y.toFixed(0)})`;

        ctx.fillStyle = '#fff';
        ctx.font = '11px sans-serif';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;

        const yOffset = -10;
        ctx.strokeText(label, p.x + 8, p.y + yOffset);
        ctx.fillText(label, p.x + 8, p.y + yOffset);

        ctx.strokeText(coordText, p.x + 8, p.y + yOffset + 14);
        ctx.fillText(coordText, p.x + 8, p.y + yOffset + 14);
      }
    }
  }
}

function updateRender() {
  requestAnimationFrame(render);
}

/**
 * 处理画布点击事件，验证坐标转换
 */
function handleClick(e: MouseEvent) {
  const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // 获取当前相机参数
  const camera = cameraManager.getCamera();
  const config = camera.getConfig();
  const forward = camera.getForward();
  const right = camera.getRight();
  const up = camera.getUp();

  const camParams = buildCameraParams(
    config.position,
    forward,
    right,
    up,
    config.fov,
    props.width / props.height,
    config.far
  );

  // 步骤1: 屏幕坐标 -> 世界坐标
  const worldPosResult = screenToWorld(x, y, props.width, props.height, camParams);

  if (!worldPosResult) {
    worldPos.value = null;
    console.log('❌ 射线未与地面相交');
    return;
  }

  worldPos.value = worldPosResult;

  // 步骤2: 世界坐标 -> 屏幕坐标（反向验证）
  const screenPosResult = worldToScreen(
    worldPosResult.x,
    worldPosResult.y,
    props.width,
    props.height,
    camParams
  );

  // 步骤3: 比较原始屏幕坐标与转换回来的屏幕坐标
  if (screenPosResult) {
    const dx = Math.abs(x - screenPosResult.x);
    const dy = Math.abs(y - screenPosResult.y);
    const isClose = dx < 1 && dy < 1;

    console.log('[CoordValidate] ═══════════════════════════════════════');
    console.log('[CoordValidate] 原始屏幕坐标:', `(${x.toFixed(2)}, ${y.toFixed(2)})`);
    console.log('[CoordValidate] → 世界坐标:  ', `(${worldPosResult.x.toFixed(2)}, ${worldPosResult.y.toFixed(2)})`);
    console.log('[CoordValidate] → 屏幕坐标:  ', `(${screenPosResult.x.toFixed(2)}, ${screenPosResult.y.toFixed(2)})`);
    console.log('[CoordValidate] 误差:', `Δx=${dx.toFixed(4)}, Δy=${dy.toFixed(4)}`);
    console.log('[CoordValidate] 验证:', isClose ? '✅ 通过' : '❌ 失败');
    console.log('[CoordValidate] ═══════════════════════════════════════');
  } else {
    console.log('❌ 反向转换失败：点在视锥体外');
  }
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

// 监听世界点组变化，自动重绘
watch(allGroups, () => {
  render();
}, { deep: true });
</script>

<style scoped>
.viewport-container {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.test-controls {
  background: #222;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 16px;
  min-width: 200px;
}

.test-controls h3 {
  margin: 0 0 12px 0;
  color: #fff;
  font-size: 14px;
  border-bottom: 1px solid #444;
  padding-bottom: 8px;
}

.corner-inputs {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.corner-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.corner-row label {
  color: #aaa;
  font-size: 12px;
  min-width: 36px;
}

.corner-row input {
  width: 60px;
  background: #333;
  border: 1px solid #555;
  color: #fff;
  padding: 4px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.corner-row input:focus {
  outline: none;
  border-color: #0af;
}

.button-row {
  display: flex;
  gap: 8px;
}

.button-row button {
  flex: 1;
  padding: 6px 12px;
  border: 1px solid #555;
  border-radius: 4px;
  background: #333;
  color: #fff;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.button-row button:hover {
  background: #444;
}

.button-row button.active {
  background: #0af;
  border-color: #08f;
}

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

.world-pos {
  position: absolute;
  bottom: 4px;
  left: 4px;
  background: rgba(0, 100, 200, 0.8);
  color: white;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
}
</style>
