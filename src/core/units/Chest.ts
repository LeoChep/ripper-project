import * as PIXI from "pixi.js";
import { ItemSystem } from "../item";
import { ChestSystem } from "../system/ChestSystem";
import { tileSize } from "../envSetting";

export class Chest {
  public id: number;
  public isOpen: boolean = false;
  public chestSprite: PIXI.Container | null;

  public x: number;
  public y: number;
  public width: number;
  public height: number;

  // 宝箱内容物（可以存储物品ID或其他数据）
  public contents: any[] = [];

  constructor(
    id: number,
    x: number,
    y: number,
    width: number = tileSize,
    height: number = tileSize,
  ) {
    this.id = id;
    this.chestSprite = null;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    console.log("Chest created at:", x, y, "id:", id);
  }

  /**
   * 打开宝箱
   */
  open = () => {
    if (!this.isOpen) {
      this.isOpen = true;
      // 这里可以添加打开动画或其他逻辑
   
    }
    return this.contents;
  };

  /**
   * 清空宝箱内容
   */
  clear() {
    this.contents = [];
  }
}

/**
 * 从 Tiled 地图的 box 对象创建宝箱实例
 * @param obj Tiled 地图中的 box 对象
 * @returns Chest 实例
 */
export async function createChestFromBoxObj(obj: any): Promise<Chest> {
  const x = obj.x;
  // Tiled 中带 gid 的对象 y 坐标是底部位置，需要减去高度转换为顶部位置
  const height = obj.height || tileSize;
  const y = obj.y - height;
  const width = obj.width || tileSize;

  const chest = new Chest(obj.id, x, y, width, height);

  // 解析自定义属性
  if (obj.properties) {
    obj.properties.forEach(async (prop: any) => {
      switch (prop.name) {
        case "isOpen":
          chest.isOpen = prop.value === true;
          break;
        case "contents":
          // 如果有预设的内容物，可以在这里解析
          // 假设 contents 是一个 JSON 字符串
          try {
            console.log("Parsing chest contents property:", prop);
            if (typeof prop.value === "string") {
              const contensStr = prop.value as String;
              console.log("Parsing chest contents1:", contensStr);
              const contens = contensStr.split("\n");
              const chestSystem = ChestSystem.getInstance();
              for (const itemStr of contens) {
                await chestSystem.addItemByName(chest, itemStr.trim());
              }
              console.log("Parsed chest contents item:", chest);
            }
          } catch (e) {
            console.warn("Failed to parse chest contents:", e);
          }
          break;
      }
    });
  }

  return chest;
}
