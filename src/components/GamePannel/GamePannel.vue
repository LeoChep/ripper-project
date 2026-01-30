<template>
  <div class="game-pannel" id="game-pannel"></div>
  <!-- <img :src="hitURL"> -->
  <InitBar></InitBar>
  <TurnAnnouncement ref="turnAnnouncementRef" />
  <CreatureInfo :creature="selectedCreature" :unit="selectedUnit" v-if="selectedUnit"
    @close="selectedCreature = null" />
  <TalkPannel />
  <CharacterPannel />
  <MessageTipTool />
  <!-- <FormationEditorButton /> -->
  <!-- 保存和读取按钮 -->
  <div class="game-controls">
    <button class="save-button" @click="openSaveDialog">保存游戏</button>
    <button class="load-button" @click="openLoadDialog">读取游戏</button>
  </div>
  <!-- 存档对话框 -->
  <SaveLoadDialog 
    :mode="dialogMode" 
    :isVisible="showDialog"
    @close="closeDialog"
    @select="handleSlotSelect"
  />
</template>

<script setup lang="ts">
import FormationEditorButton from "@/components/TeamPannel/FormationEditorButton.vue";
import MessageTipTool from "@/components/MessageTipTool/MessageTipTool.vue";
import CreatureInfo from "../CharacterDetailPannel/CreatureInfo.vue";
import TalkPannel from "../TalkPannel/TalkPannel.vue";
import SaveLoadDialog from "../SaveLoadDialog/SaveLoadDialog.vue";
import { MessageTipSystem } from "@/core/system/MessageTipSystem";
import { ref, onMounted } from "vue";
import { getAnimActionSpriteJsonFile, getAnimMetaJsonFile, getAnimSpriteImgUrl, getMapAssetFile } from "@/utils/utils";
import * as PIXI from "pixi.js";
import { setContainer, setLayer } from "@/stores/container";
import CharacterPannel from "../CharacterPannel/CharacterPannel.vue";
import { useCharacterStore } from "@/stores/characterStore";
import { CharacterOutCombatController } from "@/core/controller/CharacterOutCombatController";
import * as envSetting from "@/core/envSetting";
import { golbalSetting } from "@/core/golbalSetting";
import { DramaSystem } from "@/core/system/DramaSystem";
import * as InitiativeSystem from "@/core/system/InitiativeSystem";
import { CharacterCombatController } from "@/core/controller/CharacterCombatController";
import { Saver } from "@/core/saver/Saver";
import { AreaSystem } from "@/core/system/AreaSystem";
import InitBar from "../ActionBar/InitBar.vue";
import TurnAnnouncement from "../TurnAnnouncement/TurnAnnouncement.vue";
import { CharacterController } from "@/core/controller/CharacterController";
import { AnimMetaJson } from "@/core/anim/AnimMetaJson";
import { createDoorAnimSpriteFromDoor } from "@/core/anim/DoorAnimSprite";
import { UnitAnimSpirite } from "@/core/anim/UnitAnimSprite";
import type { TiledMap } from "@/core/MapClass";
import type { Unit } from "@/core/units/Unit";

const appSetting = envSetting.appSetting;

// 测试功能开关：控制是否显示格子行列号
const showGridNumbers = ref(false);

onMounted(async () => {
  const app = new PIXI.Application();
  await app.init(appSetting);

  const gamePannel = document.getElementById("game-pannel");
  if (gamePannel) {
    gamePannel.appendChild(app.canvas);
  }

  golbalSetting.app = app;

  //初始化容器
  const rlayers = createRenderLayers(app);
  const container = createContainer(app, rlayers);
  container.sortableChildren = true;
  setContainer(container);
  setLayer(rlayers);

  //绘制格子
  drawGrid(app, rlayers);

  //增加键盘监听
  addListenKeyboard();

  //初始化玩家角色
  const characterOutCombatController = CharacterOutCombatController.getInstance();

  // 单位状态机更新循环
  setInterval(() => {
    const units = golbalSetting.map?.sprites;
    console.log("单位状态机更新循环", units, golbalSetting);
    if (!units) return;
    units.forEach((unit) => {
      unit.stateMachinePack.doAction();
    });
  }, 1000 / 30); // 每秒30帧

  // 设置并启动剧情（会自动加载地图）
  console.log("[changemap0] setDramaUse 前 golbalSetting.map:", golbalSetting.map);
  await DramaSystem.getInstance().setDramaUse("d1");
  console.log("[changemap0] setDramaUse 后 golbalSetting.map:", golbalSetting.map, "sprites:", golbalSetting.map?.sprites?.length);
  await initByMap(golbalSetting.map);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  DramaSystem.getInstance().play();
});
// 辅助函数：根据地图初始化
const initByMap = async (mapPassiable: any) => {
  // golbalSetting.map = mapPassiable;
  const container = golbalSetting.rootContainer;
  const rlayers = golbalSetting.rlayers;
  const units = mapPassiable.sprites;
  const mapView = mapPassiable.textures;

  // 绘制地图
  drawMap(mapView, container, rlayers);
  console.log(units);

  // 创建门
  const doors = mapPassiable.doors;
  doors.forEach(async (door: any) => {
    const doorSprite = await createDoorAnimSpriteFromDoor(door);
    if (container) container.addChild(doorSprite);
    if (rlayers.controllerLayer) rlayers.controllerLayer.attach(doorSprite);
  });

  // 创建单位
  let createEndPromise: Promise<any>[] = [];
  units.forEach((unit: Unit) => {
    if (unit.state=="dead") {

      return;
    }
    const promise = generateAnimSprite(unit, container, rlayers, mapPassiable);
    createEndPromise.push(promise);
  });

  if (createEndPromise.length > 0) await Promise.all(createEndPromise);
  // mapPassiable.sprites = units;
  console.log("所有单位创建完成:", units);
  const characterStore = useCharacterStore();
  characterStore.clearCharacters();
  units.forEach((unit: any) => {
    if (unit.party === "player") {
      characterStore.addCharacter(unit);
      console.log('characterStore', characterStore)
    }
  });
};

// 辅助函数：绘制地图
const drawMap = (mapView: any, container: any, rlayers: any) => {
  if (golbalSetting.mapContainer) {
    golbalSetting.mapContainer.children.forEach((child: any) => {
      golbalSetting.mapContainer!.removeChild(child);
      child.destroy();
    });
  }
  const ms = new PIXI.Sprite(mapView);
  ms.zIndex = envSetting.zIndexSetting.mapZindex;
  ms.label = "map";
  if (golbalSetting.mapContainer) {
    golbalSetting.mapContainer.addChild(ms);
  }
};

// 辅助函数：生成动画精灵
const generateAnimSprite = async (unit: any, container: any, rlayers: any, mapPassiable: any) => {
  console.log("generateAnimSprite", unit);
  const animSpriteUnit = await createAnimSpriteUnits(unit.unitTypeName, unit);

  unit.animUnit = animSpriteUnit;
  animSpriteUnit.zIndex = envSetting.zIndexSetting.spriteZIndex;

  console.log("generateAnimSprite", unit, animSpriteUnit);
  addAnimSpriteUnit(unit, container, rlayers, mapPassiable);
  animSpriteUnit.x = Math.round(unit.x / 64) * 64;
  animSpriteUnit.y = Math.round(unit.y / 64) * 64;
  unit.x = animSpriteUnit.x;
  unit.y = animSpriteUnit.y;
  return unit;
};

// 辅助函数：创建动画精灵单位
const createAnimSpriteUnits = async (unitTypeName: string, unit: any) => {
  console.log("创建动画精灵单位:", unitTypeName, unit);
  const testJsonFetchPromise = getAnimMetaJsonFile(unitTypeName);
  const animMetaJson = new AnimMetaJson((await testJsonFetchPromise) as any);
  const animSpriteUnit = new UnitAnimSpirite(unit);

  animSpriteUnit.setFrameSize({
    width: animMetaJson.frameSize,
    height: animMetaJson.frameSize,
  });
  if (unit.creature) {
    console.log("单位的视觉大小:", animSpriteUnit.visisualSizeValue, unit.creature.size);
    if (unit.creature.size == "big")
      animSpriteUnit.visisualSizeValue = { width: 128, height: 128 };
  } else {
    animSpriteUnit.visisualSizeValue = { width: 64, height: 64 };
  }
  animMetaJson.getAllExportedAnimations().forEach(async (anim) => {
    console.log(anim);
    const spriteUrl = getAnimSpriteImgUrl(unitTypeName, anim, "standard");
    const sheetTexture = await PIXI.Assets.load(spriteUrl);
    console.log(anim);
    const jsonFetchPromise = getAnimActionSpriteJsonFile(unitTypeName, anim, "standard");
    const json: any = await jsonFetchPromise;
    if (json && json.frames) {
      const spritesheet = new PIXI.Spritesheet(sheetTexture, json as any);
      await spritesheet.parse();
      animSpriteUnit.addAnimationSheet(anim, spritesheet);
    }
  });
  return animSpriteUnit;
};

// 辅助函数：添加动画精灵单位
const addAnimSpriteUnit = (unit: any, container: any, rlayers: any, mapPassiable: any) => {
  const animSpriteUnit = unit.animUnit;
  console.log("addAnimSpriteUnit", unit);
  rlayers.spriteLayer.attach(animSpriteUnit);
  animSpriteUnit.eventMode = "static";

  animSpriteUnit.on("rightclick", (event: any) => {
    if (unit.creature) {
      // 这里可以触发选择事件，但为了保持简洁，暂时移除选择逻辑
      console.log("Clicked on unit:", unit.unitTypeName);
      if (unit.party === "player"|| unit.party !== 'true') {
        console.log("这是玩家角色，打开角色面板");
        selectedCreature.value = unit.creature;
        selectedUnit.value = unit;
      } else {
        console.log("这是非玩家角色，打开生物信息面板");
      }

    }
  });
  if (golbalSetting.spriteContainer) {
    golbalSetting.spriteContainer.addChild(animSpriteUnit);
  }
};
const selectedCreature = ref(null);
const selectedUnit = ref(null);

// 存档对话框相关状态
const showDialog = ref(false);
const dialogMode = ref<'save' | 'load'>('save');

// 打开保存对话框
const openSaveDialog = () => {
  dialogMode.value = 'save';
  showDialog.value = true;
};

// 打开读取对话框
const openLoadDialog = () => {
  dialogMode.value = 'load';
  showDialog.value = true;
};

// 关闭对话框
const closeDialog = () => {
  showDialog.value = false;
};

// 处理栏位选择
const handleSlotSelect = async (slotId: number) => {
  if (dialogMode.value === 'save') {
    saveGameState(slotId);
    closeDialog();
  } else {
    const success = await loadGameState(slotId);
    if (success) {
      closeDialog();
    }
  }
};

// 添加保存游戏状态的方法（修改为支持栏位）
const saveGameState = (slotId: number) => {
  try {
    Saver.saveGameState();
    const gameState = Saver.gameState;
    
    // 保存到指定栏位
    localStorage.setItem(`gameState_slot_${slotId}`, JSON.stringify(gameState));
    
    // 可选：同时下载 GameState 文件作为备份
    const dataStr = JSON.stringify(gameState, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = `gameState_slot${slotId}_${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.json`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    // 释放 URL 对象
    URL.revokeObjectURL(url);

    // 显示保存成功消息
    console.log(`游戏状态已保存到栏位 ${slotId}`, gameState);
    alert(`游戏已保存到栏位 ${slotId}！`);
  } catch (error) {
    console.error("保存游戏状态失败:", error);
    alert("保存失败，请重试!");
  }
};

// 添加读取游戏状态的方法（修改为支持栏位）
const loadGameState = async (slotId: number): Promise<boolean> => {
  try {
    const savedState = localStorage.getItem(`gameState_slot_${slotId}`);
    if (!savedState) {
      alert(`栏位 ${slotId} 没有存档文件！`);
      return false;
    }
    const gameState = JSON.parse(savedState);

    // 确认是否要读取存档
    const confirmLoad = await MessageTipSystem.getInstance().confirm(
      `是否要读取栏位 ${slotId} 的存档?\n保存时间: ${new Date(gameState.timestamp).toLocaleString()}`
    );
    if (!confirmLoad) {
      return false;
    }
    //
    DramaSystem.getInstance().stop();
    clear();

    createContainer(golbalSetting.app, golbalSetting.rlayers);
    // 重置地图为空对象
    console.log("[changemap1] 读档前重置地图为空对象", golbalSetting.map);
    golbalSetting.map = {} as TiledMap;
    console.log("[changemap1] 重置后:", golbalSetting.map);

    // setDramaUse 会在 d1.ts 中加载并创建新的地图对象

    console.log("[changemap3] setDramaUse 后, loadGameState 前:", golbalSetting.map, "sprites:", golbalSetting.map?.sprites?.length);

    // 从存档恢复游戏状态（可能会更新 golbalSetting.map）
    await Saver.loadGameState(gameState);
    console.log("[changemap3] loadGameState 后:", golbalSetting.map, "sprites:", golbalSetting.map?.sprites?.length);

    // 初始化地图视觉元素
    console.log("[changemap4] d1.loadTmj initByMap 前:", golbalSetting.map, "sprites:", golbalSetting.map?.sprites?.length);
    await initByMap(golbalSetting.map);
    drawGrid(golbalSetting.app, golbalSetting.rlayers);
    console.log("[changemap4]  d1.loadTmj initByMap 后:", golbalSetting.map, "sprites:", golbalSetting.map?.sprites?.length);

    console.log("初始化地图完成:", golbalSetting.map);

    DramaSystem.getInstance().play();
    AreaSystem.getInstance().rebuildAreas();

    if (InitiativeSystem.isInBattle()) {
      CharacterCombatController.getInstance().inUse = true;
      console.log("进入战斗状态", InitiativeSystem);
      const unit = InitiativeSystem.getPointAtUnit();
      if (unit) {
        if (unit.party === "player") {
           console.log("loadInitRecord selectCharacter", unit);
        CharacterController.selectCharacter(unit);
        CharacterCombatController.getInstance().selectedCharacter = unit;
        CharacterCombatController.getInstance().useMoveController();
        }else{
         unit.ai?.autoAction(unit,golbalSetting.map);
        }
    
      }
    } else {
      if (golbalSetting.rlayers && golbalSetting.rootContainer && golbalSetting.map) {
        new CharacterOutCombatController();
        console.log("进入非战斗状态");
        // 使用 JSON 序列化来快照当前状态，避免控制台延迟展开导致的不一致
        console.log("进入非战斗状态 - 地图:", golbalSetting.map);

      }
    }
    console.log("恢复的地图数据:", golbalSetting.map, golbalSetting);
    console.log(`栏位 ${slotId} 游戏状态已读取`, gameState);

    // console.log("恢复的角色数据:", characterStore.characters);
    alert(`栏位 ${slotId} 游戏已读取！`);
    return true;
  } catch (error) {
    console.error("读取游戏状态失败:", error);
    alert("读取失败，存档文件可能已损坏!");
    return false;
  }
};
const clear = () => {
  const characterStore = useCharacterStore();
  characterStore.characters = [];
  const rootContainer = golbalSetting.rootContainer;
  const clearContainer = (container: any) => {
    if (container.children) {
      const children = container.children;
      for (let i = container.children.length - 1; i >= 0; i--) {
        const child = container.children[i];
        children.push(child);
      }
      children.forEach((child: any) => {
        clearContainer(child);
      });
      container.destroy();
    } else {
      // container.parent.removeChild(container);
      container.destroy();
    }
  };
  if (rootContainer) {
    clearContainer(rootContainer);
    console.log("清空容器完成", rootContainer.parent);
    rootContainer.destroy();
  }
  characterStore.clearCharacters();
};
const createRenderLayers = (app: any) => {
  const rlayers: any = {
    basicLayer: null,
    spriteLayer: null,
    lineLayer: null,
    fogLayer: null,
    selectLayer: null,
    controllerLayer: null
  };
  rlayers.basicLayer = new PIXI.RenderLayer();
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
  rlayers.basicLayer.label = "basicLayer";
  rlayers.spriteLayer.label = "spriteLayer";
  rlayers.selectLayer.label = "selectLayer";
  rlayers.lineLayer.label = "lineLayer";
  rlayers.fogLayer.label = "fogLayer";
  rlayers.controllerLayer.label = "controllerLayer";
  golbalSetting.rlayers = rlayers;

  return rlayers;
};

const createContainer = (app: any, rlayers: any) => {
  app.stage.interactive = true;
  const container = new PIXI.Container();
  // 创建一个 800x600 的矩形图形作为底盘
  const rect = new PIXI.Graphics();
  rect.rect(0, 0, 20000, 20000);
  rect.fill({ color: "black" }); // 黑色填充
  container.addChild(rect);
  container.eventMode = "static";
  rlayers.basicLayer.attach(container);
  app.stage.addChild(container);
  const spriteContainer = new PIXI.Container();
  const mapContainer = new PIXI.Container();
  const tipContainer = new PIXI.Container();
  spriteContainer.label = "spriteContainer";
  mapContainer.label = "mapContainer";
  container.addChild(spriteContainer);
  container.addChild(mapContainer);
  app.stage.addChild(tipContainer);
  spriteContainer.zIndex = envSetting.zIndexSetting.spriteZIndex;
  mapContainer.zIndex = envSetting.zIndexSetting.mapZindex;
  tipContainer.zIndex = envSetting.zIndexSetting.tipZIndex;
  // spriteContainer.eventMode = 'none';
  mapContainer.eventMode = "dynamic";
  mapContainer.interactiveChildren = true;
  // 设置全局变量
  golbalSetting.spriteContainer = spriteContainer;
  golbalSetting.mapContainer = mapContainer;
  golbalSetting.rootContainer = container;
  golbalSetting.tipContainer = tipContainer;
  return container;
};

const addListenKeyboard = () => {
  //监听键盘S键
  document.addEventListener("keydown", (event) => {
    const container = golbalSetting.rootContainer;
    console.log("keydown", event.key);
    if (event.key === "s" && container) {
      container.y -= 64;
    }
  });
  //监听键盘A键
  document.addEventListener("keydown", (event) => {
    const container = golbalSetting.rootContainer;
    if (event.key === "a" && container) {
      container.x += 64;
    }
  });
  //监听键盘D键
  document.addEventListener("keydown", (event) => {
    const container = golbalSetting.rootContainer;
    if (event.key === "d" && container) {
      container.x -= 64;
    }
  });
  //监听键盘W键
  document.addEventListener("keydown", (event) => {
    const container = golbalSetting.rootContainer;
    if (event.key === "w" && container) {
      container.y += 64;
    }
  });
};
const drawGrid = (app: any, rlayers: any) => {
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

  // 在每个格子中心显示行列号（测试功能，由 showGridNumbers 变量控制）
  if (showGridNumbers.value) {
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        const text = new PIXI.Text({
          text: `${col},${row}`,
          style: {
            fontSize: 12,
            fill: 0xff0000,
            align: 'center'
          }
        });
        text.anchor.set(0.5, 0.5);
        text.x = col * gridSize + gridSize / 2;
        text.y = row * gridSize + gridSize / 2;
        lineContainer.addChild(text);
      }
    }
  }
  if (golbalSetting.rootContainer)
    golbalSetting.rootContainer.addChild(lineContainer);
  rlayers.lineLayer.attach(lineContainer);
};
</script>

<style scoped>
.game-pannel {
  position: fixed;
  top: 0;
  left: 0;
  width: 1600px;
  height: 900px;
  background: white;
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
  background-color: #4caf50;
}

.save-button:hover {
  background-color: #45a049;
}

.save-button:active {
  background-color: #3d8b40;
}

.load-button {
  background-color: #2196f3;
}

.load-button:hover {
  background-color: #1976d2;
}

.load-button:active {
  background-color: #1565c0;
}
</style>
