import * as PIXI from "pixi.js";
import { Unit } from "../units/Unit";
import * as UnitMoveSystem from "../system/UnitMoveSystem";

import { generateWays } from "../utils/PathfinderUtil";

import { playerSelectMovement } from "../action/UnitMove";
import { useInitiativeStore } from "@/stores/initiativeStore";
import * as envSetting from "../envSetting";
import { golbalSetting } from "../golbalSetting";
import type { WalkStateMachine } from "../stateMachine/WalkStateMachine";
import { endTurn } from "../system/InitiativeSystem";
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
  moveSelect = () => {
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
    let range = unit.creature?.speed ?? 0;
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
    const graphics = drawGraphics(path, unit);
    if (!graphics) {
      return Promise.resolve({});
    }

    this.graphics = graphics;

    this.graphics?.on("pointermove", (e) => {
      if (!golbalSetting.rootContainer) {
        return;
      }
      const x = e.data.global.x - golbalSetting.rootContainer?.x;
      const y = e.data.global.y - golbalSetting.rootContainer?.y;
      const targetXY = getXY(x, y);
      // console.log("pointermove", targetXY);
      if (this.sizeGraphics?.parent) {
        this.sizeGraphics.clear();
        this.sizeGraphics.parent.removeChild(this.sizeGraphics);
        this.sizeGraphics.destroy();
      }
      if (path[`${targetXY.x},${targetXY.y}`]) {
        this.sizeGraphics = drawSizeGrids(targetXY, unit, "blue");
      }else{
         this.sizeGraphics = drawSizeGrids(targetXY, unit, "red");
      }
    });
    // 点击其他地方移除移动范围
    let resolveCallback: (arg0: any) => void = () => {};
    const promise = new Promise<any>((resolve) => {
      resolveCallback = resolve;
    });

    const removeGraphics = () => {
      if (graphics.parent) {
        graphics.parent.removeChild(graphics);
      }
      if (this.sizeGraphics?.parent) {
        // this.sizeGraphics.clear();
        this.sizeGraphics.parent.removeChild(this.sizeGraphics);
        // this.sizeGraphics.destroy();
      }
    };
    let cancel = false;
    this.removeFunction = () => {
      removeGraphics();
      resolveCallback({});
      this.removeFunction = () => {};
    };
    graphics.on("pointerup", (e) => {
      console.log("pointerup");
      e.stopPropagation();
      const targetXy = getXY(
        e.data.global.x - (golbalSetting.rootContainer?.x ?? 0),
        e.data.global.y - (golbalSetting.rootContainer?.y ?? 0)
      )
      if (!path[`${targetXy.x},${targetXy.y}`]) {
        return
      }
      if (cancel) {
        cancel = false;
        return;
      }
      removeGraphics();
      const result = {} as any;
      result.cancel = false;
      // CharacterController.onAnim = true;
      
      playerSelectMovement(e, unit, path, result)?.then(() => {
        console.log("resolveCallback", result);
        setTimeout(() => {
          // CharacterController.onAnim = false;
        }, 50);
        resolveCallback(result);
      });
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
    });
    graphics.on("rightdown", (e) => {
      console.log("rightdown");
      e.stopPropagation();
      cancel = true;
      const useConfirm = confirm("是否结束回合？");
      if (!useConfirm) {
        return;
      }
      removeGraphics();
      cancel = true;
      this.removeFunction = () => {};
      endTurn(unit);
      resolveCallback({ cancel: true });
    });
    return promise;
  };
  removeFunction = (args?: any) => {};
  // 添加你的方法和属性
}
const drawGraphics = (
  path: { [x: string]: { x: number; y: number; step: number } | null },
  unit: Unit
) => {
  const graphics = new PIXI.Graphics();
  graphics.alpha = 0.4;
  graphics.zIndex = envSetting.zIndexSetting.spriteZIndex+1;
  const grids = new Set<string>();
  if (path) {
    Object.keys(path).forEach((key) => {
      const [x, y] = key.split(",").map(Number);
      grids.add(`${x},${y}`);
      const size = unit.creature ? unit.creature.size : undefined;

      // 构建范围数组
      const rangeArrA = [];
      let range = 1; // 默认范围为0，可根据需要调整
      if (size === "big") {
        range = 2;
      }

      for (let dx = 0; dx < range; dx++) {
        for (let dy = 0; dy < range; dy++) {
          rangeArrA.push({
            x: x + dx,
            y: y + dy,
          });
        }
      }
      for (const grid of rangeArrA) {
        grids.add(`${grid.x},${grid.y}`);
      }
    });
  }
  for (const grid of grids) {
    const [x, y] = grid.split(",").map(Number);
    const drawX = x * tileSize;
    const drawY = y * tileSize;
    graphics.rect(drawX, drawY, tileSize, tileSize);
    graphics.fill({ color: 0x66ccff });
  }

  graphics.eventMode = "static";
  // if (FogSystem.instanse.mask)
  //   graphics.setMask({ mask: FogSystem.instanse.mask });
  const container = golbalSetting.spriteContainer;
  if (!container) {
    console.warn("Map container not found.");
    return;
  }
  if (!golbalSetting.rlayers.spriteLayer) {
    console.warn("Sprite layer not found in global settings.");
    return;
  }
  golbalSetting.rlayers.spriteLayer.attach(graphics);
  container.addChild(graphics);
  return graphics;
};
const drawSizeGrids = (
  target: { x: number; y: number },
  unit: Unit,
  color: string
) => {
  const graphics = new PIXI.Graphics();
  graphics.alpha = 0.4;
  graphics.zIndex = envSetting.zIndexSetting.spriteZIndex+1;
  // 绘制可移动范围
  const size = unit.creature ? unit.creature.size : undefined;
  const grids = [];
  let range = 1; // 默认范围为0，可根据需要调整
  if (size === "big") {
    range = 2;
  }

  for (let dx = 0; dx < range; dx++) {
    for (let dy = 0; dy < range; dy++) {
      grids.push({
        x: target.x + dx,
        y: target.y + dy,
      });
    }
  }

  if (grids) {
    grids.forEach((grid) => {
      const drawX = grid.x * tileSize;
      const drawY = grid.y * tileSize;
      graphics.rect(drawX, drawY, tileSize, tileSize);
      graphics.fill({ color: color });
    });
  }
  graphics.eventMode = "none";
  // path 是一个以 "x,y" 为 key 的对象，记录每个格子的前驱节点

  const container = golbalSetting.spriteContainer;
  if (!container) {
    console.warn("Map container not found.");
    return graphics;
  }
  if (!golbalSetting.rlayers.spriteLayer) {
    console.warn("Sprite layer not found in global settings.");
    return graphics;
  }
  golbalSetting.rlayers.spriteLayer.attach(graphics);
  container.addChild(graphics);
  return graphics;
};
function getXY(x: number, y: number) {
  return { x: Math.floor(x / tileSize), y: Math.floor(y / tileSize) };
}
