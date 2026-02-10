import * as PIXI from "pixi.js";
import { Unit } from "../units/Unit";
import * as UnitMoveSystem from "../system/UnitMoveSystem";

import { generateWays } from "../utils/PathfinderUtil";
import { standMovement } from "../action/UnitStand";

export class CharacterCombatStandController {
  public static isUse: boolean = false;

  selectedCharacter: Unit | null = null;
  public static instense = null as CharacterCombatStandController | null;

  graphics: PIXI.Graphics | null = null;
  constructor() {
    // 初始化逻辑
  }
  static getInstance(): CharacterCombatStandController {
    if (!CharacterCombatStandController.instense) {
      CharacterCombatStandController.instense =
        new CharacterCombatStandController();
    } 
    return CharacterCombatStandController.instense;
  }
  doSelect = async () => {
    await standMovement(this.selectedCharacter as Unit);
    return {  } as any;
  }
}
