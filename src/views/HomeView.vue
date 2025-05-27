<script setup lang="ts">
import UnitBox from '@/components/ThePlayerUnitBox/UnitBox.vue';
import GamePannel from '@/components/GamePannel/GamePannel.vue';

</script>

<template>
  <main @contextmenu.prevent>
    <GamePannel></GamePannel>
    <UnitBox></UnitBox>
  </main>
</template>

<style scoped>

</style>

