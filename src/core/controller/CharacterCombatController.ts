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
      !InitiativeSystem.checkActionUseful(this.selectedCharacter, "move") &&
      walkMachine.onDivideWalk === false
    ) {
      return;
    }
    const cancelInfo = {
      from: "moveConrotller",
      cancel: true,
    };
    CharCombatAttackController.instense?.removeFunction(cancelInfo);
    this.powerController?.removeFunction(cancelInfo);
    let moveController = CharCombatMoveController.instense;
    if (!moveController) {
      moveController = new CharCombatMoveController();
      CharCombatMoveController.instense = moveController;
    }
    moveController.selectedCharacter = this.selectedCharacter;
    const move = moveController.moveSelect();
    move.then((result) => {
      console.log("moveSelect result", result);
      if (result?.cancel === false) {
        if (walkMachine.onDivideWalk === true) {
          setTimeout(() => {
            this.useMoveController();
          }, 50);
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
  async usePowerController(power: Power) {
    if (!this.preCheck() || !this.selectedCharacter) {
      return;
    }
    console.log("usePowerController", power);
    if (
      !InitiativeSystem.checkActionUseful(
        this.selectedCharacter,
        power.actionType
      )
    ) {
      return;
    }
    const cancelInfo = {
      from: power.name + "Controller",
      cancel: true,
    };
    CharCombatAttackController.instense?.removeFunction(cancelInfo);
    CharCombatMoveController.instense?.removeFunction(cancelInfo);
    this.powerController?.removeFunction(cancelInfo);
    const powerController = await PowerSystem.getInstance().getController(
      power.name
    );
    this.powerController = powerController;
    if (!powerController) {
      console.warn(`PowerController for ${power.name} is not defined.`);
      return;
    }
    powerController.selectedCharacter = this.selectedCharacter;
    powerController.doSelect().then((result) => {
      console.log("powerController result", result);
      if (!result.cancel && InitiativeSystem.isInBattle()) {
        this.resetDivideWalk();
      }

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
    const cancelInfo = {
      from: "atkController",
      cancel: true,
    };
    CharCombatAttackController.instense?.removeFunction(cancelInfo);
    CharCombatMoveController.instense?.removeFunction(cancelInfo);
    this.powerController?.removeFunction(cancelInfo);

    let atkController = CharCombatAttackController.instense;
    if (!atkController) {
      atkController = new CharCombatAttackController();
      CharCombatAttackController.instense = atkController;
    }
    atkController.selectedCharacter = this.selectedCharacter;
    const attack = {} as CreatureAttack;
    attack.damage =
      this.selectedCharacter.creature?.weapons?.[0].damage ?? "1d6";
    attack.attackBonus =
      this.selectedCharacter.creature?.weapons?.[0].bonus ?? 0;
    const modifer =
      this.selectedCharacter.creature?.abilities.find(
        (ability) => ability.name === "Strength"
      )?.modifier || 0;
    attack.damage +=
      `+${modifer}` +
      "+1+" +
      (this.selectedCharacter.creature?.weapons?.[0].bonus.toString() ?? "0");
    attack.name = this.selectedCharacter.creature?.weapons?.[0].name ?? "攻击";
    attack.type = "melee";
    attack.range = this.selectedCharacter.creature?.weapons?.[0].range;
    attack.attackBonus += modifer;
    attack.target = "ac";
    attack.attackBonus += 1; //武器大师
    attack.attackBonus += 3; //擅长加值
    attack.attackBonus += 1; //战斗专长
    atkController.attackSelect(attack).then((result) => {
      console.log("attackSelect result", result);
      if (!result.cancel && InitiativeSystem.isInBattle()) {
        this.resetDivideWalk();
      }

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
    this.powerController?.removeFunction();
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
