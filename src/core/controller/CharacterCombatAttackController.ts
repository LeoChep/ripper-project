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
import { BasicAttackSelector } from "../selector/BasicAttackSelector";

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
  attackSelect = (attack: CreatureAttack): Promise<any> => {
    const unit = this.selectedCharacter;
    if (unit === null) {
      console.warn("没有选中单位，无法进行移动选择");
      return Promise.resolve({});
    }
    if (this.graphics) {
      this.removeFunction();
    }
    //显示红色的可移动范围
    const range = attack.range ? attack.range : 1; // 默认攻击范围为1
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

    const basicAttackSelector = BasicAttackSelector.selectBasicAttack(
      (x, y, pre, prey) => {
        return checkPassiable(
          unit,
          x * tileSize,
          y * tileSize,
          this.mapPassiable
        );
      },
      range,
      startX,
      startY
    );
    this.removeFunction = basicAttackSelector.removeFunction;
    let resolveCallback = (result: any) => {}
    const promise=new Promise((resolve)=>{
      resolveCallback = resolve;
    })
    basicAttackSelector.promise?.then((result) => {
      console.log('basicAttackSelector.promise',result)
      if (result.cencel !== true) {
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
        playerSelectAttackMovement(result.event, unit, attack, this.mapPassiable).then(
          () => {
            console.log("resolveCallback", {});
            resolveCallback({});
          }
        );
      }else{
        resolveCallback(result)
      }
    });

    return promise;
  };
  removeFunction = (args?: any) => {};
  // 添加你的方法和属性
}
