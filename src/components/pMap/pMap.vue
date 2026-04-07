<template>
  <div class="app">
    <div class="left-panel">
      <MapThumbnail :img-src="imgSrc" />
      <CameraControl />
    </div>
    <ViewportCanvas :width="1200" :height="900" />
  </div>
</template>

<script setup lang="ts">
import MapThumbnail from './MapThumbnail.vue';
import CameraControl from './CameraControl.vue';
import ViewportCanvas from './ViewportCanvas.vue';

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
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
