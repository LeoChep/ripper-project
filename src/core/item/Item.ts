import { ItemSystem } from "../system/ItemSystem";
import { UuidUtil } from "../utils/UuidUtil";
import type { ItemInterface, ItemOptions } from "./ItemInterface";
import { ItemType, ItemRarity } from "./ItemInterface";

/**
 * 道具类
 */
export class Item implements ItemInterface {
  uid: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;
  icon?: string;
  maxStack: number;
  stackCount: number;
  weight: number;
  value: number;
  canUse: boolean;
  canEquip: boolean;
  properties?: Record<string, any>;

  constructor(options: ItemOptions) {
    this.uid = options.uid ?? UuidUtil.generate();
    this.name = options.name;
    this.description = options.description;
    this.type = options.type;
    this.rarity = options.rarity ?? ItemRarity.COMMON;
    this.icon = options.icon;
    this.maxStack = options.maxStack ?? 1;
    this.stackCount = options.stackCount ?? 1;
    this.weight = options.weight ?? 0;
    this.value = options.value ?? 0;
    this.canUse = options.canUse ?? false;
    this.canEquip = options.canEquip ?? false;
    this.properties = options.properties;
  }

  /**
   * 增加堆叠数量
   * @param amount 增加的数量
   * @returns 是否成功
   */
  addStack(amount: number): boolean {
    if (this.stackCount + amount > this.maxStack) {
      return false;
    }
    this.stackCount += amount;
    return true;
  }

  /**
   * 减少堆叠数量
   * @param amount 减少的数量
   * @returns 是否成功
   */
  removeStack(amount: number): boolean {
    if (this.stackCount - amount < 0) {
      return false;
    }
    this.stackCount -= amount;
    return true;
  }

  /**
   * 检查是否可以堆叠到另一个道具
   * @param other 另一个道具
   * @returns 是否可以堆叠
   */
  canStackWith(other: Item): boolean {
    return (
      this.name === other.name &&
      this.type === other.type &&
      this.rarity === other.rarity &&
      this.maxStack > 1 &&
      other.stackCount < other.maxStack
    );
  }

  /**
   * 克隆道具
   * @returns 新的道具实例
   */
  clone(): Item {
    return new Item({
      uid: UuidUtil.generate(),
      name: this.name,
      description: this.description,
      type: this.type,
      rarity: this.rarity,
      icon: this.icon,
      maxStack: this.maxStack,
      stackCount: this.stackCount,
      weight: this.weight,
      value: this.value,
      canUse: this.canUse,
      canEquip: this.canEquip,
      properties: this.properties ? { ...this.properties } : undefined,
    });
  }

  /**
   * 使用道具（自动调用对应的控制器）
   * @param user 使用者
   * @param target 目标（可选）
   * @returns Promise，完成后resolve
   */
  async use(user: any, target?: any): Promise<void> {
    if (!this.canUse) {
      console.warn(`道具 ${this.name} 不能使用`);
      return;
    }
    console.log(`使用道具: ${this.name}`);
    // 动态导入ItemSystem以避免循环依赖
    // const { ItemSystem } = await import("../system/ItemSystem");
    const itemSystem = ItemSystem.getInstance();
    await itemSystem.useItem(this, user, target);
  }

  /**
   * 获取道具的总重量
   * @returns 总重量
   */
  getTotalWeight(): number {
    return this.weight * this.stackCount;
  }

  /**
   * 获取道具的总价值
   * @returns 总价值
   */
  getTotalValue(): number {
    return this.value * this.stackCount;
  }

  /**
   * 获取道具的显示信息
   * @returns 显示信息字符串
   */
  getDisplayInfo(): string {
    return `${this.name} (${this.stackCount}/${this.maxStack}) - ${this.description}`;
  }
}
