import type { Unit } from "@/core/units/Unit";
import { d1 } from "@/drama/d1";
import { Drama } from "@/drama/drama";
import { UnitSystem } from "./UnitSystem";
import { createChestFromBoxObj } from "../units/Chest";
import { golbalSetting } from "@/core/golbalSetting";
import { city_1 } from "@/drama/city_1";
import type { TiledMap } from "@/core/MapClass";
import { MapCanvasService } from "../service/2dcanvas/MapCanvasService";
import { FogSystem } from "./NewFogSystem";
import { CharacterOutCombatController } from "../controller/CharacterOutCombatController";
import { CharacterController } from "../controller/CharacterController";
interface DialogOption {
  text: string;
  value: any;
}
export class DramaSystem {
  private dramaMap: Map<string, any> = new Map();
  static instance: DramaSystem;
  records = [] as { name: any; variables: unknown[] }[];
  interval = null as unknown as NodeJS.Timeout;
  dramaUse: Drama | null = null;

  static getInstance(): DramaSystem {
    if (!DramaSystem.instance) {
      DramaSystem.instance = new DramaSystem();
      initDramaMap();
    }
    return DramaSystem.instance;
  }
  constructor() {
    // Initialize the drama system if needed
  }

  registerDrama(name: string, drama: Drama): void {
    this.dramaMap.set(name, drama);
  }

  getDrama(name: string): Drama | null {
    return this.dramaMap.get(name) || null;
  }

  async setDramaUse(dramaName: string): Promise<void> {
    const drama = this.getDrama(dramaName);
    let varliabeleArr: any[] = [];
    this.records.forEach((record) => {
      if (record.name === dramaName) {
        varliabeleArr = record.variables;
      }
    });
    this.dramaUse = drama;
    await this.load(drama, varliabeleArr);
  }

  play(): void {
    const interval = setInterval(() => {
      if (this.dramaUse) {
        this.dramaUse.play();
      } else {
        console.warn("No drama is set to play.");
      }
    }, 100);
    this.interval = interval;

    this.dramaUse?.loadInit();
  }
  stop(): void {
    clearInterval(this.interval);
    if (this.dramaUse) {
      this.dramaUse = null;
    } else {
      console.warn("No drama is currently playing.");
    }
  }

  speak = async (content: string): Promise<void> => {};
  unitSpeak = async (unitName: string, content: string): Promise<void> => {};
  choose = async (options: DialogOption[]): Promise<any> => {};
  unitChoose = async (
    unitName: string,
    options: DialogOption[],
    dialogText?: string
  ): Promise<any> => {};

  CGstart = () => {};
  CGEnd = () => {};
  clearDramas(): void {
    this.dramaMap.clear();
  }

  // 辅助函数：加载地图
  async loadMap(mapName: string) {
    const PIXI = await import("pixi.js");
    const { getMapAssetFile, getJsonFile } = await import("@/utils/utils");
    const url = getMapAssetFile(mapName);
    const mapTexture = await PIXI.Assets.load(url);
    const mapPassiablePOJO = await getJsonFile("map", mapName, "tmj");
    const { TiledMap } = await import("@/core/MapClass");
    const mapPassiable = new TiledMap(mapPassiablePOJO, mapTexture);
    return mapPassiable;
  }

  //提供注入口
  //todo以后需要由专门模块负责
  createSpriteAnim = async (unit: Unit): Promise<any> => {
    await MapCanvasService.getInstance().createAnimSpriteUnits(unit);
  };
  // 辅助函数：创建单位生物
  async createUnitCreature(unitTypeName: string, unit: any) {
    const { getUnitTypeJsonFile } = await import("@/utils/utils");
    const { createCreature } = await import("@/core/units/Creature");
    const { loadTraits, loadPowers } = await import("@/core/units/Unit");
    if (unit.gid) {
      unit.y -= unit.height;
    }
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
  }

  // 加载剧情
  async load(
    drama: any,
    variables: { name: string; value: any }[]
  ): Promise<void> {
    drama.variables.clear();
    if (!variables) {
      variables = [];
    }
    variables = [...variables];
    for (let i = 0; i < variables.length; i++) {
      drama.variables.set(variables[i].name, variables[i].value);
    }

    // 初始化地图
    await this.loadTmj(drama);
  }

  // 获取剧情变量
  getVariable(drama: any, key: string): any {
    if (!drama.variables.has(key)) {
      console.warn(`Variable "${key}" not found in drama variables.`);
      this.setVariable(drama, key, false);
    }
    return drama.variables.get(key);
  }

  // 设置剧情变量
  setVariable(drama: any, key: string, value: any): void {
    drama.variables.set(key, value);
  }

  // 加载 Tiled 地图
  async loadTmj(drama: any): Promise<void> {
    const { createUnitsFromMapSprites } = await import("@/core/units/Unit");
    const { golbalSetting } = await import("@/core/golbalSetting");

    // 加载地图
    const mapPassiable = await this.loadMap(drama.mapName);

    const spritesOBJ = mapPassiable.sprites;
    const boxOBJ = mapPassiable.chests;
    // 创建单位
    //从tmj中的sprites创造单位，只有tmj（tiledmap）中的简要信息，没有生物信息，生物信息需要从json文件中加载
    const allUnits = createUnitsFromMapSprites(spritesOBJ);
    const hidenUnits = allUnits.filter((unit) => unit.isSceneHidden);
    mapPassiable.hiddenUnits = hidenUnits; // 将隐藏单位存储在地图对象中，后续需要时可以从这里获取
    const units = allUnits.filter((unit) => !unit.isSceneHidden); // 过滤掉隐藏单位，先不添加到地图中，等需要的时候再添加
    // 处理隐藏单位，暂时先不添加到地图中，等需要的时候再添加
    //从units中去掉隐藏单位，先不添加到地图中，等需要的时候再添加

    console.log("Loaded boxOBJ from map:", boxOBJ);
    const chests = await Promise.all(
      boxOBJ.map((obj) => createChestFromBoxObj(obj))
    );
    console.log("Created chests from boxOBJ:", chests);

    // 注册宝箱到 ChestSystem
    const { ChestSystem } = await import("./ChestSystem");
    const chestSystem = ChestSystem.getInstance();
    chests.forEach((chest) => {
      chestSystem.registerChest(chest);
    });

    // 使用 map 而不是 forEach，避免冗余的 Promise 包装
    // 读取对应的生物类别，创建完整的单位对象
    const createCreatureEndPromise = units.map(async (unit) => {
      // Tiled 中带 gid 的对象 y 坐标是底部位置，需要减去高度转换为顶部位置
      // 没有 gid 的对象 y 坐标已经是顶部位置，不需要调整

      try {
        const unitCreature = await this.createUnitCreature(
          unit.unitTypeName,
          unit
        );
      } catch (error) {
        console.error(
          `[DramaSystem.loadTmj] 创建生物失败: ${unit.unitTypeName}`,
          error
        );
      }
    });

    await Promise.all(createCreatureEndPromise);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // 确保所有异步操作完成
    mapPassiable.sprites = units;
    mapPassiable.chests = chests;
    // 处理宝箱
    console.log("Loaded chests from map:", mapPassiable.chests);

    // 设置全局地图
    drama.map = mapPassiable;
    golbalSetting.map = mapPassiable;
  }
  battleEndHandle = () => {
    this.dramaUse?.battleEndHandle();
  };
  getRercords() {
    const recorders: { name: any; variables: unknown[] }[] = [];
    this.dramaMap.forEach((drama, name) => {
      const vars = drama.variables as Map<string, any>;
      const varsArr: any[] = [];

      vars.forEach((variable, key) => {
        varsArr.push({ name: key, value: variable });
      });

      recorders.push({
        name: drama.name,
        variables: varsArr,
      });
    });
    return { use: this.dramaUse?.name, recorders };
  }
  addInteractionHandle = (unit: string, event: (...args: any[]) => {}) => {};
  addInteraction(unitname: string, event: (...args: any[]) => {}) {
    this.addInteractionHandle(unitname, event);
    console.log("为单位添加交互事件:", unitname);
    const unit = UnitSystem.getInstance().getUnitByName(unitname);
    if (unit) {
      console.log("找到单位，添加事件监听器:", unit);
      unit.animUnit?.on("click", (...args: any[]) => {
        console.log("触发交互事件:", unitname);
        event(...args);
      });
    }
  }
  unHiddenUnit = async (unitName: string) => {
    const map = golbalSetting.map;
    if (!map) {
      console.error("地图未加载，无法显示单位:", unitName);
      return;
    }
    const hiddenUnitIndex = map.hiddenUnits.findIndex(
      (unit: { name: string }) => unit.name === unitName
    );
    if (hiddenUnitIndex !== -1) {
      const [unit] = map.hiddenUnits.splice(hiddenUnitIndex, 1);
      try {
        const unitCreature = await this.createUnitCreature(
          unit.unitTypeName,
          unit
        );
        console.log("创建生物成功:", unitCreature);
        await this.createSpriteAnim(unit);
      } catch (error) {
        console.error(
          `[DramaSystem.loadTmj] 创建生物失败: ${unit.unitTypeName}`,
          error
        );
      }

      map.sprites.push(unit);
      console.log(`单位 ${unitName} 已从隐藏状态中移除并添加到地图上。`);
    }
  };
  //辅助函数的接口，需要后续分离
  clear = () => {};
  createContainer = () => {};
  changeScene = async (sceneName: string) => {
    DramaSystem.getInstance().stop();
    MapCanvasService.getInstance().clear();
    MapCanvasService.getInstance().createContainer();
    golbalSetting.map = {} as TiledMap;
    await DramaSystem.getInstance().setDramaUse(sceneName);
    await MapCanvasService.getInstance().initByMap(golbalSetting.map);
    // FogSystem.instanse.refreshSpatialGrid(true);
    DramaSystem.getInstance().play();
    new CharacterOutCombatController();
    CharacterOutCombatController.isUse = true;
    const units = UnitSystem.getInstance().getAllUnits();
    const playerUnits = units.filter((u) => u.party === "player");
    CharacterController.selectCharacter(playerUnits[0]);
  };
}
const initDramaMap = () => {
  const dramaSystem = DramaSystem.getInstance();
  dramaSystem.registerDrama("d1", d1);
  dramaSystem.registerDrama("city_1", city_1);
};
