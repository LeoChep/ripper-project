import type { Unit } from "@/core/units/Unit";
import { d1 } from "@/drama/d1";
import type { Drama } from "@/drama/drama";
import { UnitSystem } from "./UnitSystem";
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
    dialogText?: string,
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

  // 辅助函数：创建单位生物
  async createUnitCreature(unitTypeName: string, unit: any) {
    const { getUnitTypeJsonFile } = await import("@/utils/utils");
    const { createCreature } = await import("@/core/units/Creature");
    const { loadTraits, loadPowers } = await import("@/core/units/Unit");

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
    variables: { name: string; value: any }[],
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

    // 创建单位
    const units = createUnitsFromMapSprites(spritesOBJ);

    // 使用 map 而不是 forEach，避免冗余的 Promise 包装
    const createCreatureEndPromise = units.map(async (unit) => {
      unit.y -= unit.height;
      try {
        const unitCreature = await this.createUnitCreature(
          unit.unitTypeName,
          unit,
        );
      } catch (error) {
        console.error(
          `[DramaSystem.loadTmj] 创建生物失败: ${unit.unitTypeName}`,
          error,
        );
      }
    });

    await Promise.all(createCreatureEndPromise);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // 确保所有异步操作完成
    mapPassiable.sprites = units;
    // 设置全局地图
    drama.map = mapPassiable;
    golbalSetting.map = mapPassiable;
  }
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
}
const initDramaMap = () => {
  const dramaSystem = DramaSystem.getInstance();
  dramaSystem.registerDrama("d1", d1);
};
