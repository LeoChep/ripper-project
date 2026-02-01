<script setup lang="ts">
import GamePannel from "@/components/GamePannel/GamePannel.vue";
import { useInitiativeStore } from "@/stores/initiativeStore";
import { onMounted } from "vue";
import { useRoute } from "vue-router";

const initiative = useInitiativeStore();
initiative.initializeInitiative();

const route = useRoute();

onMounted(() => {
  // 如果是从读取存档进入的，在GamePannel加载完成后会自动读取
  const loadSlot = route.query.loadSlot;
  if (loadSlot) {
    console.log('准备读取存档栏位:', loadSlot);
    // GamePannel组件内部会处理读取存档的逻辑
  }
});
</script>

<template>
  <main @contextmenu.prevent>
    <GamePannel></GamePannel>
  </main>
</template>

<style scoped>
main {
  width: 100%;
  height: 100%;
}
</style>
