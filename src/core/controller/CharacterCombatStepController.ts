import * as PIXI from "pixi.js";
import { Unit } from "../units/Unit";
import * as UnitMoveSystem from "../system/UnitMoveSystem";

import { generateWays } from "../utils/PathfinderUtil";
import { playerSelectMovement } from "../action/UnitMove";
import { useInitiativeStore } from "@/stores/initiativeStore";
import { ControllerCancelHandler, CancelReason } from "../utils/ControllerCancelHandler";
import { ControllerHelper } from "./ControllerHelper";
import { ShiftSelector } from "../selector/ShiftSelector";
import { tileSize } from "../envSetting";
import type { WalkStateMachine } from "../stateMachine/WalkStateMachine";
import { golbalSetting } from "../golbalSetting";
import { MoveSelector } from "../selector/MoveSeletor";

export class CharCombatStepController {
  public static isUse: boolean = false;

  selectedCharacter: Unit | null = null;
  public static instense = null as CharCombatStepController | null;

  graphics: PIXI.Graphics | null = null;
  private isRegistered: boolean = false; // 标记是否已注册

  constructor() {
    // 初始化逻辑
  }

  moveSelect = () => {
    console.log("stepSSSS");
    const unit = this.selectedCharacter;
    if (unit === null) {
      console.warn("没有选中单位，无法进行移动选择");
      return Promise.resolve({});
    }

    // 显示可移动范围
    let range = 1;
    const walkMachine = unit.stateMachinePack.getMachine(
      "walk",
    ) as WalkStateMachine;

    const spriteUnit = unit.animUnit;
    console.log("spriteUnits", unit);
    if (!spriteUnit) {
      return Promise.resolve({});
    }
    console.log(`动画精灵位置: (${spriteUnit.x}, ${spriteUnit.y})`);

    const centerX = spriteUnit.x;
    const centerY = spriteUnit.y;
    const startX = Math.floor(centerX / tileSize);
    const startY = Math.floor(centerY / tileSize);

    // path 是一个以 "x,y" 为 key 的对象，记录每个格子的前驱节点
    const path = generateWays({
      start: { x: startX, y: startY },
      range: range,
      checkFunction: (x: number, y: number, preX: number, preY: number) => {
        return UnitMoveSystem.checkPassiable(
          unit,
          preX * tileSize,
          preY * tileSize,
          x * tileSize,
          y * tileSize,
          golbalSetting.map
        );
      },
    });

    // 使用 ShiftSelector 绘制格子
    const selector = MoveSelector.getInstance().selectBasic(
      path,
      unit,

      true, // canCancel
      (gridx, gridy) => {
        if (!path[`${gridx},${gridy}`]) {
          return false;
        }
        return true;
      }
    );

    this.graphics = selector.graphics;

    // 使用 ControllerHelper 创建标准的 removeFunction 并注册控制器
    this.removeFunction = ControllerHelper.createRemoveFunction(
      "stepController",
      this.graphics,
      () => {
        this.graphics = null;
      },
      () => selector.cleanup() // 选择器完整清理
    );

    // 只在第一次注册控制器，避免重复注册
    if (!this.isRegistered) {
      ControllerHelper.registerController("stepController", this);
      this.isRegistered = true;
    }

    const resultPromise = selector.promise;

    // 处理选择结果
    resultPromise!.then((result) => {
      if (result.cancel === true) {
        return;
      }

      const selected = result.selected[0];
      if (!path[`${selected.x},${selected.y}`]) {
        return;
      }

      // 执行移动
      const walktype = (
        unit.stateMachinePack.getMachine("walk") as WalkStateMachine
      ).walkType;
      (unit.stateMachinePack.getMachine("walk") as WalkStateMachine).walkType =
        "step";

      playerSelectMovement(result.event || {}, unit, path, result)?.then(() => {
        console.log("resolveCallback", result);
        (
          unit.stateMachinePack.getMachine("walk") as WalkStateMachine
        ).walkType = walktype;
        setTimeout(() => {
          // CharacterController.onAnim = false;
        }, 50);
      });

      if (
        unit.initiative &&
        typeof unit.initiative.moveActionNumber === "number"
      ) {
        unit.initiative.moveActionNumber = unit.initiative.moveActionNumber - 1;

        console.log(`剩余移动次数: ${unit.initiative.moveActionNumber}`);
        if (result.least > 0) {
          walkMachine.leastDivideSpeed = result.least;
          walkMachine.onDivideWalk = true;
        } else {
          walkMachine.leastDivideSpeed = 0;
          walkMachine.onDivideWalk = false;
        }
      }
    });

    return resultPromise;
  };

  removeFunction = (args?: any) => {};
}
