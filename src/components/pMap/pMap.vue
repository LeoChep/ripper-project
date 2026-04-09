<template>
  <div class="app">
    <div class="left-panel">
      <MapThumbnail :img-src="imgSrc" />
      <CameraControl />
    </div>
    <ViewportCanvas :width="width" :height="height" />
  </div>
</template>

<script setup lang="ts">
import MapThumbnail from './MapThumbnail.vue';
import CameraControl from './CameraControl.vue';
import ViewportCanvas from './ViewportCanvas.vue';
import { appSetting } from '@/core/envSetting';

const width=appSetting.width;
const height=appSetting.height;
interface Props {
  imgSrc?: string;
}

withDefaults(defineProps<Props>(), {
  imgSrc: 'road'
});
</script>

<style scoped>
.app {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  position: absolute;
  top: 1800px;
}

.left-panel {

  position:fixed;
  left: 0px;
  top: 0px;
  z-index: 999;

  gap: 16px;
}
</style>
