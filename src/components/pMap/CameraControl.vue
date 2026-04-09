<template>
  <div class="camera-control">
    <h3>相机属性</h3>

    <div class="section">
      <div class="section-title">位置 Position</div>
      <div class="input-group">
        <label>X:</label>
        <input type="number" v-model.number="position.x" @input="updatePosition" step="10" />
      </div>
      <div class="input-group">
        <label>Y:</label>
        <input type="number" v-model.number="position.y" @input="updatePosition" step="10" />
      </div>
      <div class="input-group">
        <label>Z:</label>
        <input type="number" v-model.number="position.z" @input="updatePosition" step="10" />
      </div>
    </div>

    <div class="section">
      <div class="section-title">旋转 Rotation</div>
      <div class="input-group">
        <label>Pitch:</label>
        <input type="number" v-model.number="pitch" @input="updateRotation" step="5" />
        <span class="unit">°</span>
      </div>
      <div class="input-group">
        <label>Yaw:</label>
        <input type="number" v-model.number="yaw" @input="updateRotation" step="5" />
        <span class="unit">°</span>
      </div>
    </div>

    <div class="section">
      <div class="section-title">视野 FOV</div>
      <div class="input-group">
        <label>FOV:</label>
        <input type="number" v-model.number="fov" @input="updateFOV" step="5" min="1" max="179" />
        <span class="unit">°</span>
      </div>
    </div>

    <div class="section">
      <div class="section-title">裁剪面 Clipping</div>
      <div class="input-group">
        <label>Near:</label>
        <input type="number" v-model.number="near" @input="updateClipping" step="1" min="0.1" />
      </div>
      <div class="input-group">
        <label>Far:</label>
        <input type="number" v-model.number="far" @input="updateClipping" step="10" min="1" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { cameraManager } from '@/core/service/2dcanvas/cameraTool';

const position = ref({ x: 0, y: 0, z: 200 });
const pitch = ref(30);
const yaw = ref(0);
const fov = ref(60);
const near = ref(1);
const far = ref(1000);

function updatePosition() {
  cameraManager.setConfig({ position: { ...position.value } });
}

function updateRotation() {
  cameraManager.setConfig({ pitch: pitch.value, yaw: yaw.value });
}

function updateFOV() {
  cameraManager.setConfig({ fov: fov.value });
}

function updateClipping() {
  cameraManager.setConfig({ near: near.value, far: far.value });
}

let unsubscribe: (() => void) | null = null;

onMounted(() => {
  const config = cameraManager.getConfig();
  position.value = { ...config.position };
  pitch.value = config.pitch;
  yaw.value = config.yaw;
  fov.value = config.fov;
  near.value = config.near;
  far.value = config.far;

  unsubscribe = cameraManager.subscribe(() => {
    const config = cameraManager.getConfig();
    position.value = { ...config.position };
    pitch.value = config.pitch;
    yaw.value = config.yaw;
    fov.value = config.fov;
    near.value = config.near;
    far.value = config.far;
  });
});

onUnmounted(() => {
  unsubscribe?.();
});
</script>

<style scoped>
.camera-control {
  padding: 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  display: inline-block;
  min-width: 200px;
}

h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
}

.section {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.section-title {
  font-size: 11px;
  color: #666;
  margin-bottom: 6px;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

label {
  width: 50px;
  font-size: 11px;
  font-weight: 500;
}

input {
  flex: 1;
  padding: 4px 6px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 12px;
}

.unit {
  font-size: 11px;
  color: #888;
  width: 16px;
}
</style>
