<template>
    <div class="game-pannel" id="game-pannel">

    </div>
</template>

<script setup>
import testImg from '@/assets/logo.svg'
import * as PIXI from 'pixi.js'
import { onMounted } from 'vue'
onMounted(async () => {
    const app = new PIXI.Application();
    await app.init({
        width: 800,
        height: 600,
        antialias: true,
        background: 0x262626, // 设置canvas背景颜色
        backgroundAlpha: 0,   // 设置背景颜色透明度
        resolution: 1,
        // transparent: false, // backgroundAlpha 已控制透明度
    });

    document.getElementById("game-pannel").appendChild(app.canvas);

    // TODO 路径暂时写死
    await PIXI.Assets.load(testImg);
    let bear = PIXI.Sprite.from(testImg);
    bear.x = 400;
    bear.y = 300;
    app.stage.addChild(bear);
    app.stage.interactive = true;
})


</script>

<style scoped>
.game-pannel {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: white
}
</style>