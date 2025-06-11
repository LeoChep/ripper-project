<template>
    <div class="game-pannel" id="game-pannel">

    </div>
</template>

<script setup>
import testImg from '@/assets/wolf/walk.png'
import wolfJson from "@/assets/wolf/wolf_walk.json"
import * as PIXI from 'pixi.js'
import { onMounted } from 'vue'
onMounted(async () => {
    const app = new PIXI.Application();
    await app.init({
        width: 800,
        height: 600,
        antialias: true,
        background: 0x262626, // 设置canvas背景颜色
        backgroundAlpha: 1,   // 设置背景颜色透明度
        resolution: 1,
        // transparent: false, // backgroundAlpha 已控制透明度
    });

    document.getElementById("game-pannel").appendChild(app.canvas);

    // TODO 路径暂时写死
    const sheetTexture = await PIXI.Assets.load(testImg);


    console.log(wolfJson)
    const spritesheet = new PIXI.Spritesheet(
       sheetTexture,
        wolfJson
    );
    await spritesheet.parse();
    console.log(spritesheet);
    // spritesheet is ready to use!
    const anim = new PIXI.AnimatedSprite(spritesheet.animations.walk_w);
    anim.animationSpeed = 0.1666;
    anim.textures = spritesheet.animations.walk_w
    // play the animation on a loop
    anim.play();
    // let bear = new PIXI.AnimatedSprite(sheet.animations['walk_1']);
    // bear.x = 400;
    // bear.y = 300;
    app.stage.addChild(anim);
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