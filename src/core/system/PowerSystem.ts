import { Power } from "./../power/Power";
import type { AbstractPwoerController } from "../controller/powers/AbstractPwoerController";

import type { Unit } from "../units/Unit";

export class PowerSystem {
  static instance: PowerSystem | null = null;
  powerControllerPack: Map<string, AbstractPwoerController> = new Map();
  static getInstance() {
    if (!PowerSystem.instance) {
      PowerSystem.instance = new PowerSystem();
    }
    return PowerSystem.instance;
  }
  async addController(powerName: string) {
    let powerController: AbstractPwoerController | null = null;
    const powerControllerClass = await this.getPowerControllerClass(powerName);
    if (!powerControllerClass) {
      console.warn(`PowerController class not found for: ${powerName}`);
      return null;
    }
    powerController = new powerControllerClass();
    if (!powerController) {
      console.warn(`PowerController for ${powerName} is not defined.`);
      return null;
    }
    if (powerController)
      this.powerControllerPack.set(powerName, powerController);
    return powerController;
  }
  async getController(
    powerName: string
  ): Promise<AbstractPwoerController | null> {
    let powerController = this.powerControllerPack.get(powerName);
    if (!powerController) {
      await this.addController(powerName);
      powerController = this.powerControllerPack.get(
        powerName
      ) as AbstractPwoerController;
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
  getPowerControllerClass(powerName: string) {
    // 根据 powerName 返回对应的 PowerController 类
    switch (powerName) {
      case "LungingStrike":
        return import(
          "../controller/powers/fighter/LungingStrikeController"
        ).then((module) => module.LungingStrikeController);
      case "FunnelingFlurry":
        return import(
          "../controller/powers/fighter/FunnelingFlurryController"
        ).then((module) => module.FunnelingFlurryController);
      case "IceRays":
        return import(
          "../controller/powers/wizard/IceRaysController"
        ).then((module) => module.IceRaysController);
      case "Orbmaster's Incendiary Detonation":
        return import(
          "../controller/powers/wizard/OrbmastersIncendiaryDetonationController"
        ).then(
          (module) => module.OrbmastersIncendiaryDetonationController
        );
      case "Magic Missile":
        return import(
          "../controller/powers/wizard/MagicMissileController"
        ).then((module) => module.MagicMissileController);
    }
    return null;
  }
}
