import type { AbstractPwoerController } from "../controller/powers/AbstractPwoerController";
import { LungingStrikeController } from "../controller/powers/fighter/LungingStrikeController";

export class PowerSystem {
  static instance: PowerSystem | null = null;
  powerControllerPack: AbstractPwoerController[] = [];
  static getInstance() {
    if (!PowerSystem.instance) {
      PowerSystem.instance = new PowerSystem();
    }
    return PowerSystem.instance;
  }
  addController(powerName: string) {
    let powerController: AbstractPwoerController | null = null;
    if (powerName === "LungingStrike") {
      powerController = new LungingStrikeController();
    }
    if (!powerController) {
      console.warn(`PowerController for ${powerName} is not defined.`);
      return null;
    }
    if (powerController) this.powerControllerPack.push(powerController);
    return powerController;
  }
  getController(powerName: string): AbstractPwoerController| null {
    let powerController =
      this.powerControllerPack.find(
        (controller) => controller.constructor.name === powerName
      ) || null;
    if (!powerController) {
      powerController = this.addController(powerName);
    }
    return powerController;
  }
}
