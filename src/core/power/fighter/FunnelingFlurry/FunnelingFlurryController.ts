import { UnitSystem } from "./../../../system/UnitSystem";
import { Unit } from "@/core/units/Unit";
import { AbstractPwoerController } from "../../../controller/AbstractPwoerController";
import { playerSelectAttackMovement } from "@/core/action/UnitAttack";

import * as AttackSystem from "@/core/system/AttackSystem";
import { golbalSetting } from "@/core/golbalSetting";
import { useStandAction } from "@/core/system/InitiativeSystem";
import { checkPassiable as atkGridsCheckPassiable } from "@/core/system/AttackSystem";
import { checkPassiable as moveGridsCheckPassiable } from "@/core/system/UnitMoveSystem";
import { tileSize } from "@/core/envSetting";
import { generateWays } from "@/core/utils/PathfinderUtil";
import { BasicSelector } from "@/core/selector/BasicSelector";
import { ShiftAnim } from "@/core/anim/ShiftAnim";
import { MessageTipSystem } from "@/core/system/MessageTipSystem";
import { ShiftSelector } from "@/core/selector/ShiftSelector";
import { ShiftSystem } from "@/core/system/ShiftSystem";

export class FunnelingFlurryController extends AbstractPwoerController {
  public static isUse: boolean = false;
  public static instense: FunnelingFlurryController | null = null;

  selectedCharacter: Unit | null = null;
  powerName = "FunnelingFlurry";
  constructor() {
    super();
  }

  doSelect = async (): Promise<any> => {

    const { x, y } = this.getXY();
    const unit = this.selectedCharacter as Unit;
    const mainAttack1 = this.getAttack(unit, 1);
    const mainAttack2 = this.getAttack(unit, 2);
    const grids = generateWays({
      start: { x, y },
      range: mainAttack1.range ?? 1,
      checkFunction: (gridX: number, gridY: number, preX: number, preY: number) => {
        return atkGridsCheckPassiable(
          unit,
          gridX ,
          gridY ,
        );
      }
    });

    // 执行攻击选择逻辑
    const basicAttackSelector = BasicSelector.getInstance().selectBasic(
      grids,
      1,
      "red",
      true,
      (gridX, gridY) => {
        const target = UnitSystem.getInstance().findUnitByGridxy(gridX, gridY);
        if (target && target !== unit) {
          return true;
        }
        return false;
      }
    );
    MessageTipSystem.getInstance().setMessage("请选择主目标");
    this.graphics = BasicSelector.getInstance().graphics;
    this.removeFunction = basicAttackSelector.removeFunction;
    let resolveCallback = (result: any) => {};
    const promise = new Promise((resolve) => {
      resolveCallback = resolve;
    });

    const result = await basicAttackSelector.promise;
    let firstaAttackResult;
    if (result.cancel !== true) {
      useStandAction(unit);
      firstaAttackResult = await playerSelectAttackMovement(
        result.event,
        unit,
        mainAttack1,
        golbalSetting.map
      );
      console.log("resolveCallback", {});
    } else {
      MessageTipSystem.getInstance().clearMessage();
      resolveCallback(result);
      return promise;
    }
    //shift unit position
    if (
      firstaAttackResult &&
      (firstaAttackResult as { hit: boolean }).hit == true
    ) {
      await this.shiftFunc(firstaAttackResult);
    }
    let firstTarget =
      (firstaAttackResult as { beAttack: Unit | null }).beAttack ?? null;
    // 第二次攻击
    const secondAttackSelector = BasicSelector.getInstance().selectBasic(
      grids,
      1,
      "red",
      true,
      (gridX, gridY) => {
        const secondTarget = UnitSystem.getInstance().findUnitByGridxy(
          gridX,
          gridY
        );
        if (secondTarget && secondTarget !== firstTarget) {
          return true;
        }
        return false;
      }
    );
    MessageTipSystem.getInstance().setMessage("请选择另一个不同的目标");
    this.removeFunction = secondAttackSelector.removeFunction;
    const secondResult = await secondAttackSelector.promise;
    MessageTipSystem.getInstance().clearMessage();
    let secondAttackResult;
    if (secondResult.cancel !== true) {
      secondAttackResult = await playerSelectAttackMovement(
        secondResult.event,
        unit,
        mainAttack2,
        golbalSetting.map
      );
    } else {
      resolveCallback(secondResult);
      MessageTipSystem.getInstance().clearMessage();
      return promise;
    }
    if (
      secondAttackResult &&
      (secondAttackResult as { hit: boolean }).hit == true
    ) {
      await this.shiftFunc(secondAttackResult);
    }

    console.log("resolveCallback", {});
    resolveCallback({});
    return promise;
  };
  getAttack = (unit: Unit, num: number) => {
    const weapon = unit.creature?.weapons?.[num - 1];
    const attackParams={attackFormula:'[STR]', damageFormula:'[W]+[STR]', keyWords:[], weapon:weapon, unit:unit}
    const attack = AttackSystem.createAttack(attackParams);

    return attack;
  };
  shiftFunc = async (
    attackResult:
      | {}
      | {
          cancel?: undefined;
          hit?: undefined;
          damage?: undefined;
          targetX?: undefined;
          targetY?: undefined;
          beAttack?: undefined;
        }
      | {
          cancel: boolean;
          hit?: undefined;
          damage?: undefined;
          targetX?: undefined;
          targetY?: undefined;
          beAttack?: undefined;
        }
      | {
          hit: boolean;
          damage: number;
          targetX: number;
          targetY: number;
          beAttack: Unit | null;
          cancel?: undefined;
        }
      | undefined
  ) => {
    if (attackResult && "beAttack" in attackResult && attackResult.beAttack) {
      const beAttack = attackResult.beAttack;
      const beAttackX = Math.floor(beAttack.x / tileSize);
      const beAttackY = Math.floor(beAttack.y / tileSize);
      const fistShiftGrids = generateWays({
        start: { x: beAttackX, y: beAttackY },
        range: 1,
        checkFunction: (
          x: number,
          y: number,
          preX: number,
          preY: number
        ) => {
          const movePassible = moveGridsCheckPassiable(
            beAttack,
            preX * tileSize,
            preY * tileSize,
            x * tileSize,
            y * tileSize,
            golbalSetting.map
          );
          const shiftPassibleResult = ShiftSystem.getInstance().shiftPassible(
            beAttack,
            x,
            y
          );
          return movePassible && shiftPassibleResult;
        }
      });
       ShiftSelector.getInstance().selectBasic(fistShiftGrids, beAttack, 1, 1, "yellow", "red", true);
      MessageTipSystem.getInstance().setMessage("请选择滑动位置");
      const firstShiftResult = await ShiftSelector.getInstance().promise;
      MessageTipSystem.getInstance().clearMessage();
      if (firstShiftResult.cancel !== true) {
        console.log("firstShiftResult", firstShiftResult, beAttack);
        ShiftAnim.shift(beAttack, firstShiftResult.selected[0]);
      }
    }
  };
}

