<template>
    <div class="game-pannel" id="game-pannel"></div>
    <!-- <img :src="hitURL"> -->
    <CreatureInfo :creature="selectedCreature" :unit="selectedUnit" v-if="selectedCreature"
        @close="selectedCreature = null" />
    <TalkPannel />
    <CharacterPannel />
    <MessageTipTool />

    <!-- 保存和读取按钮 -->
    <div class="game-controls">
        <button class="save-button" @click="saveGameState">保存游戏</button>
        <button class="load-button" @click="loadGameState">读取游戏</button>
    </div>
</template>

<script setup>
import MessageTipTool from '@/components/MessageTipTool/MessageTipTool.vue'
import CreatureInfo from '../CreatureInfo.vue'
import TalkPannel from '../TalkPannel/TalkPannel.vue'
import { ref, onMounted } from 'vue'
import {
    getJsonFile, getMapAssetFile, getAnimMetaJsonFile,
    getAnimActionSpriteJsonFile, getAnimSpriteImgUrl,
} from '@/utils/utils'
import * as PIXI from 'pixi.js'
import { UnitRightEvent } from '@/core/controller/UnitRightEventController'
import { TiledMap } from '@/core/MapClass'
import { UnitAnimSpirite } from '@/core/anim/UnitAnimSprite'
import { createUnitsFromMapSprites, loadPowers, loadTraits, Unit } from '@/core/units/Unit'
import { AnimMetaJson } from '@/core/anim/AnimMetaJson'
import { createCreature } from '@/core/units/Creature'
import { setContainer, setLayer } from '@/stores/container'
import { FogSystem } from '@/core/system/FogSystem_unuse'
import { d1 } from '@/drama/d1'
import CharacterPannel from '../CharacterPannel/CharacterPannel.vue'
import { useCharacterStore } from '@/stores/characterStore'
import { CharacterOutCombatController } from '@/core/controller/CharacterOutCombatController'
import { createDoorFromDoorObj } from '@/core/units/Door'
import { createDoorAnimSpriteFromDoor } from '@/core/anim/DoorAnimSprite'
import * as envSetting from '@/core/envSetting'
import { golbalSetting } from '@/core/golbalSetting'
import { CreatureSerializer } from '@/core/units/CreatureSerializer'
import { DramaSystem } from '@/core/system/DramaSystem'

const appSetting = envSetting.appSetting;
onMounted(async () => {
    const app = new PIXI.Application();
    await app.init(appSetting);

    document.getElementById("game-pannel").appendChild(app.canvas);

    golbalSetting.app = app;

    //初始化容器
    const rlayers = createRenderLayers(app)
    const container = createContainer(app, rlayers)
    container.sortableChildren = true;
    setContainer(container);
    setLayer(rlayers);
    //绘制迷雾
    // drawFog(mapPassiable, rlayers, container, app)
    //绘制地图
    //加载地图
    const mapPassiable = await loadMap('A')
    golbalSetting.map = mapPassiable;

    const spritesOBJ = mapPassiable.sprites
    console.log('加载的地图数据:', mapPassiable);
    const units = createUnitsFromMapSprites(spritesOBJ, mapPassiable);
    const createCreatureEndPromise = []
    units.forEach((unit) => {
        unit.y -= 64;
        const creatCreature = new Promise(async (resolve, reject) => {
            const unitCreature = await createUnitCreature(unit.unitTypeName, unit);
            unit.creature = unitCreature;
            resolve()
        });
        createCreatureEndPromise.push(creatCreature);
    });
    await Promise.all(createCreatureEndPromise);
    mapPassiable.sprites = units;
    console.log('加载的地图数据:', mapPassiable);
    initByMap(mapPassiable);
    console.log('加载的地图数据2:', mapPassiable);


    //绘制格子
    drawGrid(app, rlayers);

    //增加键盘监听
    addListenKeyboard();


    //测试剧本

    //初始化玩家角色

    //console.log('角色数据:', characterStore.characters);
    const characterOutCombatController = new CharacterOutCombatController(rlayers, container, mapPassiable)



    setInterval(() => {
        const units = golbalSetting.map.sprites;
        units.forEach((unit) => {
            unit.stateMachinePack.doAction();
        })
    }, 1000 / 30); // 每秒60帧

    d1.map = mapPassiable;

    DramaSystem.getInstance().setDramaUse('d1');
    DramaSystem.getInstance().play();


})
const initByMap = async (mapPassiable) => {
    //创建单位
    golbalSetting.map = mapPassiable;
    const container = golbalSetting.rootContainer;

    const rlayers = golbalSetting.rlayers;
    const units = mapPassiable.sprites
    const mapView = mapPassiable.textures;
    drawMap(mapView, container, rlayers);
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
        const door = createDoorFromDoorObj(obj);
        const doorSprite = await createDoorAnimSpriteFromDoor(door)
        container.addChild(doorSprite);
        rlayers.controllerLayer.attach(doorSprite);
    })
    const characterStore = useCharacterStore();
    units.forEach((unit) => {
        if (unit.party === 'player') {
            characterStore.addCharacter(unit);
        }
    });

}
const drawFog = (mapPassiable, rlayers, container, app) => {
    //增加遮罩
    console.log('drawFog', app)
    const fogSystem = FogSystem.initFog(mapPassiable, container, app);
    fogSystem.autoDraw();
}

const selectedCreature = ref(null)
const selectedUnit = ref(null)

// 添加保存游戏状态的方法
const saveGameState = () => {
    try {
        console.log('保存游戏状态', golbalSetting.map);
        const map = golbalSetting.map;
        const doors = map.doors;
        const edges = map.edges;
        const sprites = map.sprites.map(sprite => {
            return {
                id: sprite.id,
                x: sprite.x,
                y: sprite.y,
                width: sprite.width,
                height: sprite.height,
                name: sprite.name,
                unitTypeName: sprite.unitTypeName,
                party: sprite.party,
                creature: CreatureSerializer.serializeCreature(sprite.creature)
            };
        });
        const dramaRecord = DramaSystem.getInstance().getRercords();
        // 收集需要保存的游戏数据
        const gameState = {

            // 保存完整的地图数据
            doors: doors,
            edges: edges,
            sprites: sprites,
            dramaRecord: dramaRecord,
            timestamp: Date.now() // 保存时间戳
        };

        // 保存到本地存储
        localStorage.setItem('gameState', JSON.stringify(gameState));

        // 下载 GameState 文件
        const dataStr = JSON.stringify(gameState, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = `gameState_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        // 释放 URL 对象
        URL.revokeObjectURL(url);

        // 显示保存成功消息
        console.log('游戏状态已保存', gameState);
        alert('游戏已保存并下载到本地!');

    } catch (error) {
        console.error('保存游戏状态失败:', error);
        alert('保存失败，请重试!');
    }
};

// 添加读取游戏状态的方法
const loadGameState = async () => {
    try {
        const savedState = localStorage.getItem('gameState');

        if (!savedState) {
            alert('没有找到存档文件!');
            return;
        }

        const gameState = JSON.parse(savedState);
        const characterStore = useCharacterStore();

        // 确认是否要读取存档
        const confirmLoad = confirm(`是否要读取存档?\n保存时间: ${new Date(gameState.timestamp).toLocaleString()}`);
        if (!confirmLoad) {
            return;
        }
        //
        DramaSystem.getInstance().stop();

        // 清空当前角色数据
        characterStore.characters = [];
        const rootContainer = golbalSetting.rootContainer;
        const clearContainer = (container) => {
            if (container.children) {
                const children = container.children;
                for (let i = container.children.length - 1; i >= 0; i--) {
                    const child = container.children[i];
                    children.push(child);

                }
                children.forEach((child) => {
                    clearContainer(child);
                });
                container.destroy()
            }
            else {
                // container.parent.removeChild(container);
                container.destroy();
            }
        }
        clearContainer(rootContainer);
        console.log('清空容器完成', rootContainer.parent);
        rootContainer.destroy();
        characterStore.clearCharacters();
        createContainer(golbalSetting.app, golbalSetting.rlayers);
        // 恢复角色数据
        const map = {}
        const url = getMapAssetFile('A')
        const mapTexture = await PIXI.Assets.load(url);
        map.textures = mapTexture;
        map.doors = gameState.doors || [];
        map.edges = gameState.edges || [];

        map.sprites = createUnitsFromMapSprites(gameState.sprites);
        map.sprites.forEach((sprite, index) => {
            const savedSprite = gameState.sprites[index];
            if (savedSprite && savedSprite.creature) {
                sprite.party = savedSprite.party; // 确保有 party 属性
                sprite.unitTypeName = savedSprite.unitTypeName;
                sprite.creature = savedSprite.creature
            }
        });

        await initByMap(map)
        const vars = gameState.dramaRecord.recorders || [];
        DramaSystem.getInstance().records = vars;
        DramaSystem.getInstance().setDramaUse(gameState.dramaRecord.use);
        DramaSystem.getInstance().play();
        new CharacterOutCombatController(golbalSetting.rlayers, golbalSetting.rootContainer, map);

        console.log('恢复的地图数据2:', map);
        console.log('游戏状态已读取', gameState);
        console.log('恢复的角色数据:', characterStore.characters);
        alert('游戏已读取!');

    } catch (error) {
        console.error('读取游戏状态失败:', error);
        alert('读取失败，存档文件可能已损坏!');
    }
};

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
    golbalSetting.rlayers = rlayers;

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
    golbalSetting.rootContainer = container;
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
    // const allFog = new PIXI.Graphics();
    // container.addChild(allFog);
    //ms.setMask({ mask: allFog })
    golbalSetting.mapContainer.addChild(ms);
    rlayers.basicLayer.attach(ms)
}

const generateAnimSprite = async (unit, container, rlayers, mapPassiable) => {
    console.log('generateAnimSprite', unit)
    const animSpriteUnit = await createAnimSpriteUnits(unit.unitTypeName, unit);

    const unitCreature = unit.creature;
    loadTraits(unit, unitCreature);
    loadPowers(unit, unitCreature);
    unit.animUnit = animSpriteUnit;
    animSpriteUnit.zIndex = envSetting.zIndexSetting.spriteZIndex;
    unit.creature = unitCreature;
    console.log('generateAnimSprite', unit, animSpriteUnit)
    addAnimSpriteUnit(unit, container, rlayers, mapPassiable);
    animSpriteUnit.x = Math.round(unit.x / 64) * 64;
    animSpriteUnit.y = Math.round(unit.y / 64) * 64;
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
    console.log('创建动画精灵单位:', unitTypeName, unit);
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
            selectedUnit.value = unit
        }
    });
    golbalSetting.spriteContainer.addChild(animSpriteUnit);
}

const addListenKeyboard = () => {

    //监听键盘S键
    document.addEventListener('keydown', (event) => {
        const container = golbalSetting.rootContainer;
        console.log('keydown', event.key);
        if (event.key === 's') {
            container.y -= 64
        }
    });
    //监听键盘A键
    document.addEventListener('keydown', (event) => {
        const container = golbalSetting.rootContainer;
        if (event.key === 'a') {
            container.x += 64
        }
    });
    //监听键盘D键
    document.addEventListener('keydown', (event) => {
        const container = golbalSetting.rootContainer;
        if (event.key === 'd') {
            container.x -= 64
        }
    });
    //监听键盘W键
    document.addEventListener('keydown', (event) => {
        const container = golbalSetting.rootContainer;
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

.game-controls {
    position: fixed;
    top: 10px;
    right: 10px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    z-index: 1000;
}

.save-button,
.load-button {
    padding: 10px 20px;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    min-width: 100px;
}

.save-button {
    background-color: #4CAF50;
}

.save-button:hover {
    background-color: #45a049;
}

.save-button:active {
    background-color: #3d8b40;
}

.load-button {
    background-color: #2196F3;
}

.load-button:hover {
    background-color: #1976D2;
}

.load-button:active {
    background-color: #1565C0;
}
</style>