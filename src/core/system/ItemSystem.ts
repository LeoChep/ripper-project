import { ItemType } from "../item";
import type { ItemController } from "../item/base/ItemController";
import { Item } from "../item/Item";
import type { Unit } from "../units/Unit";

/**
 * 道具系统
 * 管理道具控制器的创建和使用
 */
export class ItemSystem {
  private static instance: ItemSystem | null = null;
  private itemControllerPack: Map<string, ItemController> = new Map();

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
      // 在这里添加更多道具控制器的映射
      // case "治疗药水":
      //   return import("../item/consumables/HealingPotion/HealingPotionController").then(
      //     (module) => module.HealingPotionController
      //   );
      default:
        return Promise.resolve(null);
    }
  }

  /**
   * 根据道具名称获取对应的 Item 类
   * 使用动态导入来按需加载道具类
   */
  getItemClass(itemName: string): Promise<typeof Item | null> {
    switch (itemName) {
      case "Holy_Water":
        // case "圣水":
        return import("../item/consumables/HolyWater/HolyWater").then(
          (module) => module.HolyWater,
        );
      // case "Light_Sword":
      // case "光明之剑":
      //   return import("../item/weapons/LightSword/LightSword").then(
      //     (module) => module.LightSword,
      //   );
      // 在这里添加更多道具类的映射
      // case "HealingPotion":
      // case "治疗药水":
      //   return import("../item/consumables/HealingPotion/HealingPotion").then(
      //     (module) => module.HealingPotion,
      //   );
      default:
        console.warn(`未找到道具类: ${itemName}`);
        return Promise.resolve(null);
    }
  }

  /**
   * 根据道具名称创建道具实例
   * @param itemName 道具名称
   * @returns 道具实例或 null
   */
  async createItem(itemName: string): Promise<Item | null> {
    const ItemClass = await this.getItemClass(itemName);
    if (!ItemClass) {
      console.warn(`无法创建道具: ${itemName}`);
      return null;
    }
    return new ItemClass({} as any);
  }

  /**
   * 清理控制器缓存
   */
  clearCache(): void {
    this.itemControllerPack.clear();
  }
}
