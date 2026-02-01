import { CharCombatAttackController } from "@/core/controller/CharacterCombatAttackController";
import type { HolyWater } from "./HolyWater";
import { golbalSetting } from "@/core/golbalSetting";
import { tileSize } from "@/core/envSetting";
import { generateWays } from "@/core/utils/PathfinderUtil";
import { UnitSystem } from "@/core/system/UnitSystem";
import { MessageTipSystem } from "@/core/system/MessageTipSystem";
import { BasicAttackSelector } from "@/core/selector/BasicAttackSelector";
import type { Unit } from "@/core/units/Unit";
import type { Item } from "../../Item";
import { ItemController } from "../../base/ItemController";

/**
 * 圣水控制器
 * 继承攻击控制器，复用范围选择逻辑
 */
export class HolyWaterController extends ItemController {
  item: HolyWater | null = null;
  user: Unit | null = null;
  target: Unit | null = null;

  /**
   * 设置道具实例
   */
  setItem(item: Item): void {
    this.item = item as HolyWater;
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
      console.warn("需要在战斗中使用圣水");
      return false;
    }

    if (this.item.stackCount <= 0) {
      console.warn("圣水已用完");
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
   * 使用圣水
   */
  async use(): Promise<any> {
    console.log("使用圣水逻辑开始");
    if (!this.preFix()) {
      console.warn("无法使用圣水");
      return { cancel: true };
    }

    // 选择目标
    const selector = BasicAttackSelector.getInstance().selectBasic({
      unit: this.user!,
      range: 3, // 圣水使用范围
      color: "red",
    });
    const result = await selector.promise;
    if (result.cancel) {
      console.warn("取消使用圣水");
      return { cancel: true };
    }

    const holyWater = this.item as HolyWater;

    if (this.target) {
      // 对目标造成伤害
      const targetCreature = this.target.creature;
      const creatureType = targetCreature?.type;

      if (holyWater.isUndeadTarget(creatureType)) {
        const damage = holyWater.getDamage();
        console.log(
          `${this.user!.creature?.name} 对 ${targetCreature?.name} 使用圣水，造成 ${damage} 点神圣伤害`,
        );

        if (targetCreature) {
          targetCreature.hp = Math.max(0, targetCreature.hp - damage);
          console.log(
            `${targetCreature.name} 剩余生命值: ${targetCreature.hp}`,
          );
        }
      } else {
        console.log(`圣水对 ${targetCreature?.name} 没有效果（非不死生物）`);
      }
    } else {
      console.log(`${this.user!.creature?.name} 将圣水洒在地面上`);
    }

    // 检查是否用完

    // 清理

    return { cancel: false };
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
