import { golbalSetting } from "../golbalSetting";
import type { Unit } from "../units/Unit";

export class UnitSystem {
  static instance: UnitSystem | null = null;
  static getInstance() {
    if (!UnitSystem.instance) {
      UnitSystem.instance = new UnitSystem();
    }
    return UnitSystem.instance;
  }
  findUnitByPIXIxy(pixiX: number, pixiY: number): Unit | null {
    if (!golbalSetting.map) {
      console.warn("地图或单位列表未初始化");
      return null;
    }
    const gridx= Math.floor(pixiX / 64);
    const gridy= Math.floor(pixiY / 64);
    // 在所有单位中查找与给定坐标匹配的单位
    const target = golbalSetting.map.sprites.find((sprite) => {
      const spriteX = Math.floor(sprite.x / 64);
      const spriteY = Math.floor(sprite.y / 64);
      const inrange = spriteX === gridx && spriteY === gridy;

      // 检查
      return inrange;
    });
    return target;
  }
  findUnitByGridxy(x: number, y: number): Unit | null {
    if (!golbalSetting.map) {
      console.warn("地图或单位列表未初始化");
      return null;
    }
    // 在所有单位中查找与给定格子坐标匹配的单位
    const target = golbalSetting.map.sprites.find((sprite) => {
      const spriteX = Math.floor(sprite.x / 64);
      const spriteY = Math.floor(sprite.y / 64);
      const inrange = spriteX === x && spriteY === y;
      // 检查
      return inrange;
    });
    return target;
  }
  getUnitById(id: string): Unit | null {
    const map = golbalSetting.map;
    if (!map) return null;
    return map.sprites.find((sprite: Unit) => sprite.id === parseInt(id)) || null;
  }
  constructor() {
    // 初始化逻辑
  }
}
