
import * as PIXI from "pixi.js";
import { Unit } from "../units/Unit";
import * as UnitMoveSystem from "../system/UnitMoveSystem";

import { generateWays } from "../utils/PathfinderUtil";
import type { TiledMap } from "../MapClass";

import { useInitiativeStore } from "@/stores/initiativeStore";

import { golbalSetting } from "../golbalSetting";

import { playerSelectAttackMovement } from "../action/UnitAttack";
import { checkPassiable } from "../system/AttackSystem";
import type { CreatureAttack } from "../units/Creature";
import * as envSetting from "../envSetting";

export class CharCombatAttackController {
  public static isUse: boolean = false;
  container: PIXI.Container;
  selectedCharacter: Unit | null = null;
  public static instense = null as CharCombatAttackController | null;
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
  attackSelect = (attack: CreatureAttack) => {
    const unit = this.selectedCharacter;
    if (unit === null) {
      console.warn("没有选中单位，无法进行移动选择");
      return;
    }
    if (this.graphics) {
      this.removeFunction();
    }
    //显示红色的可移动范围
    const range = attack.range ? attack.range : 1; // 默认攻击范围为1
    const tileSize = 64;
    const graphics = new PIXI.Graphics();
    
    this.graphics = graphics;
    graphics.alpha = 0.4;
    graphics.zIndex = envSetting.zIndexSetting.spriteZIndex;
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
    const path = generateWays(startX, startY, range, (x, y, preX, preY) => {
      return checkPassiable(
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
        graphics.fill({ color: 0xff0000 });
      });
    }
    // path 是一个以 "x,y" 为 key 的对象，记录每个格子的前驱节点
    graphics.eventMode = "static";
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
    // 点击其他地方移除移动范围
    const removeGraphics = () => {
      if (graphics.parent) {
        graphics.parent.removeChild(graphics);
        this.removeFunction = () => {};
      }
    };
    let cannel = false;
    this.removeFunction = () => {
      removeGraphics();
      
    };
    graphics.on("rightdown", (e) => {
      e.stopPropagation();
      cannel = true;
    });
    graphics.on("pointerup", (e) => {
      console.log("pointerup");
      e.stopPropagation();

      if (cannel) {
        return;
      }
      removeGraphics();
      if (
        unit.initiative &&
        typeof unit.initiative.standerActionNumber === "number"
      ) {
        unit.initiative.standerActionNumber =
          unit.initiative.standerActionNumber - 1;
        useInitiativeStore().updateActionNumbers(
          unit.initiative.standerActionNumber,
          unit.initiative.minorActionNumber,
          unit.initiative.moveActionNumber
        );
      }
      playerSelectAttackMovement(e, unit, attack, this.mapPassiable);
      // moveMovement(e, unit, container, path);
    });
  };
  removeFunction = () => {};
  // 添加你的方法和属性
}
