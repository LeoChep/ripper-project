import { ItemType, type ItemOptions, type ItemClassConstructor } from "../item";
import type { ItemController } from "../item/base/ItemController";
import { Item } from "../item/Item";
import { ItemRegistry } from "../item/ItemRegistry";
import type { Unit } from "../units/Unit";

/**
 * 道具系统
 * 管理道具控制器的创建和使用
 */
export class ItemSystem {
  private static instance: ItemSystem | null = null;
  private itemControllerPack: Map<string, ItemController> = new Map();
  /** 背包UI更新回调函数 */
  private updateInventoryFunc: (() => void) | null = null;

  static getInstance(): ItemSystem {
    if (!ItemSystem.instance) {
      ItemSystem.instance = new ItemSystem();
    }
    return ItemSystem.instance;
  }

  /**
   * 添加控制器到缓存
   */
  private async addController(
    itemName: string,
  ): Promise<ItemController | null> {
    const ControllerClass = await this.getItemControllerClass(itemName);
    if (!ControllerClass) {
      console.warn(`ItemController class not found for: ${itemName}`);
      return null;
    }

    const controller = new ControllerClass() as ItemController;
    this.itemControllerPack.set(itemName, controller);
    return controller;
  }

  /**
   * 获取道具控制器
   */
  async getController(itemName: string): Promise<ItemController | null> {
    let controller = this.itemControllerPack.get(itemName);
    if (!controller) {
      const newController = await this.addController(itemName);
      return newController;
    }
    return controller ?? null;
  }

  /**
   * 使用道具
   * @param item 要使用的道具
   * @param user 使用者
   * @param target 目标（可选）
   */
  async useItem(item: Item, user: Unit, target?: Unit): Promise<void> {
    if (!item.canUse) {
      console.warn(`道具 ${item.name} 无法使用`);
      return;
    }

    const controller = await this.getController(item.name);
    console.log("使用道具控制器:", controller);
    if (!controller) {
      console.warn(`道具 ${item.name} 没有对应的控制器`);
      return;
    }

    // 设置控制器的参数
    controller.setItem(item);
    controller.setUser(user);
    if (target) {
      controller.setTarget(target);
    }
    console.log(
      "道具控制器参数已设置:",
      {
        item: item,
        user: user,
        target: target,
      },
      controller,
    );

    // 执行使用逻辑
    const useResult = await controller.use();
    console.log("道具使用结果:", useResult);
    if (
      item.type === ItemType.CONSUMABLE &&
      useResult &&
      useResult.cancel !== true
    ) {
      controller.consume();
    }
    controller.cleanup();
  }

  /**
   * 根据道具名称获取对应的控制器类
   * 使用动态导入来按需加载控制器
   */
  private getItemControllerClass(itemName: string): Promise<any> {
    switch (itemName) {
      case "圣水":
        return import("../item/consumables/HolyWater/HolyWaterController").then(
          (module) => module.HolyWaterController,
        );
      case "治疗药水":
        return import("../item/consumables/HealWater/HealWaterController").then(
          (module) => module.HealWaterController,
        );
      // 在这里添加更多道具控制器的映射
      default:
        return Promise.resolve(null);
    }
  }

  /**
   * 根据道具名称获取对应的 Item 类
   * 使用 ItemRegistry 来查找道具类
   * @deprecated 使用 ItemRegistry.getInstance().getItemClass() 代替
   */
  getItemClass(itemName: string): ItemClassConstructor | null {
    const ItemClass = ItemRegistry.getInstance().getItemClass(itemName);
    return ItemClass || null;
  }

  /**
   * 根据道具名称创建道具实例
   * 使用 ItemRegistry 来创建道具
   * @param itemName 道具名称
   * @param options 额外的道具选项
   * @returns 道具实例或 null
   */
  createItem(itemName: string, options?: Partial<ItemOptions>): Item | null {
    const item = ItemRegistry.getInstance().createItem(itemName, options);
    if (!item) {
      console.warn(`无法创建道具: ${itemName}`);
    }
    return item;
  }

  /**
   * 清理控制器缓存
   */
  clearCache(): void {
    this.itemControllerPack.clear();
  }

  /**
   * 设置背包UI更新回调函数
   * @param func 更新回调函数
   */
  setUpdateInventoryFunc(func: (() => void) | null): void {
    this.updateInventoryFunc = func;
  }

  /**
   * 触发背包UI更新
   * 在道具消耗后调用此方法通知UI刷新
   */
  updateInventory(): void {
    if (this.updateInventoryFunc) {
      this.updateInventoryFunc();
    }
  }
}
