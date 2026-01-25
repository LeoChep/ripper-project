import type { TiledMap } from "@/core/MapClass";
import { useTalkStateStore } from "@/stores/talkStateStore";
import * as InitiativeController from "@/core/system/InitiativeSystem";
import { CharacterOutCombatController } from "@/core/controller/CharacterOutCombatController";
import { golbalSetting } from "@/core/golbalSetting";
import { DramaSystem } from "@/core/system/DramaSystem";
import * as PIXI from "pixi.js";
import {
  getJsonFile,
  getMapAssetFile,
  getAnimMetaJsonFile,
  getAnimActionSpriteJsonFile,
  getAnimSpriteImgUrl,
  getUnitTypeJsonFile,
} from "@/utils/utils";
import { createUnitsFromMapSprites, loadPowers, loadTraits } from "@/core/units/Unit";
import { AnimMetaJson } from "@/core/anim/AnimMetaJson";
import { createCreature } from "@/core/units/Creature";
import { UnitAnimSpirite } from "@/core/anim/UnitAnimSprite";
import { useCharacterStore } from "@/stores/characterStore";
import { createDoorAnimSpriteFromDoor } from "@/core/anim/DoorAnimSprite";
import * as envSetting from "@/core/envSetting";

export const d1 = {
  name: "d1",
  description: "这是一个测试剧情",
  map: null as TiledMap | null,
  variables: new Map<string, any>(),
  async load(variables: { name: string; value: any }[]): Promise<void> {
    d1.variables.clear();
    if (!variables) {
      variables = [];
    }
    variables = [...variables];
    console.log("加载剧情变量:", variables);
    for (let i = 0; i < variables.length; i++) {
      d1.variables.set(variables[i].name, variables[i].value);
    }
    
    // 初始化地图
    await d1.loadTmj();
  },
  async loadTmj(): Promise<void> {
  console.log("开始初始化地图...");
    
    // 加载地图
    const mapPassiable = await loadMap("A");
    const spritesOBJ = mapPassiable.sprites;
    console.log("加载的地图数据:", mapPassiable);
    
    // 创建单位
    const units = createUnitsFromMapSprites(spritesOBJ);
    const createCreatureEndPromise: Promise<void>[] = [];
    
    units.forEach((unit) => {
      unit.y -= unit.height;
      const creatCreature = new Promise<void>(async (resolve, reject) => {
        const unitCreature = await createUnitCreature(unit.unitTypeName, unit);
        if (unitCreature) {
          unit.creature = unitCreature;
        }
        resolve();
      });
      createCreatureEndPromise.push(creatCreature);
    });
    
    await Promise.all(createCreatureEndPromise);
    mapPassiable.sprites = units;
    console.log("加载的地图数据:", mapPassiable);
        // 设置全局地图
    d1.map = mapPassiable;
    golbalSetting.map = mapPassiable;
  },

  getVariable(key: string): any {
    if (!d1.variables.has(key)) {
      console.warn(`Variable "${key}" not found in drama variables.`);
      d1.setVariable(key, false);
    }
    return d1.variables.get(key);
  },
  setVariable(key: string, value: any): void {
    d1.variables.set(key, value);
  },
  play: () => {
    const startFlag = d1.getVariable("startFlag");
    if (!startFlag) {
      d1.setVariable("startFlag", true);
      startEvent();
    }
    const door1Flag = d1.getVariable("door1");
    console.log("门1的状态:", door1Flag);
    if (!door1Flag) {
      door1Event();
    }
  },
};

const startEvent = async () => {
  const dramaSystem= DramaSystem.getInstance();
  dramaSystem.CGstart();
  await dramaSystem.unitSpeak("npc牧师","你们终于来了……这里的亡灵作祟越来越可怕了，我们需要你们的帮助来消灭它们。");
  await dramaSystem.speak(
    "你们能听见神殿里传来骨头摩擦的声音，似乎有骷髅在里面徘徊。"
  );
 await dramaSystem.unitSpeak("npc牧师","培罗在上，我感觉它们简直随时都可能冲出来攻击我们。  还请你们小心行事。");

  dramaSystem.CGEnd();
  CharacterOutCombatController.isUse = true;
};

const door1Event = async () => {
  const dramaSystem= DramaSystem.getInstance();
  const door1 = golbalSetting.map?.edges?.find(
    (edge: { id: number }) => edge.id === 44
  );
  if (door1?.useable === true) {
    return;
  }

  dramaSystem.CGstart();
  d1.setVariable("door1", true);
  await dramaSystem.speak(
    "你走近废弃的房屋，发现门口有一扇破旧的门。你试图推开门，但它似乎被什么东西卡住了。你决定用力推开它。"
  );
  await dramaSystem.unitSpeak("skeleton","骷髅：咯吱吱……咯吱吱");
  dramaSystem.CGEnd();
  //开始战斗
  if (!d1.map) {
    return;
  }
  InitiativeController.setMap(d1.map);
  const initCombatPromise = InitiativeController.addUnitsToInitiativeSheet(
    d1.map.sprites
  );
  initCombatPromise.then(async () => {
    await InitiativeController.startBattle();
    InitiativeController.startCombatTurn();
  });
};

// 辅助函数：加载地图
const loadMap = async (mapName: string) => {
  const url = getMapAssetFile(mapName);
  const mapTexture = await PIXI.Assets.load(url);
  const mapPassiablePOJO = await getJsonFile("map", mapName, "tmj");
  const { TiledMap } = await import("@/core/MapClass");
  const mapPassiable = new TiledMap(mapPassiablePOJO, mapTexture);
  return mapPassiable;
};

// 辅助函数：创建单位生物
const createUnitCreature = async (unitTypeName: string, unit: any) => {
  const json: any = await getUnitTypeJsonFile(unitTypeName);
  if (!json) {
    console.error(`Creature JSON file for ${unitTypeName} not found.`);
    return null;
  }

  const creature = createCreature(json as any);
  const unitCreature = creature;
  unit.creature = unitCreature;
  loadTraits(unit, unitCreature);
  loadPowers(unit, unitCreature);

  return creature;
};



