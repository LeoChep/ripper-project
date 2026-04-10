import { golbalSetting } from "@/core/golbalSetting";
import { UnitSystem } from "@/core/system/UnitSystem";
import { MessageTipSystem } from "@/core/system/MessageTipSystem";
import { BasicAttackSelector } from "@/core/selector/BasicAttackSelector";
import type { Unit } from "@/core/units/Unit";
import type { Item } from "../../Item";
import type { HealWater } from "./HealWater";
import { ItemController } from "../../base/ItemController";

/**
 * 治疗药水控制器
 * 支持对周围1格范围内的盟友使用，恢复生命值
 */
export class HealWaterController extends ItemController {
  item: HealWater | null = null;
  user: Unit | null = null;
  target: Unit | null = null;

  /**
   * 设置道具实例
   */
  setItem(item: Item): void {
    this.item = item as HealWater;
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
   * 检查是否可以使用
   */
  canUse(): boolean {
    if (!this.user || !this.item) {
      return false;
    }

    const map = golbalSetting.map;
    if (!map) {
      console.warn("需要在战斗中使用治疗药水");
      return false;
    }

    if (this.item.stackCount <= 0) {
      console.warn("治疗药水已用完");
      return false;
    }

    return true;
  }

  /**
   * 使用前检查
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
   * 使用治疗药水
   */
  async use(): Promise<any> {
    console.log("使用治疗药水逻辑开始");
    if (!this.preFix()) {
      console.warn("无法使用治疗药水");
      return { cancel: true };
    }

    const healWater = this.item as HealWater;
    const range = healWater.getRange();
    const userUnit = this.user!;

    // 选择目标
    const selector = BasicAttackSelector.getInstance().selectBasic({
      unit: userUnit,
      range: range, // 使用范围（默认1格）
      color: "green", // 绿色表示治疗
      selectNum: 1,
    });

    const result = await selector.promise;
    if (result.cancel) {
      console.warn("取消使用治疗药水");
      return { cancel: true };
    }

    // 从选中的格子获取目标单位
    let targetUnit: Unit | null = null;
    if (result.selected && result.selected.length > 0) {
      const selectedGrid = result.selected[0];
      targetUnit = UnitSystem.getInstance().findUnitByGridxy(
        selectedGrid.x,
        selectedGrid.y
      );
    }

    if (targetUnit) {
      this.target = targetUnit;
      const healAmount = healWater.getHealAmount();
      this.applyHeal(targetUnit, healAmount);
    } else {
      // 如果没有选中单位，对自己使用
      this.applyHeal(userUnit, healWater.getHealAmount());
    }

    return { cancel: false };
  }

  /**
   * 应用治疗效果
   */
  private applyHeal(target: Unit, healAmount: number): void {
    const creature = target.creature;
    if (!creature) {
      console.warn("目标没有生物数据，无法治疗");
      return;
    }

    const oldHp = creature.hp;
    creature.hp = Math.min(creature.hp + healAmount, creature.maxHp);
    const actualHeal = creature.hp - oldHp;

    console.log(
      `${this.user!.creature?.name} 对 ${creature.name} 使用治疗药水，恢复了 ${actualHeal} 点生命值`,
    );

    // 显示治疗消息
    MessageTipSystem.getInstance().setMessageQuickly(
      `${creature.name} 恢复了 ${actualHeal} 点生命值`,
    );

    // 如果目标已经满血，提示
    if (oldHp === creature.hp) {
      MessageTipSystem.getInstance().setMessageQuickly(
        `${creature.name} 的生命值已满`,
      );
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
}
