import { UnitSystem } from "../../../system/UnitSystem";
import { Weapon } from "../../../units/Weapon";
import { Unit } from "@/core/units/Unit";
import { AbstractPwoerController } from "../AbstractPwoerController";
import type { CreatureAttack } from "@/core/units/Creature";

import { golbalSetting } from "@/core/golbalSetting";

import { checkPassiable as moveGridsCheckPassiable } from "@/core/system/UnitMoveSystem";
import { tileSize } from "@/core/envSetting";
import { generateWays } from "@/core/utils/PathfinderUtil";
import { BasicSelector } from "@/core/selector/BasicSelector";
import { ShiftAnim } from "@/core/anim/ShiftAnim";
import { MessageTipSystem } from "@/core/system/MessageTipSystem";
import { AbilityValueSystem } from "@/core/system/AbilitiyValueSystem";
import { BasicLineSelector } from "@/core/selector/BasicLineSelector";

export class ChargeAttackController extends AbstractPwoerController {
  public static isUse: boolean = false;
  public static instense: ChargeAttackController | null = null;

  selectedCharacter: Unit | null = null;

  constructor() {
    super();
  }

  doSelect = async (): Promise<any> => {
    if (!this.preFix()) return Promise.resolve();
    const { x, y } = this.getXY();
    const unit = this.selectedCharacter as Unit;
    const mainAttack1 = this.getAttack(unit, 1);
    const speed=unit.creature?.speed;
    console.log('unit speed', speed);
    const grids = generateWays(
      x,
      y,
      speed ? speed : 0,
      (x, y, prex, prey) => {
        return moveGridsCheckPassiable(
          unit,
          prex * tileSize,
          prey * tileSize,
          x * tileSize,
          y * tileSize,
          golbalSetting.map
        );
      }
    );

    // 执行攻击选择逻辑
    const basicAttackSelector = BasicLineSelector.getInstance().selectBasic(
      grids,
      1,
      "blue",
      true,
    );
    MessageTipSystem.getInstance().setMessage("请选择主目标");
    this.graphics = BasicSelector.getInstance().graphics;
    this.removeFunction = basicAttackSelector.removeFunction;
    let resolveCallback = (result: any) => {};
    const promise = new Promise((resolve) => {
      resolveCallback = resolve;
    });

    const result = await basicAttackSelector.promise;
  
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
