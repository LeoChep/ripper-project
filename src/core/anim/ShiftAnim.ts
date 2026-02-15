import { tileSize } from "../envSetting";
import type { Unit } from "../units/Unit";

export class ShiftAnim {
  static async shift(unit: Unit, target: { x: number; y: number }) {
    target.x = target.x * tileSize;
    target.y = target.y * tileSize;
    let animResolve = () => {};
    const promise = new Promise<void>((resolve) => {
      animResolve = resolve;
    });
    const interval = setInterval(() => {
      // 更新单位位置
      //每次unit向target移动tileSize/2pixi
      const dx = tileSize / 4;
      const dy = tileSize / 4;
      if (target.x > unit.x + dx) {
        unit.x += dx;
      } else if (target.x < unit.x - dx) {
        unit.x -= dx;
      }
      if (target.y > unit.y + dy) {
        unit.y += dy;
      } else if (target.y < unit.y - dy) {
        unit.y -= dy;
      }
      console.log("unit.x, unit.y", unit.x, unit.y);
      // 检查是否到达目标位置
      console.log("target.x, target.y", target.x, target.y);
      if (
        Math.abs(target.x - unit.x) <= dx &&
        Math.abs(target.y - unit.y) <= dy
      ) {
        // 停止移动
        unit.x = target.x;
        unit.y = target.y;
        const spriteUnit = unit.animUnit;
        if (spriteUnit) {
          spriteUnit.x = unit.x;
          spriteUnit.y = unit.y;
        }
        clearInterval(interval);
        animResolve();
      }
    }, 50);
    return promise;
  }
}