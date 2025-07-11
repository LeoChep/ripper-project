<template>

    <div class="game-pannel" id="game-pannel"></div>
    <!-- <img :src="hitURL"> -->
    <CreatureInfo :creature="selectedCreature" v-if="selectedCreature" @close="selectedCreature = null" />
</template>

<script setup>
import CreatureInfo from '../CreatureInfo.vue'
import { ref, onMounted } from 'vue'
import { getJsonFile, getUnitFile, getMapAssetFile, getAnimMetaJsonFile, getAnimActionSpriteJsonFile, getAnimSpriteImgUrl } from '@/utils/utils'
import * as InitiativeController from "@/core/system/InitiativeSystem"
import * as PIXI from 'pixi.js'
import { UnitRightEvent } from '@/core/controller/UnitRightEventController'
import { TiledMap } from '@/core/MapClass'
import { UnitAnimSpirite } from '@/core/anim/UnitAnimSpirite'
import { Unit, createUnitsFromMapSprites } from '@/core/Unit'
import { AnimMetaJson } from '@/core/anim/AnimMetaJson'
import { createCreature } from '@/units/Creature'
import { setContainer, setLayer } from '@/stores/container'
import { makeFog } from '@/core/system/FogSystem'
import { makeFogOfWar, caculteFog } from '@/core/system/FogSystem_unuse'
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
    setContainer(container);
    setLayer(rlayers);
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


    //绘制格子
    drawGrid(app, rlayers);

    //增加键盘监听
    addListenKeyboard(container);
    drawFog(mapPassiable, rlayers, container, units[0])
    //测试战斗
    InitiativeController.setMap(mapPassiable);
    const initCombatPromise = InitiativeController.addUnitsToInitiativeSheet(units)

    setTimeout(() => {
        initCombatPromise.then(() => {
            InitiativeController.startCombatTurn()
        });
    }, 2000)


})

const drawFog = (mapPassiable, rlayers, container, unit) => {
    //增加遮罩
    const fogOfWar = new PIXI.Graphics();

    let containerMask = new PIXI.Container();
    container.addChild(fogOfWar);
    container.addChild(containerMask); // 添加遮罩容器
    fogOfWar.eventMode = 'none'; // 令遮罩不影响事件
    rlayers.fogLayer.attach(fogOfWar);
    // fogOfWar.zIndex=-1;
    fogOfWar.rect(0, 0, 1200, 900); // 比屏幕稍大
    fogOfWar.fill({ color: 0x000000, alpha: 0.8 }); // 黑色半透明

    let gcMask;
    const darwFogFunc = () => {
        const timePromise = new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, 500);
        });
        const makeFogOfWarPromise = new Promise((resolve) => {
            const mask = makeFogOfWar(mapPassiable, rlayers, container, unit);
            resolve(mask);
        });
        const maskCaculatePromise = new Promise((resolve) => {
            const mask = caculteFog(mapPassiable, rlayers, container, unit);
            resolve(mask);
        });
        Promise.all([timePromise, makeFogOfWarPromise, maskCaculatePromise]).then((value) => {
            if (gcMask) {
                gcMask.destroy()
            }

            console.log('遮罩计算完成', value)
            containerMask.addChild(value[1]); // 添加第二个遮罩
            gcMask = value[1];
            gcMask.eventMode = 'none'; // 设置遮罩为静态事件模式
            // fogOfWar.setMask({ mask: containerMask, inverse: true });
            fogOfWar.clear(); // 清除之前的绘制
            fogOfWar.rect(-100, -100, 20000, 20000); // 比屏幕稍大
           fogOfWar.fill({ color: 0x000000, alpha: 1 }); // 黑色半透明
            fogOfWar.eventMode = 'none'; // 令遮罩不影响事件
            const visiblePoints = value[2]
            console.log('挖洞可见区域', visiblePoints)
            if (
                visiblePoints &&
                Object.keys(visiblePoints).length > 2 &&
                visiblePoints["0"]
            ) {
                //打孔
                const pointData = []
                console.log('打孔可见区域', visiblePoints)
                // fogOfWar.moveTo(visiblePoints["0"].x, visiblePoints["0"].y);
                // newG.moveTo(200, 111);
                for (const pt of Object.values(visiblePoints)) {

                    if (pt) {

                        // fogOfWar.lineTo(pt.x, pt.y);
                        pointData.push(pt.x, pt.y);
                    }
                }
                // fogOfWar.lineTo(visiblePoints["0"].x, visiblePoints["0"].y);
                // fogOfWar.moveTo(0, 0);
                // for (let i=0;i<=700;i++){
                //     fogOfWar.lineTo(0, i); 
                // }
                // for (let i=0;i<=700;i++){
                //     fogOfWar.lineTo(i, 700); 
                // }
                //    for (let i=0;i<=400;i++){
                //     fogOfWar.lineTo(700, 700-i); 
                // }
         
                console.log('打孔可见区域2', visiblePoints)
                // fogOfWar.fill({ color: 0x000000, alpha: 1 }); // 填充黑色
                // fogOfWar.cut();
                fogOfWar.poly(pointData).cut();
                // fogOfWar.poly(pointData,true).fill({ color: 0x000000, alpha: 1 }); // 填充黑色
                // fogOfWar.circle(
                //    200,
                //   200,
                //     20
                // ).cut(); // 绘制一个圆形区域
                // newG.fill({ color: 0x000000, alpha: 1 });

                console.log('打孔可见区域3', visiblePoints)
            }
            // rlayers.fogLayer.attach(fogOfWar);
            // rlayers.fogLayer.attach(gcMask);
            darwFogFunc()
        });
    }
    darwFogFunc();

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
    app.stage.addChildAt(rlayers.fogLayer, 2);
    app.stage.addChildAt(rlayers.lineLayer, 3);
    app.stage.addChildAt(rlayers.selectLayer, 4);
    app.stage.addChildAt(rlayers.controllerLayer, 5);
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

const loadMap = async (mapName) => {
    const url = getMapAssetFile(mapName)
    const mapTexture = await PIXI.Assets.load(url);
    const mapPassiablePOJO = await getJsonFile('map', mapName, 'tmj')
    const mapPassiable = new TiledMap(mapPassiablePOJO, mapTexture);
    return mapPassiable
}

const drawMap = (mapView, container, rlayers) => {
    container.addChild(mapView);
    rlayers.basicLayer.attach(mapView)
}

const generateAnimSprite = async (unit, container, rlayers, mapPassiable) => {

    const animSpriteUnit = await createAnimSpriteUnits(unit.unitTypeName, unit);
    const unitCreature = await createUnitCreature(unit.unitTypeName, unit);
    // const animSpriteUnit = await createAnimSpriteUnit(unit.unitTypeName);
    unit.animUnit = animSpriteUnit;
    unit.creature = unitCreature;
    //unit.direction = 2;
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
    // console.log('createUnitCreature', unitTypeName, jsonStr)
    // const jsonObj = JSON.parse(jsonStr);
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
    animSpriteUnit.eventMode = 'dynamic';
    animSpriteUnit.on('rightdown', (event) => {
        UnitRightEvent(event, unit, container, rlayers, mapPassiable);
    });
    animSpriteUnit.on('click', (event) => {
        // alert(`Clicked on unit: ${unit.unitTypeName}`);
        if (unit.creature) {
            selectedCreature.value = unit.creature
        }
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