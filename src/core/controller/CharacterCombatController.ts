import { golbalSetting } from "../golbalSetting";
import type { TiledMap } from "../MapClass";
import type { Unit } from "../units/Unit";
import { CharCombatMoveController } from "./CharacterCombatMoveController";
import { CharacterController } from "./CharacterController";

import { CharCombatAttackController } from "./CharacterCombatAttackController";
import type { CreatureAttack } from "../units/Creature";
import * as InitiativeSystem from "../system/InitiativeSystem";
import type { WalkStateMachine } from "../stateMachine/WalkStateMachine";
import { AbstractPwoerController } from "./powers/AbstractPwoerController";
import { Power } from "../power/Power";
import { PowerSystem } from "../system/PowerSystem";
export class CharacterCombatController {
  public inUse: boolean = false;
  public static instance: CharacterCombatController | null = null;
  selectedCharacter: Unit | null = null;
  constructor() {
    // 初始化属性
  }
  powerController: AbstractPwoerController | null = null;
  useMoveController() {
    if (!this.preCheck() || !this.selectedCharacter) {
      return;
    }
    const walkMachine = this.selectedCharacter?.stateMachinePack.getMachine(
      "walk"
    ) as WalkStateMachine;
    if (
      !InitiativeSystem.checkActionUseful(this.selectedCharacter,'move') &&
      walkMachine.onDivideWalk === false
    ) {
      return;
    }
    const cencelInfo = {
      from: "moveConrotller",
      cencel: true,
    };
    CharCombatAttackController.instense?.removeFunction(cencelInfo);
    this.powerController?.removeFunction(cencelInfo);
    let moveController = CharCombatMoveController.instense;
    if (!moveController) {
      moveController = new CharCombatMoveController();
      CharCombatMoveController.instense = moveController;
    }
    moveController.selectedCharacter = this.selectedCharacter;
    const move = moveController.moveSelect();
    move.then((result) => {
      console.log("moveSelect result", result);
      if (result?.cencel === false) {
        if (walkMachine.onDivideWalk === true) {
          this.useMoveController();
        }
      }
    });
  }
  preCheck() {
    if (this.inUse === false || !golbalSetting.map) {
      return false;
    }
    this.selectedCharacter = golbalSetting.map.sprites.find(
      (sprite) => sprite.id === CharacterController.curser
    );
    if (!this.selectedCharacter) {
      console.warn("没有选中单位，无法进行操作选择");
      return false;
    }

    return true;
  }
  usePowerController(power: Power) {
    if (!this.preCheck() || !this.selectedCharacter) {
      return;
    }
    if (
      !InitiativeSystem.checkActionUseful(this.selectedCharacter, power.actionType)
    ) {
      return;
    }
    const cencelInfo = {
      from: power.name + "Conrotller",
      cencel: true,
    };
    CharCombatAttackController.instense?.removeFunction(cencelInfo);
    CharCombatMoveController.instense?.removeFunction(cencelInfo);
    this.powerController?.removeFunction(cencelInfo);
    const powerController = PowerSystem.getInstance().getController(power.name);
    this.powerController = powerController;
    if (!powerController) {
      console.warn(`PowerController for ${power.name} is not defined.`);
      return;
    }
    powerController.selectedCharacter = this.selectedCharacter;
    powerController.doSelect().then((result) => {
      console.log("powerController result", result);
      this.resetDivideWalk();
      setTimeout(() => {
        if (!result.from && InitiativeSystem.isInBattle()) {
          this.useMoveController();
        }
      }, 90);
    });
  }
  useAttackController() {
    if (!this.preCheck() || !this.selectedCharacter) {
      return;
    }
    if (
      !InitiativeSystem.checkActionUseful(this.selectedCharacter, "standard")
    ) {
      return;
    }
    const cencelInfo = {
      from: "atkConrotller",
      cencel: true,
    };
    CharCombatAttackController.instense?.removeFunction(cencelInfo);
    CharCombatMoveController.instense?.removeFunction(cencelInfo);
    this.powerController?.removeFunction(cencelInfo);

    let atkController = CharCombatAttackController.instense;
    if (!atkController) {
      atkController = new CharCombatAttackController();
      CharCombatAttackController.instense = atkController;
    }
    atkController.selectedCharacter = this.selectedCharacter;
    atkController
      .attackSelect(
        this.selectedCharacter.creature?.attacks[0] as CreatureAttack
      )
      .then((result) => {
        console.log("attackSelect result", result);
        this.resetDivideWalk();
        setTimeout(() => {
          if (!result.from && InitiativeSystem.isInBattle()) {
            this.useMoveController();
          }
        }, 90);
      });
  }
  endTurn() {
    if (!this.selectedCharacter) {
      console.warn("没有选中单位，无法结束回合");
      return;
    }
    CharCombatMoveController.instense?.removeFunction();
    CharCombatAttackController.instense?.removeFunction();
    if (CharacterCombatController.instance) {
      CharacterCombatController.instance.inUse = false;
    }
    InitiativeSystem.endTurn(this.selectedCharacter);
  }
  resetDivideWalk() {
    const walkMachine = this.selectedCharacter?.stateMachinePack.getMachine(
      "walk"
    ) as WalkStateMachine;
    if (walkMachine.onDivideWalk === true) {
      walkMachine.onDivideWalk = false;
      walkMachine.leastDivideSpeed = 0;
    }
  }
}
