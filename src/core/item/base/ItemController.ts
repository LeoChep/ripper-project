import type { Unit } from "@/core/units/Unit";
import type { Item } from "../Item";

/**
 * 道具控制器抽象基类
 * 所有具体道具控制器都应继承此类
 */
export abstract class ItemController {
  static isUse: boolean = false;
  static instance: ItemController | null = null;

  itemName: string = "";
  item: Item | null = null;
  user: Unit | null = null;
  target: Unit | null = null;

  /**
   * 检查是否可以使用该道具
   */
  abstract canUse(): boolean;

  /**
   * 使用道具的主逻辑
   */
  abstract use(): Promise<void>;

  /**
   * 道具使用前的准备工作
   * @returns 是否可以继续使用
   */
  preFix(): boolean {
    if (this.user === null) {
      console.warn("没有使用者，无法使用道具");
      return false;
    }
    if (this.item === null) {
      console.warn("没有道具实例，无法使用");
      return false;
    }
    return this.canUse();
  }

  /**
   * 消耗道具（减少堆叠数）
   */
  consume(): void {
    if (this.item) {
      this.item.removeStack(1);
    }
    if (this.item!.stackCount <= 0) {
        if (this.item)
        this.user?.removeItem(this.item?.uid);
    }
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.user = null;
    this.target = null;
    this.item = null;
  }

  /**
   * 设置使用者
   */
  setUser(user: Unit): void {
    this.user = user;
  }

  /**
   * 设置目标
   */
  setTarget(target: Unit | null): void {
    this.target = target;
  }

  /**
   * 设置道具实例
   */
  setItem(item: Item): void {
    this.item = item;
  }
}
