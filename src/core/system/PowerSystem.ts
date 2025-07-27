import { Power } from "./../power/Power";
import type { AbstractPwoerController } from "../controller/powers/AbstractPwoerController";
import { LungingStrikeController } from "../controller/powers/fighter/LungingStrikeController";

import type { Unit } from "../units/Unit";

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
  getController(powerName: string): AbstractPwoerController | null {
    let powerController =
      this.powerControllerPack.find(
        (controller) => controller.constructor.name === powerName
      ) || null;
    if (!powerController) {
      powerController = this.addController(powerName);
    }
    return powerController;
  }
  async createPower(powerName: string, unit: Unit): Promise<Power | null> {
    if (!powerName) {
      console.warn("powerName  is required.");
      return null;
    }
    const PowerClass = this.getPowerClass(powerName) as Promise<typeof Power>;
    if (!PowerClass) {
      console.warn(`Trait class not found for: ${powerName}`);
      return null;
    }
    const powerInstance = new (await PowerClass)({});
    powerInstance.owner = unit; // 设置 Trait 的 owner 为 Unit
    return powerInstance;
  }
  getPowerClass(powerName: string) {
    // 根据 traitName 返回对应的 Trait 类
    switch (powerName) {
      case "ShieldEdgeBlock":
        return import("../power/fighter/ShieldEdgeBlock").then(
          (module) => module.ShieldEdgeBlock
        );
    }
  }
}
