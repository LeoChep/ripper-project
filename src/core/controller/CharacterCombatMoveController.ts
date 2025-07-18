import * as PIXI from "pixi.js";
import { Unit } from "../units/Unit";
import * as UnitMoveSystem from "../system/UnitMoveSystem";

import { generateWays } from "../utils/PathfinderUtil";
import type { TiledMap } from "../MapClass";

import { playerSelectMovement } from "../action/UnitMove";
import { useInitiativeStore } from "@/stores/initiativeStore";
import * as envSetting from "../envSetting";
import { golbalSetting } from "../golbalSetting";
import { FogSystem } from "../system/FogSystem_unuse";
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
  container: PIXI.Container;
  selectedCharacter: Unit | null = null;
  public static instense = null as CharCombatMoveController | null;
  mapPassiable: TiledMap | null = null;
  graphics: PIXI.Graphics | null = null;
  constructor(
    container: PIXI.Container<PIXI.ContainerChild>,
    mapPassiable: TiledMap
  ) {
    this.container = container;
    this.mapPassiable = mapPassiable;

    // 初始化逻辑
  }
  moveSelect = () => {
    const unit = this.selectedCharacter;
    if (unit === null) {
      console.warn("没有选中单位，无法进行移动选择");
      return;
    }
    if (this.graphics) {
      this.removeFunction();
    }
    //显示可移动范围
    const range = unit.creature?.speed ?? 0;
    const tileSize = 64;
    const graphics = new PIXI.Graphics();
    graphics.alpha = 0.4;
    graphics.zIndex = envSetting.zIndexSetting.mapZindex;
    const spriteUnit = unit.animUnit;
    console.log("spriteUnits", unit);
    if (!spriteUnit) {
      return;
    }
    console.log(`动画精灵位置: (${spriteUnit.x}, ${spriteUnit.y})`);
    //
    const centerX = spriteUnit.x;
    const centerY = spriteUnit.y;
    const startX = Math.floor(centerX / tileSize);
    const startY = Math.floor(centerY / tileSize);
    // path 是一个以 "x,y" 为 key 的对象，记录每个格子的前驱节点
    const path = generateWays(startX, startY, range, (x, y, preX, preY) => {
      return UnitMoveSystem.checkPassiable(
        unit,
        preX * tileSize,
        preY * tileSize,
        x * tileSize,
        y * tileSize,
        this.mapPassiable
      );
    });
    // 绘制可移动范围
    graphics.clear();
    if (path) {
      Object.keys(path).forEach((key) => {
        const [x, y] = key.split(",").map(Number);
        const drawX = x * tileSize;
        const drawY = y * tileSize;
        graphics.rect(drawX, drawY, tileSize, tileSize);
        graphics.fill({ color: 0x66ccff });
      });
    }

    graphics.eventMode = "static";
    if (FogSystem.instanse.mask) graphics.setMask({mask:FogSystem.instanse.mask});
    const container = golbalSetting.mapContainer;
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

    this.graphics = graphics;
    // 点击其他地方移除移动范围
    const removeGraphics = () => {
      if (graphics.parent) {
        graphics.parent.removeChild(graphics);
      }
    };
    let cannel = false;
    this.removeFunction = () => {
      removeGraphics();
      this.removeFunction = () => {};
    };
    graphics.on("pointerup", (e) => {
      console.log("pointerup");
      e.stopPropagation();
      removeGraphics();
      if (cannel) {
        return;
      }
      playerSelectMovement(e, unit, container, path);
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
      }
    });
  };
  removeFunction = () => {};
  // 添加你的方法和属性
}
