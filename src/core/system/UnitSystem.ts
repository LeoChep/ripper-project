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
    const gridx = Math.floor(pixiX / 64);
    const gridy = Math.floor(pixiY / 64);

    return this.findUnitByGridxy(gridx, gridy);
  }
  findUnitByGridxy(x: number, y: number): Unit | null {
    if (!golbalSetting.map) {
      console.warn("地图或单位列表未初始化");
      return null;
    }
    // 在所有单位中查找与给定格子坐标匹配的单位
    const gridx = x;
    const gridy = y;
    // 在所有单位中查找与给定坐标匹配的单位
    const target = golbalSetting.map.sprites.find((sprite) => {
      const spriteX = Math.floor(sprite.x / 64);
      const spriteY = Math.floor(sprite.y / 64);
      const size = sprite.creature.size;

      // 构建范围数组
      const rangeArr = this.getUnitGrids(sprite);

      const inrange = rangeArr.some(
        (pos) => pos.x === gridx && pos.y === gridy
      );

      // 检查
      return inrange;
    });
    return target;
  }
  getUnitGrids(unit: Unit) {
    if (!unit.creature) {
      console.warn("unit.creature 未定义");
      return [];
    }
    const size = unit.creature.size;
    const spriteX = Math.floor(unit.x / 64);
    const spriteY = Math.floor(unit.y / 64);
    return this.getGridsBySize(spriteX,spriteY,size);
  
  }
  getGridsBySize(x: number, y: number, size: string) {
    // 构建范围数组
    const rangeArr = [];
    let range = 1; // 默认范围为0，可根据需要调整
    if (size === "big") {
      range = 2;
    }

    // 需要定义 spriteX 和 spriteY，假设 unit 有 x 和 y 属性
    const spriteX = x;
    const spriteY = y;

    for (let dx = 0; dx < range; dx++) {
      for (let dy = 0; dy < range; dy++) {
        rangeArr.push({ x: spriteX + dx, y: spriteY + dy });
      }
    }
    return rangeArr;
  }
  getUnitById(id: string): Unit | null {
    const map = golbalSetting.map;
    if (!map) return null;
    return (
      map.sprites.find((sprite: Unit) => sprite.id === parseInt(id)) || null
    );
  }
  constructor() {
    // 初始化逻辑
  }
}
