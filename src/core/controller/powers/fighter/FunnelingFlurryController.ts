import { UnitSystem } from "./../../../system/UnitSystem";
import { Weapon } from "../../../units/Weapon";
import { Unit } from "@/core/units/Unit";
import { AbstractPwoerController } from "../AbstractPwoerController";
import { playerSelectAttackMovement } from "@/core/action/UnitAttack";
import type { CreatureAttack } from "@/core/units/Creature";

import { golbalSetting } from "@/core/golbalSetting";
import { useStandAction } from "@/core/system/InitiativeSystem";
import { checkPassiable as atkGridsCheckPassiable } from "@/core/system/AttackSystem";
import { checkPassiable as moveGridsCheckPassiable } from "@/core/system/UnitMoveSystem";
import { tileSize } from "@/core/envSetting";
import { generateWays } from "@/core/utils/PathfinderUtil";
import { BasicSelector } from "@/core/selector/BasicSelector";
import { ShiftAnim } from "@/core/anim/ShiftAnim";
import { MessageTipSystem } from "@/core/system/MessageTipSystem";
import { AbilityValueSystem } from "@/core/system/AbilitiyValueSystem";

export class FunnelingFlurryController extends AbstractPwoerController {
  public static isUse: boolean = false;
  public static instense: FunnelingFlurryController | null = null;

  selectedCharacter: Unit | null = null;

  constructor() {
    super();
  }

  doSelect = async (): Promise<any> => {
    if (!this.preFix()) return Promise.resolve();
    const { x, y } = this.getXY();
    const unit = this.selectedCharacter as Unit;
    const mainAttack1 = this.getAttack(unit, 1);
    const mainAttack2 = this.getAttack(unit, 2);
    const grids = generateWays(
      x,
      y,
      mainAttack1.range ?? 1,
      (x, y, pre, prey) => {
        return atkGridsCheckPassiable(
          unit,
          x * tileSize,
          y * tileSize,
          golbalSetting.map
        );
      }
    );

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
    const attack = {} as CreatureAttack;
    const range = weapon?.range ?? 1; // 默认攻击范围为1
    const modifer = AbilityValueSystem.getInstance().getAbilityModifier(
      unit,
      "STR"
    );
    attack.attackBonus = AbilityValueSystem.getInstance().getLevelModifier(unit);
    attack.attackBonus += modifer;
    attack.attackBonus += weapon?.bonus ?? 0; // 添加武器加值
    attack.attackBonus += 1 + 3 + 1; // 武器大师、擅长加值、战斗专长
    attack.damage = weapon?.damage ?? "1d6"; // 默认伤害为1d6
    attack.damage += `+${weapon?.bonus ?? 0}+${modifer}+1`; // 添加攻击加值到伤害
    attack.name = "Funneling Flurry";
    attack.type = "melee";
    attack.range = range;
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
    console.log("attackResult shiftFunc", attackResult);
    if (attackResult && "beAttack" in attackResult && attackResult.beAttack) {
      const beAttack = attackResult.beAttack;
      const beAttackX = Math.floor(beAttack.x / tileSize);
      const beAttackY = Math.floor(beAttack.y / tileSize);
      const fistShiftGrids = generateWays(
        beAttackX,
        beAttackY,
        1,
        (x, y, preX, preY) => {
          const movePassible = moveGridsCheckPassiable(
            beAttack,
            preX * tileSize,
            preY * tileSize,
            x * tileSize,
            y * tileSize,
            golbalSetting.map
          );
          const shiftPassibleResult = shiftPassible(
            beAttack,
            x,
            y
          );
          return movePassible && shiftPassibleResult;
        }
      );
      BasicSelector.getInstance().selectBasic(
        fistShiftGrids,
        1,
        "yellow",
        true
      );
      MessageTipSystem.getInstance().setMessage("请选择滑动位置");
      const firstShiftResult = await BasicSelector.getInstance().promise;
      MessageTipSystem.getInstance().clearMessage();
      if (firstShiftResult.cancel !== true) {
        console.log("firstShiftResult", firstShiftResult, beAttack);
        ShiftAnim.shift(beAttack, firstShiftResult.selected[0]);
      }
    }
  };
}
const shiftPassible = (unit: Unit, x: number, y: number) => {
  const map = golbalSetting.map;
  const units = map?.sprites;
  let result = true;
  units?.forEach((u) => {
    if (u instanceof Unit && u !== unit) {
      const unitX = Math.floor(u.x / tileSize);
      const unitY = Math.floor(u.y / tileSize);
      if (unitX === x && unitY === y) {
        result = false;
      }
    }

  });
  return result
};
