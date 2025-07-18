import { lockOn } from "./../anim/LockOnAnim";
import { golbalSetting } from "../golbalSetting";
import type { TiledMap } from "../MapClass";
import type { Unit } from "../units/Unit";
import { CharCombatMoveController } from "./CharacterCombatMoveController";
import { CharacterController } from "./CharacterController";

import { moveSelect } from "./UnitMoveController";
import { SelectAnimSprite } from "../anim/SelectAnimSprite";
import { zIndexSetting } from "../envSetting";
import { CharCombatAttackController } from "./CharacterCombatAttackController";
import type { CreatureAttack } from "../units/Creature";
import * as InitiativeSystem from "../system/InitiativeSystem";
export class CharacterCombatController {
  public inUse: boolean = false;
  public static instance: CharacterCombatController | null = null;
  selectedCharacter: Unit | null = null;
  mapPassiable: TiledMap | null = null;
  constructor(mapPassiable: TiledMap) {
    // 初始化属性
    if (!golbalSetting.mapContainer) {
      console.warn("CharacterCombatController instance already exists.");
      return;
    }
    if (!mapPassiable) {
      return;
    }
  }

  useMoveController() {
    this.selectedCharacter = this.mapPassiable?.sprites.find(
      (sprite) => sprite.id === CharacterController.curser
    );
    console.log("使用移动控制器", this.selectedCharacter,this.selectedCharacter?.initiative?.moveActionNumber);
    if (
      (this.selectedCharacter?.initiative?.moveActionNumber ?? 0) < 1
    ) {
      return;
    }
    CharCombatAttackController.instense?.removeFunction();

    if (
      this.selectedCharacter &&
      golbalSetting.mapContainer &&
      golbalSetting.rlayers.lineLayer &&
      this.mapPassiable
    ) {
      let moveController = CharCombatMoveController.instense;
      if (!moveController) {
        moveController = new CharCombatMoveController(
          golbalSetting.mapContainer,
          this.mapPassiable
        );
        CharCombatMoveController.instense = moveController;
      }
      moveController.selectedCharacter = this.selectedCharacter;
      moveController.moveSelect();
    }
  }
  useAttackController() {
    this.selectedCharacter = this.mapPassiable?.sprites.find(
      (sprite) => sprite.id === CharacterController.curser
    );
    if (
         (this.selectedCharacter?.initiative?.standerActionNumber ?? 0)<1 
    ) {
      return;
    }
    CharCombatMoveController.instense?.removeFunction();
    if (
      this.selectedCharacter &&
      golbalSetting.mapContainer &&
      golbalSetting.rlayers.lineLayer &&
      this.mapPassiable
    ) {
      let atkController = CharCombatAttackController.instense;
      if (!atkController) {
        atkController = new CharCombatAttackController(
          golbalSetting.mapContainer,
          this.mapPassiable
        );
        CharCombatAttackController.instense = atkController;
      }
      atkController.selectedCharacter = this.selectedCharacter;
      atkController.attackSelect(
        this.selectedCharacter.creature?.attacks[0] as CreatureAttack
      );
    }
  }
  endTurn() {
    if (!this.selectedCharacter) {
      console.warn("没有选中单位，无法结束回合");
      return;
    }
    CharCombatMoveController.instense?.removeFunction();
    CharCombatAttackController.instense?.removeFunction();
    InitiativeSystem.endTurn(this.selectedCharacter);
  }
}
