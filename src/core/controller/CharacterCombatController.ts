import { lockOn } from "./../anim/LockOnAnim";
import { golbalSetting } from "../golbalSetting";
import type { TiledMap } from "../MapClass";
import type { Unit } from "../units/Unit";
import { CharCombatMoveController } from "./CharacterCombatMoveController";
import { CharacterController } from "./CharacterController";

import { moveSelect } from "./UnitMoveController";
import { SelectAnimSprite } from "../anim/SelectAnimSprite";
import { zIndexSetting } from "../envSetting";

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
    CharCombatMoveController.instense?.removeFunction();
  }
}
