import { Item } from "./Item";
import type { ItemOptions, ItemClassConstructor } from "./ItemInterface";
import { HolyWater } from "./consumables/HolyWater/HolyWater";
import { HealWater } from "./consumables/HealWater/HealWater";

/**
 * 物品注册表
 * 管理物品标识到物品类的映射关系
 */
export class ItemRegistry {
  private static instance: ItemRegistry | null = null;
  private itemClasses: Map<string, ItemClassConstructor> = new Map();

  private constructor() {
    this.registerDefaultItems();
  }

  static getInstance(): ItemRegistry {
    if (!ItemRegistry.instance) {
      ItemRegistry.instance = new ItemRegistry();
    }
    return ItemRegistry.instance;
  }

  /**
   * 注册默认物品
   */
  private registerDefaultItems(): void {
    this.register("HolyWater", HolyWater);
    this.register("HealWater", HealWater);
    // 在这里添加更多物品类的注册
    // this.register("IronSword", IronSword);
  }

  /**
   * 注册物品类
   * @param key 物品标识（如 "HolyWater"）
   * @param itemClass 物品类构造函数
   */
  register(key: string, itemClass: ItemClassConstructor): void {
    this.itemClasses.set(key, itemClass);
  }

  /**
   * 批量注册物品类
   */
  registerAll(items: Record<string, ItemClassConstructor>): void {
    Object.entries(items).forEach(([key, itemClass]) => {
      this.register(key, itemClass);
    });
  }

  /**
   * 根据物品标识获取物品类
   * @param key 物品标识
   * @returns 物品类构造函数，如果未找到返回 undefined
   */
  getItemClass(key: string): ItemClassConstructor | undefined {
    return this.itemClasses.get(key);
  }

  /**
   * 检查物品是否已注册
   */
  has(key: string): boolean {
    return this.itemClasses.has(key);
  }

  /**
   * 根据物品标识创建物品实例
   * @param key 物品标识
   * @param options 物品选项（会覆盖默认值）
   * @returns 物品实例，如果未找到对应的类则返回 null
   */
  createItem(key: string, options?: Partial<ItemOptions>): Item | null {
    const ItemClass = this.getItemClass(key);
    if (!ItemClass) {
      return null;
    }
    return new ItemClass(options);
  }

  /**
   * 根据选项创建物品（支持 basedItem 字段）
   * @param options 物品选项
   * @returns 物品实例
   */
  createFromOptions(options: ItemOptions): Item {
    // 如果指定了 basedItem，尝试使用对应的基类创建
    if (options.basedItem) {
      const item = this.createItem(options.basedItem, options);
      if (item) {
        return item;
      }
      console.warn(
        `未找到基类物品: ${options.basedItem}，使用默认 Item 类创建`,
      );
    }

    // 使用默认 Item 类创建
    return new Item(options);
  }

  /**
   * 获取所有已注册的物品标识
   */
  getRegisteredKeys(): string[] {
    return Array.from(this.itemClasses.keys());
  }

  /**
   * 清空注册表（主要用于测试）
   */
  clear(): void {
    this.itemClasses.clear();
  }

  /**
   * 重新注册默认物品
   */
  reset(): void {
    this.clear();
    this.registerDefaultItems();
  }
}
