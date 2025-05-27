<script setup lang="ts">
import UnitBox from '@/components/ThePlayerUnitBox/UnitBox.vue';


</script>

<template>
  <main @contextmenu.prevent>
    <div class="fullscreen-bg"></div>
    <UnitBox></UnitBox>
  </main>
</template>

<style scoped>
  .fullscreen-bg {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: white
  }
</style>

