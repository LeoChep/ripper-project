import type { Chest } from "../units/Chest";
import type { Item } from "../item/Item";
import { ItemSystem } from "./ItemSystem";
import { UnitSystem } from "./UnitSystem";

/**
 * 宝箱系统
 * 管理宝箱的内容、交互和状态
 */
export class ChestSystem {
  private static instance: ChestSystem | null = null;
  private chests: Map<number, Chest> = new Map();

  static getInstance(): ChestSystem {
    if (!ChestSystem.instance) {
      ChestSystem.instance = new ChestSystem();
    }
    return ChestSystem.instance;
  }

  /**
   * 注册宝箱到系统
   */
  registerChest(chest: Chest): void {
    this.chests.set(chest.id, chest);
    console.log(`宝箱已注册 ID: ${chest.id}, 总数: ${this.chests.size}`);
  }

  /**
   * 获取宝箱
   */
  getChest(id: number): Chest | undefined {
    return this.chests.get(id);
  }

  /**
   * 获取所有宝箱
   */
  getAllChests(): Chest[] {
    return Array.from(this.chests.values());
  }

  /**
   * 添加物品到宝箱
   * @param chest 目标宝箱
   * @param item 要添加的物品
   */
  addItem(chest: Chest, item: Item): void {
    chest.contents.push(item);
    console.log(`物品 ${item.name} 已添加到宝箱 ${chest.id}`);
  }

  /**
   * 根据物品名称添加物品到宝箱
   * @param chest 目标宝箱
   * @param itemName 物品名称
   */
  async addItemByName(chest: Chest, itemName: string): Promise<void> {
    const item = await ItemSystem.getInstance().createItem(itemName);
    if (item) {
      this.addItem(chest, item);
    } else {
      console.warn(`无法创建物品: ${itemName}`);
    }
  }

  /**
   * 批量添加物品到宝箱
   * @param chest 目标宝箱
   * @param itemNames 物品名称数组
   */
  async addItemsByNames(chest: Chest, itemNames: string[]): Promise<void> {
    const promises = itemNames.map((name) => this.addItemByName(chest, name.trim()));
    await Promise.all(promises);
  }

  /**
   * 从宝箱移除物品
   * @param chest 目标宝箱
   * @param item 要移除的物品
   */
  removeItem(chest: Chest, item: Item): boolean {
    const index = chest.contents.indexOf(item);
    if (index !== -1) {
      chest.contents.splice(index, 1);
      console.log(`物品 ${item.name} 已从宝箱 ${chest.id} 移除`);
      return true;
    }
    return false;
  }

  /**
   * 将物品从宝箱转移到单位背包
   * @param chest 源宝箱
   * @param item 要转移的物品
   * @param unit 目标单位
   * @returns 是否成功转移
   */
  transferItemToUnit(chest: Chest, item: Item, unit: any): boolean {
    const index = chest.contents.indexOf(item);
    if (index === -1) {
      console.warn(`物品 ${item.name} 不在宝箱 ${chest.id} 中`);
      return false;
    }

    // 从宝箱中移除
    chest.contents.splice(index, 1);
    
    // 添加到单位背包
    const success = unit.addItem(item);
    if (success) {
      console.log(`物品 ${item.name} 已从宝箱 ${chest.id} 转移到 ${unit.name}`);
      return true;
    } else {
      // 如果添加失败，放回宝箱
      chest.contents.push(item);
      console.warn(`无法将物品 ${item.name} 添加到 ${unit.name} 的背包，已放回宝箱`);
      return false;
    }
  }

  /**
   * 将宝箱中所有物品转移到单位背包
   * @param chest 源宝箱
   * @param unit 目标单位
   * @returns 成功转移的物品数量
   */
  transferAllItemsToUnit(chest: Chest, unit: any): number {
    let successCount = 0;
    const itemsToTransfer = [...chest.contents]; // 创建副本以避免在迭代时修改数组

    for (const item of itemsToTransfer) {
      if (this.transferItemToUnit(chest, item, unit)) {
        successCount++;
      }
    }

    console.log(`成功从宝箱 ${chest.id} 转移 ${successCount}/${itemsToTransfer.length} 个物品到 ${unit.name}`);
    return successCount;
  }

  /**
   * 根据 ID 将物品从宝箱转移到单位背包
   * @param chestId 宝箱 ID
   * @param itemUid 物品 UID
   * @param unitId 单位 ID
   * @returns 是否成功转移
   */
  async transferItemByIds(chestId: number, itemUid: string, unitId: number): Promise<boolean> {
    // 获取宝箱
    const chest = this.getChest(chestId);
    if (!chest) {
      console.warn(`未找到宝箱 ID: ${chestId}`);
      return false;
    }

    // 获取物品
    const item = chest.contents.find(i => i.uid === itemUid);
    if (!item) {
      console.warn(`宝箱 ${chestId} 中未找到物品 UID: ${itemUid}`);
      return false;
    }

    // 获取单位 - 从 UnitSystem 或 golbalSetting.map 中查找
 
    const unit = UnitSystem.getInstance().getUnitById(unitId.toString());
    if (!unit) {
      console.warn(`未找到单位 ID: ${unitId}`);
      return false;
    }

    // 执行转移
    return this.transferItemToUnit(chest, item, unit);
  }

  /**
   * 根据 ID 将宝箱中所有物品转移到单位背包
   * @param chestId 宝箱 ID
   * @param unitId 单位 ID
   * @returns 成功转移的物品数量，失败返回 -1
   */
  async transferAllItemsByIds(chestId: number, unitId: number): Promise<number> {
    // 获取宝箱
    const chest = this.getChest(chestId);
    if (!chest) {
      console.warn(`未找到宝箱 ID: ${chestId}`);
      return -1;
    }

    // 获取单位
  
    const unit = UnitSystem.getInstance().getUnitById(unitId.toString());
    if (!unit) {
      console.warn(`未找到单位 ID: ${unitId}`);
      return -1;
    }

    // 执行转移
    return this.transferAllItemsToUnit(chest, unit);
  }

  /**
   * 清空宝箱内容
   * @param chest 目标宝箱
   */
  clearChest(chest: Chest): void {
    chest.contents = [];
    console.log(`宝箱 ${chest.id} 已清空`);
  }

  /**
   * 打开宝箱
   * @param chest 目标宝箱
   * @returns 宝箱内的物品数组
   */
  openChest(chest: Chest): Item[] {
    if (!chest.isOpen) {
      chest.isOpen = true;
      console.log(`宝箱 ${chest.id} 已打开`);
    }
    return chest.contents;
  }

  /**
   * 获取宝箱内容的摘要信息
   * @param chest 目标宝箱
   */
  getChestSummary(chest: Chest): { itemCount: number; itemNames: string[] } {
    return {
      itemCount: chest.contents.length,
      itemNames: chest.contents.map((item) => item.name || "未知物品"),
    };
  }

  /**
   * 清除所有宝箱
   */
  clearAll(): void {
    this.chests.clear();
    console.log("所有宝箱已清除");
  }
}
