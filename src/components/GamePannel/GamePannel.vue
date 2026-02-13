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
  <SaveLoadDialog :mode="dialogMode" :isVisible="showDialog" @close="closeDialog" @select="handleSlotSelect" />
  <!-- 宝箱内容对话框 -->
  <ChestLootDialog />
</template>

<script setup lang="ts">
import FormationEditorButton from "@/components/TeamPannel/FormationEditorButton.vue";
import MessageTipTool from "@/components/MessageTipTool/MessageTipTool.vue";
import CreatureInfo from "../CharacterDetailPannel/CreatureInfo.vue";
import TalkPannel from "../TalkPannel/TalkPannel.vue";
import SaveLoadDialog from "../SaveLoadDialog/SaveLoadDialog.vue";
import ChestLootDialog from "../ChestLootDialog/ChestLootDialog.vue";
import { MessageTipSystem } from "@/core/system/MessageTipSystem";
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
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
import { createChestAnimSpriteFromChest } from "@/core/anim/ChestAnimSprite";
import { UnitAnimSpirite } from "@/core/anim/UnitAnimSprite";
import type { TiledMap } from "@/core/MapClass";
import type { Unit } from "@/core/units/Unit";
import { UnitSystem } from "@/core/system/UnitSystem";
import { FogSystem } from "@/core/system/NewFogSystem";
import { MapCanvasService } from "@/core/service/2dcanvas/MapCanvasService";


const appSetting = envSetting.appSetting;
const route = useRoute();

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
  const rlayers = MapCanvasService.getInstance().createRenderLayers(app);
  const container = MapCanvasService.getInstance().createContainer();
  container.sortableChildren = true;
  setContainer(container);
  setLayer(rlayers);

  //增加键盘监听
  addListenKeyboard();

  //初始化玩家角色

  // 单位状态机更新循环
  setInterval(() => {
    const units = golbalSetting.map?.sprites;
    console.log("单位状态机更新循环", units, golbalSetting);
    if (!units) return;
    units.forEach((unit) => {
      unit.stateMachinePack.doAction();
    });
  }, 1000 / 30); // 每秒30帧

  // 检查是否需要从存档加载
  const loadSlot = route.query.loadSlot;
  if (loadSlot) {
    // 如果有存档栏位参数，先初始化基础系统，然后读取存档
    console.log("[从主菜单读取存档] 栏位:", loadSlot);
    // await DramaSystem.getInstance().setDramaUse("d1");
    await new Promise((resolve) => setTimeout(resolve, 500));
    await loadGameState(Number(loadSlot), false);
    const characterOutCombatController = CharacterOutCombatController.getInstance();


  } else {
    // 设置并启动剧情（会自动加载地图）
    console.log("[changemap0] setDramaUse 前 golbalSetting.map:", golbalSetting.map);
    await DramaSystem.getInstance().setDramaUse("d1");
    console.log("[changemap0] setDramaUse 后 golbalSetting.map:", golbalSetting.map, "sprites:", golbalSetting.map?.sprites?.length);
    await MapCanvasService.getInstance().initByMap(golbalSetting.map);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    DramaSystem.getInstance().play();
    const characterOutCombatController = CharacterOutCombatController.getInstance();

  }


});



const selectedCreature = ref(null);
const selectedUnit = ref(null);
const creatureInfoPage = ref('basic'); // 添加页面状态

// 监听打开背包事件
onMounted(() => {
  // ... 其他onMounted代码

  // 监听打开背包的全局事件
  const handleOpenInventory = (event: any) => {
    const unit = event.detail?.unit;
    if (unit) {
      selectedCreature.value = unit.creature;
      selectedUnit.value = unit;
      // 需要通知CreatureInfo切换到背包页
      setTimeout(() => {
        // 使用自定义事件通知CreatureInfo切换页面
        window.dispatchEvent(new CustomEvent('switchToInventoryPage'));
      }, 100);
    }
  };

  window.addEventListener('openCharacterInventory', handleOpenInventory);

  // 清理事件监听
  return () => {
    window.removeEventListener('openCharacterInventory', handleOpenInventory);
  };
});

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
const loadGameState = async (slotId: number, needConfirm: boolean = true): Promise<boolean> => {
  try {
    const savedState = localStorage.getItem(`gameState_slot_${slotId}`);
    if (!savedState) {
      alert(`栏位 ${slotId} 没有存档文件！`);
      return false;
    }
    const gameState = JSON.parse(savedState);

    // 确认是否要读取存档
    if (needConfirm) {
      const confirmLoad = await MessageTipSystem.getInstance().confirm(
        `是否要读取栏位 ${slotId} 的存档?\n保存时间: ${new Date(gameState.timestamp).toLocaleString()}`
      );
      if (!confirmLoad) {
        return false;
      }
    }

    //
    DramaSystem.getInstance().stop();
    MapCanvasService.getInstance().clear();
    MapCanvasService.getInstance().createContainer();
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

    await MapCanvasService.getInstance().initByMap(golbalSetting.map);
    console.log("[changemap4]  d1.loadTmj initByMap 后:", golbalSetting.map, "sprites:", golbalSetting.map?.sprites?.length);

    // 立即更新一次战争迷雾，确保门和宝箱立即显示
    // 强制刷新迷雾系统，清空缓存并重新计算可见性
    // FogSystem.instanse.refreshSpatialGrid(true);
    console.log("[读档] 强制刷新战争迷雾完成，门和宝箱可见性已更新");

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
        } else {
          unit.ai?.autoAction(unit, golbalSetting.map);
        }

      }
    } else {
      if (golbalSetting.rlayers && golbalSetting.rootContainer && golbalSetting.map) {
        new CharacterOutCombatController();
        CharacterOutCombatController.isUse = true;
        const units = UnitSystem.getInstance().getAllUnits();
        const playerUnits = units.filter((u) => u.party === "player");
        CharacterController.selectCharacter(playerUnits[0]);
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





const addListenKeyboard = () => {
  //监听键盘S键
  document.addEventListener("keydown", (event) => {
    const container = golbalSetting.rootContainer;
    console.log("keydown", event.key);
    if (event.key === "s" && container) {
      container.y -= 64;
      FogSystem.instanse.refreshSpatialGrid(true)
    }
  });
  //监听键盘A键
  document.addEventListener("keydown", (event) => {
    const container = golbalSetting.rootContainer;
    if (event.key === "a" && container) {
      container.x += 64;
        FogSystem.instanse.refreshSpatialGrid(true)
    }
  });
  //监听键盘D键
  document.addEventListener("keydown", (event) => {
    const container = golbalSetting.rootContainer;
    if (event.key === "d" && container) {
      container.x -= 64;
        FogSystem.instanse.refreshSpatialGrid(true)
    }
  });
  //监听键盘W键
  document.addEventListener("keydown", (event) => {
    const container = golbalSetting.rootContainer;
    if (event.key === "w" && container) {
      container.y += 64;
        FogSystem.instanse.refreshSpatialGrid(true)
    }
  });
};
const drawGrid = (app: any, rlayers: any) => {
  //格子
  const lineContainer = new PIXI.Container();
  const gridSize = 64;
  
  // 使用地图的实际大小而不是视口大小
  const map = golbalSetting.map;
  if (!map) return;
  
  const mapWidth = map.width * map.tilewidth;
  const mapHeight = map.height * map.tileheight;
  const cols = map.width;
  const rows = map.height;
  
  // 画竖线
  for (let i = 1; i < cols; i++) {
    const line = new PIXI.Graphics();
    line.moveTo(i * gridSize, 0);
    line.lineTo(i * gridSize, mapHeight);
    line.stroke({ width: 1, color: 0x444444, alpha: 1 });
    lineContainer.addChild(line);
  }

  // 画横线
  for (let j = 1; j < rows; j++) {
    const line = new PIXI.Graphics();
    line.moveTo(0, j * gridSize);
    line.lineTo(mapWidth, j * gridSize);
    line.stroke({ width: 1, color: 0x444444, alpha: 1 });
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
