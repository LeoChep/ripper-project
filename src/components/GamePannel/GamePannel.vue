<template>

    <div class="game-pannel" id="game-pannel"></div>
    <!-- <img :src="hitURL"> -->
    <CreatureInfo :creature="selectedCreature" v-if="selectedCreature" @close="selectedCreature = null" />
    <TalkPannel />
    <CharacterPannel />
</template>

<script setup>

import CreatureInfo from '../CreatureInfo.vue'
import TalkPannel from '../TalkPannel/TalkPannel.vue'
import { ref, onMounted } from 'vue'
import { getJsonFile, getMapAssetFile, getAnimMetaJsonFile, getAnimActionSpriteJsonFile, getAnimSpriteImgUrl, getDoorSvg } from '@/utils/utils'
import * as InitiativeController from "@/core/system/InitiativeSystem"
import * as PIXI from 'pixi.js'
import { UnitRightEvent } from '@/core/controller/UnitRightEventController'
import { TiledMap } from '@/core/MapClass'
import { UnitAnimSpirite } from '@/core/anim/UnitAnimSprite'
import { createUnitsFromMapSprites } from '@/core/units/Unit'
import { AnimMetaJson } from '@/core/anim/AnimMetaJson'
import { createCreature } from '@/core/units/Creature'
import { setContainer, setLayer } from '@/stores/container'
import { makeFog } from '@/core/system/FogSystem'
import { FogSystem } from '@/core/system/FogSystem_unuse'
import { d1 } from '@/drama/d1'
import CharacterPannel from '../CharacterPannel/CharacterPannel.vue'
import { useCharacterStore } from '@/stores/characterStore'
import { CharacterOutCombatController } from '@/core/controller/CharacterOutCombatController'
import { createDoorFromDoorObj } from '@/core/units/Door'
import { createDoorAnimSpriteFromDoor } from '@/core/anim/DoorAnimSprite'
import * as envSetting  from '@/core/envSetting'
import { golbalSetting } from '@/core/golbalSetting'
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

    //加载地图
    const mapPassiable = await loadMap('A')

    //初始化容器
    const rlayers = createRenderLayers(app)
    const container = createContainer(app, rlayers)
    container.sortableChildren = true;
    setContainer(container);
    setLayer(rlayers);
    //绘制迷雾
    drawFog(mapPassiable, rlayers, container,app)
    //绘制地图
    const mapView = mapPassiable.textures;
    drawMap(mapView, container, rlayers);

    //创建单位
    const spritesOBJ = mapPassiable.sprites
    const units = createUnitsFromMapSprites(spritesOBJ, mapPassiable);
    console.log(units)
    let createEndPromise = []
    units.forEach((unit) => {
        const promise = generateAnimSprite(unit, container, rlayers, mapPassiable)
        createEndPromise.push(promise)
    });
    if (createEndPromise.length > 0)
        await Promise.all(createEndPromise);
    mapPassiable.sprites = units;

    //创建门
    const doors = mapPassiable.doors;
    doors.forEach(async (obj) => {
        const door=createDoorFromDoorObj(obj);
        const doorSprite = await createDoorAnimSpriteFromDoor(door)
        container.addChild(doorSprite);
        rlayers.controllerLayer.attach(doorSprite);
    }) 


    //绘制格子
    drawGrid(app, rlayers);

    //增加键盘监听
    addListenKeyboard(container);

    //测试战斗
    // InitiativeController.setMap(mapPassiable);
    // const initCombatPromise = InitiativeController.addUnitsToInitiativeSheet(units)

    // setTimeout(() => {
    //     initCombatPromise.then(() => {
    //         InitiativeController.startCombatTurn()
    //     });
    // }, 2000)

    //测试剧本

    //初始化玩家角色
    const characterStore = useCharacterStore();
    units.forEach((unit) => {
        if (unit.party === 'player') {
            characterStore.addCharacter(unit);
            unit.stateMachinePack.startPlay();
        }
    });
    const characterOutCombatController = new CharacterOutCombatController(rlayers, container, mapPassiable)
    characterStore.setCharacterOutCombatController(characterOutCombatController);
    CharacterOutCombatController.instance = characterOutCombatController;
    d1.map = mapPassiable;
    // d1.start();
    console.log('app',app.stage)


})

const drawFog = (mapPassiable, rlayers, container,app) => {
    //增加遮罩
    console.log('drawFog', app)
    const fogSystem = FogSystem.initFog(mapPassiable, container,app);
    fogSystem.autoDraw();
}

const selectedCreature = ref(null) // 新增

const createRenderLayers = (app) => {
    const rlayers = {}
    rlayers.basicLayer = new PIXI.RenderLayer()
    rlayers.spriteLayer = new PIXI.RenderLayer();
    rlayers.lineLayer = new PIXI.RenderLayer();
    rlayers.fogLayer = new PIXI.RenderLayer();
    rlayers.selectLayer = new PIXI.RenderLayer();
    rlayers.controllerLayer = new PIXI.RenderLayer();
    app.stage.addChildAt(rlayers.basicLayer, 0);
    app.stage.addChildAt(rlayers.spriteLayer, 1);
    app.stage.addChildAt(rlayers.selectLayer, 2);
    app.stage.addChildAt(rlayers.lineLayer, 3);
    app.stage.addChildAt(rlayers.fogLayer, 4);
    app.stage.addChildAt(rlayers.controllerLayer, 5);
    rlayers.basicLayer.label = 'basicLayer';
    rlayers.spriteLayer.label = 'spriteLayer';
    rlayers.selectLayer.label = 'selectLayer';
    rlayers.lineLayer.label = 'lineLayer';
    rlayers.fogLayer.label = 'fogLayer';
    rlayers.controllerLayer.label = 'controllerLayer';
        

    return rlayers
}

const createContainer = (app, rlayers) => {
    app.stage.interactive = true;
    const container = new PIXI.Container();
    // 创建一个 800x600 的矩形图形作为底盘
    const rect = new PIXI.Graphics();
    rect.rect(0, 0, 20000, 20000);
    rect.fill({ color: 'black' }); // 黑色填充
    container.addChild(rect);
    container.eventMode = 'static';
    rlayers.basicLayer.attach(container);
    app.stage.addChild(container);
    const spriteContainer = new PIXI.Container();
    const mapContainer = new PIXI.Container();
    spriteContainer.label = 'spriteContainer';
    mapContainer.label = 'mapContainer';
    container.addChild(spriteContainer);
    container.addChild(mapContainer);
    spriteContainer.zIndex = envSetting.zIndexSetting.spriteZIndex;
    mapContainer.zIndex = envSetting.zIndexSetting.mapZindex;
    // spriteContainer.eventMode = 'none';
    // mapContainer.eventMode = 'none';  
    // 设置全局变量
    golbalSetting.spriteContainer = spriteContainer;
    golbalSetting.mapContainer = mapContainer;
    return container
}

const loadMap = async (mapName) => {
    const url = getMapAssetFile(mapName)
    const mapTexture = await PIXI.Assets.load(url);
    const mapPassiablePOJO = await getJsonFile('map', mapName, 'tmj')
    const mapPassiable = new TiledMap(mapPassiablePOJO, mapTexture);
    return mapPassiable
}

const drawMap = (mapView, container, rlayers) => {
    const ms = new PIXI.Sprite(mapView)
    ms.zIndex = envSetting.zIndexSetting.mapZindex;
    ms.label = 'map'
    golbalSetting.mapContainer.addChild(ms);
    rlayers.basicLayer.attach(ms)
}

const generateAnimSprite = async (unit, container, rlayers, mapPassiable) => {

    const animSpriteUnit = await createAnimSpriteUnits(unit.unitTypeName, unit);
    const unitCreature = await createUnitCreature(unit.unitTypeName, unit);

    unit.animUnit = animSpriteUnit;
    animSpriteUnit.zIndex=envSetting.zIndexSetting.spriteZIndex;
    unit.creature = unitCreature;
    console.log('generateAnimSprite', unit, animSpriteUnit)
    addAnimSpriteUnit(unit, container, rlayers, mapPassiable);
    animSpriteUnit.x = Math.round(unit.x / 64) * 64;
    animSpriteUnit.y = Math.round(unit.y / 64) * 64 - 64;
    unit.x = animSpriteUnit.x;
    unit.y = animSpriteUnit.y;
    return unit
}

const createUnitCreature = async (unitTypeName, unit) => {
    const json = await getJsonFile(unitTypeName, unitTypeName, 'json');
    if (!json) {
        console.error(`Creature JSON file for ${unitTypeName} not found.`);
        return null;
    }

    const creature = createCreature(json);
    return creature;
}
const createAnimSpriteUnits = async (unitTypeName, unit) => {
    // 这里可以根据 unitTypeName 创建不同的动画精灵
    // 例如，如果 unitTypeName 是 'wolf'，则加载对应的动画精    
    //读取animation meta json
    const testJsonFetchPromise = getAnimMetaJsonFile(unitTypeName)
    const animMetaJson = new AnimMetaJson(await testJsonFetchPromise);
    //遍历获取所有动画组
    const animSpriteUnit = new UnitAnimSpirite(unit)
    animMetaJson.getAllExportedAnimations().forEach(async (anim) => {
        console.log(anim)
        const spriteUrl = getAnimSpriteImgUrl(unitTypeName, anim, 'standard');
        const sheetTexture = await PIXI.Assets.load(spriteUrl);
        console.log(anim)
        const jsonFetchPromise = getAnimActionSpriteJsonFile(unitTypeName, anim, 'standard');
        const json = await jsonFetchPromise;
        if (json && json.frames) {
            const spritesheet = new PIXI.Spritesheet(
                sheetTexture,
                json
            );
            await spritesheet.parse();
            animSpriteUnit.addAnimationSheet(anim, spritesheet);
        }

    })
    // spritesheet is ready to use!
    return animSpriteUnit;
}


const addAnimSpriteUnit = (unit, container, rlayers, mapPassiable) => {
    const animSpriteUnit = unit.animUnit;
    console.log('addAnimSpriteUnit', unit)
    rlayers.spriteLayer.attach(animSpriteUnit);
    // animSpriteUnit.zIndex=20;
    animSpriteUnit.eventMode = 'static';
    animSpriteUnit.on('rightdown', (event) => {
        console.log('rightdown', unit)
        UnitRightEvent(event, unit, container, rlayers, mapPassiable);
    });
    animSpriteUnit.on('click', (event) => {
        // alert(`Clicked on unit: ${unit.unitTypeName}`);
        if (unit.creature) {
            selectedCreature.value = unit.creature
        }
    });
    golbalSetting.spriteContainer.addChild(animSpriteUnit);
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
        line.stroke({ width: 1, color: 0x000000, alpha: 1 });
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
    width: 800px;
    height: 600px;
    background: white
}
</style>