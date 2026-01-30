import { ModifierSystem } from './../system/ModifierSystem';
import * as PIXI from "pixi.js";
import { Unit } from "../units/Unit";
import { MessageTipSystem } from "../system/MessageTipSystem";
import * as UnitMoveSystem from "../system/UnitMoveSystem";

import { generateWays } from "../utils/PathfinderUtil";

import { playerSelectMovement } from "../action/UnitMove";
import { useInitiativeStore } from "@/stores/initiativeStore";
import * as envSetting from "../envSetting";
import { golbalSetting } from "../golbalSetting";
import type { WalkStateMachine } from "../stateMachine/WalkStateMachine";
import { endTurn } from "../system/InitiativeSystem";
import { MoveSelector } from "../selector/MoveSeletor";
const tileSize = 64;

type Rlayer = {
  basicLayer: PIXI.IRenderLayer;
  spriteLayer: PIXI.IRenderLayer;
  lineLayer: PIXI.IRenderLayer;
  fogLayer: PIXI.IRenderLayer;
  selectLayer: PIXI.IRenderLayer;
  controllerLayer: PIXI.IRenderLayer;
};

export class CharCombatMoveController {
  public static isUse: boolean = false;

  selectedCharacter: Unit | null = null;
  public static instense = null as CharCombatMoveController | null;
  sizeGraphics: PIXI.Graphics | null = null;
  graphics: PIXI.Graphics | null = null;
  constructor() {
    // 初始化逻辑
  }
  moveSelect = async () => {
    console.log("moveSSSS");
    const unit = this.selectedCharacter;
    if (unit === null) {
      console.warn("没有选中单位，无法进行移动选择");
      return Promise.resolve({});
    }
    if (this.graphics) {
      this.removeFunction();
    }
    //显示可移动范围
    let range = ModifierSystem.getFianleValue(unit,'speed')
   
    const walkMachine = unit.stateMachinePack.getMachine(
      "walk"
    ) as WalkStateMachine;
    if (walkMachine.onDivideWalk) {
      if (walkMachine.leastDivideSpeed > 0) {
        range = walkMachine.leastDivideSpeed;
      }
    }

    const tileSize = 64;

    const spriteUnit = unit.animUnit;
    console.log("spriteUnits", unit);
    if (!spriteUnit) {
      return Promise.resolve({});
    }
    console.log(`动画精灵位置: (${spriteUnit.x}, ${spriteUnit.y})`);
    //
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
    // 绘制可移动范围
    let isCancel=false;
    const selector = MoveSelector.getInstance().selectBasic(
      path,
      unit,
      true,
      (gridx, gridy) => {
        if (!path[`${gridx},${gridy}`]) {
          return false;
        } else return true;
      },
      ()=>{
        isCancel=true;
      }
    );

    this.graphics = selector.graphics;
    this.removeFunction = selector.removeFunction;
    const result = await selector.promise;

    if (result.cancel !== true) {
      const selected = result.selected[0];
      if (!path[`${selected.x},${selected.y}`]) {
        return;
      }
      await playerSelectMovement(result.event, unit, path, result);
      if (
        unit.initiative &&
        typeof unit.initiative.moveActionNumber === "number"
      ) {
        unit.initiative.moveActionNumber = unit.initiative.moveActionNumber - 1;
        useInitiativeStore().updateActionNumbers(
          unit.initiative.standerActionNumber,
          unit.initiative.minorActionNumber,
          unit.initiative.moveActionNumber
        );
        console.log(`剩余移动次数: ${unit.initiative.moveActionNumber}`);
        if (result.least > 0) {
          walkMachine.leastDivideSpeed = result.least;
          walkMachine.onDivideWalk = true;
        } else {
          walkMachine.leastDivideSpeed = 0;
          walkMachine.onDivideWalk = false;
        }
      }
    } else if (isCancel) {
      const useConfirm = await MessageTipSystem.getInstance().confirm("是否结束回合？");
      if (!useConfirm) {
        
        return;
      }

      this.removeFunction = () => {};
      endTurn(unit);
    }
    return selector.promise;
  };
  removeFunction = (args?: any) => {};
  // 添加你的方法和属性
}
