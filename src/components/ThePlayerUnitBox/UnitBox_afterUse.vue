<template>
    <div class="bottom-box">
      <div class="unit-box" id="unit-box">
        </div>
 
    </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { usePlayerUnitStore } from '@/stores/playerUnit'
import * as PIXI from 'pixi.js'
import { onMounted } from 'vue'

const playerUnitStore = usePlayerUnitStore()
const { units } = storeToRefs(playerUnitStore)
// 调用 setTestUnits 方法
playerUnitStore.setTestUnits()
console.log(units.value)
//
onMounted(async () => {
    const app = new PIXI.Application();
    await app.init({
        width: 800,
        height: 300,
        antialias: true,
        background: 0x262626, // 设置canvas背景颜色
        backgroundAlpha: 1,   // 设置背景颜色透明度
        resolution: 0,
        // transparent: false, // backgroundAlpha 已控制透明度
    });

    document.getElementById("unit-box").appendChild(app.canvas);
    // TODO 路径暂时写死
 
    app.stage.interactive = true;
})



</script>

<style scoped>
.bottom-box {
  display: flex;

  align-items: center;
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100px;
  background: linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%);
  box-shadow: 0 -2px 8px rgba(0,0,0,0.15);
  outline: 4px solid #6b4f1d;
  outline-offset: -4px;
  border-radius: 16px 16px 0 0;
  box-sizing: border-box;
  font-family: 'Press Start 2P', 'Courier New', Courier, monospace;
  color: #3a2e0e;
  letter-spacing: 1px;
  text-shadow: 1px 1px 0 #fff, 2px 2px 0 #6b4f1d;
}

.bottom-box > * {
  width: 90px;
  height: 90px;
  flex: 0 0 90px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>