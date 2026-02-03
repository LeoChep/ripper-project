import { Chest } from "./Chest";
import { ItemSerializer } from "../item/ItemSerializer";

/**
 * 宝箱序列化器
 * 用于保存和恢复宝箱状态
 */
export class ChestSerializer {
  /**
   * 序列化单个宝箱
   */
  static serialize(chest: Chest): any {
    return {
      id: chest.id,
      isOpen: chest.isOpen,
      x: chest.x,
      y: chest.y,
      width: chest.width,
      height: chest.height,
      contents: ItemSerializer.serializeArray(chest.contents),
    };
  }

  /**
   * 序列化宝箱数组
   */
  static serializeArray(chests: Chest[]): any[] {
    return chests.map((chest) => this.serialize(chest));
  }

  /**
   * 反序列化单个宝箱
   */
  static deserialize(data: any): Chest {
    const chest = new Chest(data.id, data.x, data.y, data.width, data.height);
    chest.isOpen = data.isOpen || false;
    
    // 反序列化物品数组
    if (data.contents && Array.isArray(data.contents)) {
      chest.contents = ItemSerializer.deserializeArray(data.contents);
    }
    
    return chest;
  }

  /**
   * 反序列化宝箱数组
   */
  static deserializeArray(dataArray: any[]): Chest[] {
    if (!Array.isArray(dataArray)) {
      return [];
    }
    return dataArray.map((data) => this.deserialize(data));
  }
}
