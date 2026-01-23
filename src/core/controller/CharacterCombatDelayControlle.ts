import * as PIXI from "pixi.js";
import { Unit } from "../units/Unit";
import * as UnitMoveSystem from "../system/UnitMoveSystem";

import { generateWays } from "../utils/PathfinderUtil";
import { playerSelectMovement } from "../action/UnitMove";
import { useInitiativeStore } from "@/stores/initiativeStore";
import * as envSetting from "../envSetting";
import { golbalSetting } from "../golbalSetting";
import type { WalkStateMachine } from "../stateMachine/WalkStateMachine";
import * as InitSystem from "@/core/system/InitiativeSystem";
import { UnitSystem } from "../system/UnitSystem";
export class CharacterCombatDelayControlle {
  public static isUse: boolean = false;

  selectedCharacter: Unit | null = null;
  public static instense = null as CharacterCombatDelayControlle | null;
  resolve = (_: any): any => {};
  graphics: PIXI.Graphics | null = null;
  public static getInstence() {
    if (!this.instense) {
      this.instense = new CharacterCombatDelayControlle();
    }
    return this.instense;
  }
  constructor() {
    // 初始化逻辑
  }
  delaySelect = () => {
    console.log("delaySSSS");
    const unit = this.selectedCharacter;
    if (unit === null) {
      return Promise.resolve({});
    }

    let resolveCallback: (arg0: any) => void = () => {};
    const promise = new Promise<any>((resolve) => {
      resolveCallback = resolve;
    });
    this.resolve = resolveCallback;
    // 外部调用的 removeFunction，用于其他控制器切换时清理
    this.removeFunction = (info?: any) => {
      console.log("step removeFunction called with:", info);

      // 如果 info 有 from 属性，说明是从其他控制器传来的，直接传递
      if (info?.from) {
        resolveCallback(info);
      } else {
        resolveCallback({ cancel: true });
      }
    };
    promise.then((result) => {
      // 调用delay方法

      InitSystem.delay(result.unitId, result.delayToNumber);
      const idStr = result.unitId.toString();
      const unit = UnitSystem.getInstance().getUnitById(idStr);
      if (unit) InitSystem.endTurn(unit, true);
    });
    return promise;
  };
  removeFunction = (args?: any) => {};
  // 添加你的方法和属性
}
