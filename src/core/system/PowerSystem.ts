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
    let PowerClass = this.getPowerClass(powerName) as Promise<typeof Power>;
    await PowerClass;
    console.log("powerclass", await PowerClass, powerName);
    if (!PowerClass) {
      console.warn(`Trait class not found for: ${powerName}`);
      // PowerClass = Promise.resolve(Power);
      return null;
    }
    const powerInstance = new (await PowerClass)({});
    powerInstance.owner = unit; // 设置 Trait 的 owner 为 Unit
    return powerInstance;
  }
  getPowerClass(powerName: string) {
    // 根据 traitName 返回对应的 Trait 类
    switch (powerName) {
      case "ChargeAttack":
        return import("../power/fighter/ChargeAttack/ChargeAttack").then(
          (module) => module.ChargeAttack
        );
      case "ShieldEdgeBlock":
        return import("../power/fighter/ShieldEdgeBlock/ShieldEdgeBlock").then(
          (module) => module.ShieldEdgeBlock
        );
      case "FunnelingFlurry":
        return import("../power/fighter/FunnelingFlurry/FunnelingFlurry").then(
          (module) => module.FunnelingFlurry
        );
      case "LungingStrike":
        return import("../power/fighter/LungingStrike/LungingStrike").then(
          (module) => module.LungingStrike
        );
      case "IceRays":
        return import("../power/wizard/IceRays/IceRays").then(
          (module) => module.IceRays
        );
      case "MagicMissile":
        return import("../power/wizard/MagicMissile/MagicMissile").then(
          (module) => module.MagicMissile
        );
      case "FreezingBurst":
        return import("../power/wizard/FreezingBurst/FreezingBurst").then(
          (module) => module.FreezingBurst
        );
      case "OrbmastersIncendiaryDetonation":
        return import(
          "../power/wizard/OrbmastersIncendiaryDetonation/OrbmastersIncendiaryDetonation"
        ).then((module) => module.OrbmastersIncendiaryDetonation);
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
        return import("../controller/powers/wizard/IceRaysController").then(
          (module) => module.IceRaysController
        );
      case "OrbmastersIncendiaryDetonation":
        return import(
          "../controller/powers/wizard/OrbmastersIncendiaryDetonationController"
        ).then((module) => module.OrbmastersIncendiaryDetonationController);
      case "FreezingBurst":
        return import(
          "../controller/powers/wizard/FreezingBurstController"
        ).then((module) => module.FreezingBurstController);
      case "MagicMissile":
        return import(
          "../controller/powers/wizard/MagicMissileController"
        ).then((module) => module.MagicMissileController);

      case "ChargeAttack":
        return import(
          "../controller/powers/fighter/ChargeAttackController"
        ).then((module) => module.ChargeAttackController);
    }
    return null;
  }
}
