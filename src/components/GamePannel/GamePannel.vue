<template>
    <div class="game-pannel" id="game-pannel">

    </div>
</template>

<script setup>
import testImg from '@/assets/wolf/walk.png'
import mapImg from '@/assets/map/desert.png'
import wolfJson from "@/assets/wolf/wolf_walk.json"
import * as PIXI from 'pixi.js'
import { UnitRightEvent } from '@/core/UnitRightEvent'
import { onMounted } from 'vue'
const appSetting = {
    width: 800,
    height: 600,
    antialias: true,
    background: 0x262626, // 设置canvas背景颜色
    backgroundAlpha: 1,   // 设置背景颜色透明度
    resolution: 1,
    // transparent: false, // backgroundAlpha 已控制透明度
};
onMounted(async () => {
    const app = new PIXI.Application();
    await app.init({
        width: appSetting.width,
        height: appSetting.height,
        antialias: true,
        background: 0x262626, // 设置canvas背景颜色
        backgroundAlpha: 1,   // 设置背景颜色透明度
        resolution: 1,
        // transparent: false, // backgroundAlpha 已控制透明度
    });

    document.getElementById("game-pannel").appendChild(app.canvas);

    // TODO 路径暂时写死
    const mapTexture = await PIXI.Assets.load(mapImg);
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

    const basicLayer = new PIXI.RenderLayer()
    const spriteLayer = new PIXI.RenderLayer();
    const lineLayer = new PIXI.RenderLayer();
    const selectLayer = new PIXI.RenderLayer();
    app.stage.addChildAt(basicLayer, 0);
    app.stage.addChildAt(spriteLayer, 1);
    app.stage.addChildAt(lineLayer, 2);
    app.stage.addChildAt(selectLayer, 3);
    app.stage.interactive = true;
    const container = new PIXI.Container();
    // 创建一个 800x600 的矩形图形作为底盘
    const rect = new PIXI.Graphics();
    rect.rect(0, 0, 800, 600);
    rect.fill({ color: 'black' }); // 黑色填充
    container.addChild(rect);
    const map = new PIXI.Sprite(mapTexture);
    map.scale = 2;
    container.addChild(map);
    container.eventMode = 'static';
    basicLayer.attach(container);
    app.stage.addChild(container);
    //监听键盘S键
    document.addEventListener('keydown', (event) => {
        if (event.key === 's') {
            container.y -= 64
        }
    });
    //监听键盘A键
    document.addEventListener('keydown', (event) => {
        if (event.key === 'a') {
            container.x += 64
        }
    });
    //监听键盘D键
    document.addEventListener('keydown', (event) => {
        if (event.key === 'd') {
            container.x -= 64
        }
    });
    //监听键盘W键
    document.addEventListener('keydown', (event) => {
        if (event.key === 'w') {
            container.y += 64
        }
    });
    spriteLayer.attach(anim);

    container.addChild(anim);

    //格子
    const lineContainer = new PIXI.Container();
    const gridSize = 64;
    const cols = Math.floor(appSetting.width / gridSize);
    const rows = Math.floor(appSetting.height / gridSize);
    // 画竖线
    for (let i = 1; i < cols; i++) {
        const line = new PIXI.Graphics();
        line.moveTo(i * gridSize, 0);
        line.lineTo(i * gridSize, appSetting.height);
        line.stroke({ width: 1, color: 0x444444, alpha: 0.5 });
        lineContainer.addChild(line);
    }

    // 画横线

    for (let j = 1; j < rows; j++) {
        const line = new PIXI.Graphics();
        line.moveTo(0, j * gridSize);
        line.lineTo(appSetting.width, j * gridSize);
        line.stroke({ width: 1, color: 0x444444, alpha: 0.5 });
        lineContainer.addChild(line);
    }
    app.stage.addChild(lineContainer);
    lineLayer.attach(lineContainer);
    anim.eventMode = 'dynamic';
    anim.on('rightdown', (event) => {
        UnitRightEvent(event, anim, container, selectLayer);
    });

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