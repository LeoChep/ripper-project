import { tileSize } from "../envSetting";
import { golbalSetting } from "../golbalSetting";
import { Unit } from "../units/Unit";

export class ShiftSystem {
  private static instance: ShiftSystem | null = null;

  private constructor() {}

  public static getInstance(): ShiftSystem {
    if (!ShiftSystem.instance) {
      ShiftSystem.instance = new ShiftSystem();
    }
    return ShiftSystem.instance;
  }

  shiftPassible = (unit: Unit, x: number, y: number) => {
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
    return result;
  };
}
