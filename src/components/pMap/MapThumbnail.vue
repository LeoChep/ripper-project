<template>
  <div class="map-thumbnail" tabindex="0" @keydown="handleKeydown">
    <img ref="imgRef" :src="getMapAssetFile(props.imgSrc)" alt="地图" @load="onImageLoad" />
    <svg class="overlay" :viewBox="`0 0 ${containerSize} ${containerSize}`">
      <!-- 视锥体地面投影 -->
      <polygon
        v-if="groundProjection"
        :points="projectionPointsString"
        fill="rgba(0, 150, 255, 0.2)"
        stroke="rgba(0, 150, 255, 0.8)"
        stroke-width="1"
      />
    </svg>
    <!-- 相机位置指示器 -->
    <div class="camera" :style="cameraStyle"></div>
    <div class="info">
      相机: {{ config.position.x.toFixed(0) }}, {{ config.position.y.toFixed(0) }}, {{ config.position.z.toFixed(0) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { cameraManager, type Point3, Vec3 } from '@/core/service/2dcanvas/cameraTool';
import { getMapAssetFile } from '@/utils/utils';
interface Props {
  imgSrc?: string;
}

const props = withDefaults(defineProps<Props>(), {
  imgSrc: 'road'
});
const imgRef = ref<HTMLImageElement>();
const imgNaturalWidth = ref(0);
const imgNaturalHeight = ref(0);

const containerSize = 200;
const config = ref(cameraManager.getConfig());
const groundProjection = ref<Point3[] | null>(null);

// WASD 移动速度（世界单位/键）
const moveSpeed = 50;

// object-fit: contain 的缩放比例和偏移
const scale = computed(() => {
  if (!imgNaturalWidth.value || !imgNaturalHeight.value) return 1;
  return Math.min(
    containerSize / imgNaturalWidth.value,
    containerSize / imgNaturalHeight.value
  );
});

const displayedWidth = computed(() => imgNaturalWidth.value * scale.value);
const displayedHeight = computed(() => imgNaturalHeight.value * scale.value);

const offsetX = computed(() => (containerSize - displayedWidth.value) / 2);
const offsetY = computed(() => (containerSize - displayedHeight.value) / 2);


const worldToScreenY = (worldY: number) => {
  return  worldY * scale.value + offsetY.value;
};

// 世界坐标 X 转换为屏幕坐标
const worldToScreenX = (worldX: number) => {
  return worldX * scale.value + offsetX.value;
};

// 相机在缩略图中的位置
const cameraStyle = computed(() => {
  const camX = worldToScreenX(config.value.position.x);
  const camY = worldToScreenY(config.value.position.y);
  return {
    left: `${camX}px`,
    top: `${camY}px`,
  };
});

// 投影点转换为 SVG 坐标
const projectionPointsString = computed(() => {
  if (!groundProjection.value) return '';
  return groundProjection.value
    .map(p => {
      const sx = worldToScreenX(p.x);
  const camY = worldToScreenY(config.value.position.y);


      const sy =camY+(camY-worldToScreenY(p.y));
        console.log('Camera Y (screen):', camY, 'Point Y (screen):',sy,`${sx.toFixed(1)},${sy.toFixed(1)}`);
      return `${sx.toFixed(1)},${sy.toFixed(1)}`;
    })
    .join(' ');
});

function handleKeydown(e: KeyboardEvent) {
  const key = e.key.toLowerCase();
  if (key !== 'w' && key !== 'a' && key !== 's' && key !== 'd') return;

  e.preventDefault();

  // 获取相机的朝向向量
  const camera = cameraManager.getCamera();
  const forward = camera.getForward();
  const right = camera.getRight();

  // 只在水平面（XY平面）上移动
  const forwardFlat = Vec3.create(forward.x, forward.y, 0).normalize();
  const rightFlat = Vec3.create(right.x, right.y, 0).normalize();
console.log('Forward:', forward, 'Right:', right, 'ForwardFlat:', forwardFlat, 'RightFlat:', rightFlat);
  const currentPos = camera.getPosition();
  let newPos = { ...currentPos };
  
  // switch (key) {
  //   case 'w':  // 前进
  //     //newPos.x +=  moveSpeed;
  //     newPos.y -=  moveSpeed;
  //     break;
  //   case 's':  // 后退
   
  //     newPos.y +=  moveSpeed;
  //     break;
  //   case 'a':  // 左移
  //     newPos.x -=  moveSpeed;

  //     break;
  //   case 'd':  // 右移
  //     newPos.x +=  moveSpeed;
     
  //     break;
  // }

  cameraManager.setConfig({ position: newPos });
}

function onImageLoad() {
  if (imgRef.value) {
    imgNaturalWidth.value = imgRef.value.naturalWidth;
    imgNaturalHeight.value = imgRef.value.naturalHeight;
  }
  updateProjection();
}

function updateProjection() {
  groundProjection.value = cameraManager.getCamera().getGroundProjection(0);
}

let unsubscribe: (() => void) | null = null;

onMounted(() => {
  config.value = cameraManager.getConfig();
  updateProjection();

  unsubscribe = cameraManager.subscribe(() => {
    config.value = cameraManager.getConfig();
    updateProjection();
  });
});

onUnmounted(() => {
  unsubscribe?.();
});
</script>

<style scoped>
.map-thumbnail {
  width: 200px;
  height: 200px;
  border: 2px solid #ccc;
  overflow: hidden;
  position: relative;
  outline: none;
}

.map-thumbnail:focus {
  border-color: #999;
}

.map-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.camera {
  position: absolute;
  width: 10px;
  height: 10px;
  background: red;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
  z-index: 1;
}

.info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 9px;
  padding: 2px 4px;
  z-index: 2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
