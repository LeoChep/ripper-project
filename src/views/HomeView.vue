<script setup lang="ts">
import UnitBox from "@/components/ThePlayerUnitBox/UnitBox.vue";
import GamePannel from "@/components/GamePannel/GamePannel.vue";
import ActionPannel from "@/components/ActionPannel/ActionPannel.vue";
import { useInitiativeStore } from "@/stores/initiativeStore";
const initiative = useInitiativeStore();
initiative.initializeInitiative();
</script>

<template>
  <main @contextmenu.prevent>
    <GamePannel></GamePannel>
    <!-- <div class="action-panel-container">
      <ActionPannel></ActionPannel>
    </div> -->
    <!-- <UnitBox></UnitBox> -->
  </main>
</template>

<style scoped>
.action-panel-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}
</style>
