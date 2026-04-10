import { Item } from "./Item";
import { ItemRegistry } from "./ItemRegistry";
import type { ItemOptions } from "./ItemInterface";

/**
 * 物品工厂类
 * 负责创建物品实例，支持基于注册表的物品创建
 */
export class ItemFactory {
  private static instance: ItemFactory | null = null;
  private registry: ItemRegistry;

  private constructor() {
    this.registry = ItemRegistry.getInstance();
  }

  /**
   * 获取工厂单例
   */
  static getInstance(): ItemFactory {
    if (!ItemFactory.instance) {
      ItemFactory.instance = new ItemFactory();
    }
    return ItemFactory.instance;
  }

  /**
   * 根据选项创建道具
   * 如果 options.basedItem 指定了基类物品标识，会使用对应的基类创建
   * 否则使用 Item 类创建
   * @param options 道具选项
   * @returns 道具实例
   */
  create(options: ItemOptions): Item {
    return this.createFromOptions(options);
  }

  /**
   * 根据选项创建道具（支持 basedItem 字段）
   * @param options 物品选项
   * @returns 物品实例
   */
  createFromOptions(options: ItemOptions): Item {
    return this.registry.createFromOptions(options);
  }

  /**
   * 根据基类物品标识创建道具
   * @param basedItem 基类物品标识
   * @param options 额外的道具选项（会覆盖默认值）
   * @returns 道具实例，如果未找到对应的类则抛出错误
   * @throws Error 如果未找到对应的基类物品
   */
  createFrom(basedItem: string, options?: Partial<ItemOptions>): Item {
    const item = this.registry.createItem(basedItem, options);
    if (!item) {
      throw new Error(`未找到基类物品: ${basedItem}`);
    }
    return item;
  }

  /**
   * 根据基类物品标识创建道具（安全版本，返回 null）
   * @param basedItem 基类物品标识
   * @param options 额外的道具选项（会覆盖默认值）
   * @returns 道具实例，如果未找到对应的类则返回 null
   */
  createFromSafe(
    basedItem: string,
    options?: Partial<ItemOptions>
  ): Item | null {
    return this.registry.createItem(basedItem, options);
  }

  /**
   * 批量创建道具
   * @param items 道具选项数组
   * @returns 道具实例数组
   */
  createBatch(items: ItemOptions[]): Item[] {
    return items.map((options) => this.create(options));
  }

  /**
   * 获取注册表实例（用于高级操作）
   */
  getRegistry(): ItemRegistry {
    return this.registry;
  }

  /**
   * 检查物品是否已注册
   * @param key 物品标识
   */
  isRegistered(key: string): boolean {
    return this.registry.has(key);
  }

  /**
   * 获取所有已注册的物品标识
   */
  getRegisteredKeys(): string[] {
    return this.registry.getRegisteredKeys();
  }
}
