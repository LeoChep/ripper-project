import type { Unit } from "@/core/units/Unit";
import { AbstractPwoerController } from "../AbstractPwoerController";
import { playerSelectAttackMovement } from "@/core/action/UnitAttack";

import * as AttackSystem from "@/core/system/AttackSystem";
import { golbalSetting } from "@/core/golbalSetting";
import { useStandAction } from "@/core/system/InitiativeSystem";
import { BasicAttackSelector } from "@/core/selector/BasicAttackSelector";

import type { FederatedPointerEvent } from "pixi.js";
import { Area } from "@/core/area/Area";
import { AreaSystem } from "@/core/system/AreaSystem";
import { WeaponOfDivineProtectionEvent } from "@/core/power/cleric/WeaponOfDivineProtection/WeaponOfDivineProtectionEvent";
import { BattleEvenetSystem } from "@/core/system/BattleEventSystem";
import { WeaponOfDivineProtectionDefUp } from "@/core/power/cleric/WeaponOfDivineProtection/WeaponOfDivineProtectionDefUp";
import { BuffSystem } from "@/core/system/BuffSystem";
import { Weapon } from "@/core/units/Weapon";
import { WeaponOfDivineProtectionAreaMoveEvent } from "@/core/power/cleric/WeaponOfDivineProtection/WeaponOfDivineProtectionAreaMoveEvent";
import { AreaEffect } from "@/core/effect/areaEffect/AreaEffect";
import { tileSize } from "@/core/envSetting";
import { getBrustRange } from "@/core/utils/MathUtil";
import { WeaponOfDivineProtectionAreaEffect } from "@/core/power/cleric/WeaponOfDivineProtection/WeaponOfDivineProtectionAreaEffect";

export class WeaponOfDivineProtectionController extends AbstractPwoerController {
  public static isUse: boolean = false;
  public static instense: WeaponOfDivineProtectionController | null = null;

  selectedCharacter: Unit | null = null;
  powerName = "WeaponOfDivineProtection";
  constructor() {
    super();
  }

  doSelect = (): Promise<any> => {
    if (!this.preFix()) return Promise.resolve();
    const { x, y } = this.getXY();
    const unit = this.selectedCharacter as Unit;
    const weapon = unit.creature?.weapons?.[0];
    const attackParams = {
      attackFormula: "[STR]",
      damageFormula: "[W]+[STR]",
      keyWords: [],
      weapon: weapon,
      unit: unit,
    };
    const attack = AttackSystem.createAttack(attackParams);
    // if (attack?.range) {
    //   attack.range++;
    // }
    // 执行攻击选择逻辑
    const basicAttackSelector = BasicAttackSelector.getInstance().selectBasic({
      unit: unit,
      range: attack.range,
      color: "red",
    });
    this.removeFunction = basicAttackSelector.removeFunction;
    let resolveCallback = (result: any) => {};
    const promise = new Promise((resolve) => {
      resolveCallback = resolve;
    });
    basicAttackSelector.promise?.then(
      (result: { cancel: boolean; event: FederatedPointerEvent }) => {
        console.log(
          "basicAttackSelector result",
          result,
          result.cancel !== true
        );
        if (result.cancel !== true) {
          useStandAction(unit);
          playerSelectAttackMovement(
            result.event,
            unit,
            attack,
            golbalSetting.map
          ).then(() => {
            console.log("resolveCallback", {});
            //使用威能效果，以牧师为中心的光环为周围队友提供+2ac威能
            //创建区域
            const area=new Area()
            const weaponOfDivineProtectionEffect=new WeaponOfDivineProtectionAreaEffect(unit)
            console.log("创建神圣守护之武器区域效果:",weaponOfDivineProtectionEffect)
            const grids=getBrustRange(Math.floor(unit.x/tileSize),Math.floor(unit.y/tileSize),1)
            weaponOfDivineProtectionEffect.grids=new Set();
            grids.forEach(grid=>{
              weaponOfDivineProtectionEffect.grids.add({x:grid.x,y:grid.y,step:0})
            });
            weaponOfDivineProtectionEffect.build();
            area.effects.push(weaponOfDivineProtectionEffect)
            area.name="Divine Protection Area"
            area.des="Area of effect for Divine Protection"
            AreaSystem.getInstance().addArea(area);
            //创建hook
            const event=new WeaponOfDivineProtectionEvent(
              unit,
              1
            )
            event.hook();
            //创造进出区域事件
            const inOutAreaMoveEvent=new WeaponOfDivineProtectionAreaMoveEvent(
              unit,
              area);
            inOutAreaMoveEvent.hook();
          
            resolveCallback({});
          });
        } else {
          resolveCallback(result);
        }
      }
    );

    return promise;
  };
}
