<template>
    <div class="game-pannel" id="game-pannel">

    </div>
</template>

<script setup>
import { getJsonFile, getUnitFile,getMapAssetFile } from '@/utils/utils'

import * as PIXI from 'pixi.js'
import { UnitRightEvent } from '@/core/UnitRightEvent'
import { onMounted } from 'vue'
import { TiledMap } from '@/core/MapClass'
import { SpriteUnit } from '@/core/SpriteUnit'
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
    //加载地图内容

    const mapPassiable = await loadMap('A')

    //初始化容器
    const rlayers = createRenderLayers(app)
    const container = createContainer(app, rlayers)

    //绘制地图
    const mapView = mapPassiable.textures;
    drawMap(mapView, container, rlayers);

    //创建test单位

    const animSpriteUnit = await createSpriteUnit('wolf')
    addAnimSpriteUnit(animSpriteUnit, container, rlayers, mapPassiable)

    //绘制格子
    drawGrid(app, rlayers);
    //增加键盘监听
    addListenKeyboard(container);

})

const createRenderLayers = (app) => {
    const rlayers = {}
    rlayers.basicLayer = new PIXI.RenderLayer()
    rlayers.spriteLayer = new PIXI.RenderLayer();
    rlayers.lineLayer = new PIXI.RenderLayer();
    rlayers.selectLayer = new PIXI.RenderLayer();
    app.stage.addChildAt(rlayers.basicLayer, 0);
    app.stage.addChildAt(rlayers.spriteLayer, 1);
    app.stage.addChildAt(rlayers.lineLayer, 2);
    app.stage.addChildAt(rlayers.selectLayer, 3);
    return rlayers
}

const createContainer = (app, rlayers) => {
    app.stage.interactive = true;
    const container = new PIXI.Container();
    // 创建一个 800x600 的矩形图形作为底盘
    const rect = new PIXI.Graphics();
    rect.rect(0, 0, 800, 600);
    rect.fill({ color: 'black' }); // 黑色填充
    container.addChild(rect);
    container.eventMode = 'static';
    rlayers.basicLayer.attach(container);
    app.stage.addChild(container);
    return container
}

const loadMap =async (mapName)=>{
    const url = getMapAssetFile(mapName)
    const mapTexture = await PIXI.Assets.load(url);
    const mapPassiablePOJO =await getJsonFile('map',mapName,'tmj')
    const mapPassiable = new TiledMap(mapPassiablePOJO, mapTexture);
    return mapPassiable
}

const drawMap = (mapView, container, rlayers) => {
    container.addChild(mapView);
    rlayers.basicLayer.attach(mapView)
}

const createSpriteUnit = async (unitTypeName) => {
    const walkUrl = getUnitFile(unitTypeName, 'walk');
    const sheetTexture = await PIXI.Assets.load(walkUrl);
    const jsonFetchPromise=getJsonFile(unitTypeName,'walk')
    console.log(await jsonFetchPromise)
    const walkSpritesheet = new PIXI.Spritesheet(
        sheetTexture,
        await jsonFetchPromise
    );
    await walkSpritesheet.parse();
    // spritesheet is ready to use!
    const animSpriteUnit = new SpriteUnit(walkSpritesheet)
    return animSpriteUnit;
}

const addAnimSpriteUnit = (animSpriteUnit, container, rlayers, mapPassiable) => {
    rlayers.spriteLayer.attach(animSpriteUnit);
    animSpriteUnit.eventMode = 'dynamic';
    animSpriteUnit.on('rightdown', (event) => {
        UnitRightEvent(event, animSpriteUnit, container, rlayers.selectLayer, rlayers.lineLayer, mapPassiable);
    });
    container.addChild(animSpriteUnit);
}

const addListenKeyboard = (container) => {
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
};
const drawGrid = (app, rlayers) => {
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
    rlayers.lineLayer.attach(lineContainer);
}
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