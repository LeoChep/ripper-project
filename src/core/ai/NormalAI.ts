import type { TiledMap } from "../MapClass";
import { Unit } from "../units/Unit";
import type { AIInterface } from "../type/AIInterface";
import * as InitiativeController from "../system/InitiativeSystem";
import { generateWays } from "../utils/PathfinderUtil";
import * as UnitMove from "../action/UnitMove";
import * as UnitMoveController from "../system/UnitMoveSystem";
import * as UnitAttack from "../action/UnitAttack";
import { segmentsIntersect } from "../utils/MathUtil";
import { golbalSetting } from "../golbalSetting";
import { ModifierSystem } from "../system/ModifierSystem";

const tileSize = 64; // 假设每个格子的大小为64像素
export class NormalAI implements AIInterface {
  public owner: Unit | undefined;
  constructor() {
    // Initialization code for NormalAI
  }

  // Method to handle AI actions
  async autoAction(unit: Unit, map: TiledMap) {
    //寻找目标
    // 这里可以实现AI的目标选择逻辑
    //用于存放结果
    const result: any = { canAttack: false };
    const unitX = Math.floor(unit.x / tileSize);
    const unitY = Math.floor(unit.y / tileSize);
    const path = generateWays(
      unitX,
      unitY,
      99,
      (nx, ny, x, y) => {
        return findAttackTarget(nx, ny, x, y, unit, map, result);
      },
      () => {
        if (result.target && result.canAttack) {
          return true;
        } else {
          return false;
        }
      }
    );
    console.log(
      "AI路径计算结果:",
      path,
      path[`${result.x},${result.y}`],
      result
    );
    if (result.target && path) {
      //移动
      //计算可以移动到的格子
      let rc = path[`${result.x},${result.y}`] as unknown as {
        x: number;
        y: number;
        step: number;
      };
      let isCantAttack = !result.canAttack;
      if (rc) {
        let speed = ModifierSystem.getInstance().getValueStack(unit, "speed").finalValue;
        
        if (isCantAttack) {
          //如果不能攻击,检查是否为拥堵情况
          let noUnit = false;
          while (!noUnit && rc) {
            //如果是拥堵情况，往前找到不拥堵位置为止
            rc = path[`${rc.x},${rc.y}`] as unknown as {
              x: number;
              y: number;
              step: number;
            };
            noUnit = true;
            golbalSetting?.map?.sprites.forEach((sprite) => {
              const spriteX = Math.floor(sprite.x / tileSize);
              const spriteY = Math.floor(sprite.y / tileSize);
              if (rc && rc.x === spriteX && rc.y === spriteY && sprite.state !== "dead") {
                noUnit = false;
              }
            });
            console.log(`AI单位 ${unit.name} 在 `+rc+` 位置拥堵，继续寻找`);
          }
        }
        if (rc && rc.step > speed) {
          console.log(
            `AI单位 ${unit.name} 的步数 ${rc.step} 超过速度 ${speed}`
          );
          isCantAttack = true; //如果步数大于速度，就不能攻击
          let least = rc.step - speed;
          while (least > 0) {
            result.x = rc.x;
            result.y = rc.y;
            rc = path[`${result.x},${result.y}`] as unknown as {
              x: number;
              y: number;
              step: number;
            };
            least--;
          }
        }
        console.log("AI停止路径:", path[`${result.x},${result.y}`], result);
        if (rc) {
          await UnitMove.moveMovement(result.x, result.y, unit, path);
        }
      }

      console.log("aiUnit state", unit);
      if (!isCantAttack) {
        const attack = unit.creature?.attacks[0];
        const enemyX = Math.floor(result.target.x / tileSize);
        const enemyY = Math.floor(result.target.y / tileSize);
        if (attack) {
          await UnitAttack.attackMovementToXY(enemyX, enemyY, unit, attack, map);
        }
      }
    }

    InitiativeController.endTurn(unit);
    // Implement the logic for the AI to automatically take actions
  }
  async opportunityAttack(targetUnit: Unit) {
    //  alert(`单位 ${targetUnit.name} 触发了借机攻击！`);
    if (!this.owner) {
      console.warn("AI owner is not defined.");
      return;
    }
    if (!this.owner.creature?.attacks[0]) {
      console.warn("AI owner has no attacks defined.");
      return;
    }
    const enemyX = Math.floor(targetUnit.x / tileSize);
    const enemyY = Math.floor(targetUnit.y / tileSize);
    console.log(`AI单位尝试攻击: (${enemyX}, ${enemyY})`);
    // 执
    await UnitAttack.attackMovementToUnit(
      targetUnit,
      this.owner,
      this.owner.creature?.attacks[0],
      golbalSetting.map
    );

  }
}

function findAttackTarget(
  nx: number,
  ny: number,
  x: number,
  y: number,
  unit: Unit,
  tiledMap: TiledMap,
  result: any
) {
  //没找到敌人就继续寻找
  let continueFind = true;
  let passiable = true;
  if (tiledMap) {
    passiable = UnitMoveController.checkPassiable(
      unit,
      x * tileSize,
      y * tileSize,
      nx * tileSize,
      ny * tileSize,
      tiledMap
    );
  }
  if (!passiable) {
    return false; // 如果不可通行，直接返回
  }
  let noUnit = true;
  tiledMap.sprites.forEach((sprite) => {
    if (sprite === unit) {
      return; // 如果是自己就跳过
    }
    const spriteX = Math.floor(sprite.x / tileSize);
    const spriteY = Math.floor(sprite.y / tileSize);
    if (x === spriteX && y === spriteY&&sprite.state !== "dead") {
      //如果这个点有单位
      noUnit = false; //有单位
    }
  });
  tiledMap.sprites.forEach((sprite) => {
    if (sprite === unit||sprite.state === "dead") {
      return; // 如果是自己就跳过
    }
    const spriteX = Math.floor(sprite.x / tileSize);
    const spriteY = Math.floor(sprite.y / tileSize);
    if (sprite.party !== unit.party) {
      let attackable = checkEdges(tiledMap, spriteX, spriteY, x, y);
      //检测敌人是否在这个触及内,并且无障碍
      const dx = Math.abs(spriteX - x);
      const dy = Math.abs(spriteY - y);
      const dis = Math.max(dx, dy);

      if (dis <= (unit.creature?.attacks[0].range ?? 1) && attackable) {
        //找到了就不需要继续寻找了,并且这个点没别人
        if (noUnit) {
          continueFind = false;
          result.canAttack = true;
        }
        result.x = x;
        result.y = y;
        result.target = sprite;
      }
    }
  });
  return continueFind;
}

function checkEdges(
  tiledMap: TiledMap,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  let passiable = true; // 默认可通行
  if (tiledMap) {
    const edges = tiledMap.edges;
    // 检查是否穿过边
    if (edges) {
      // console.log(edges)
      // 检查是否有对象在指定位置
      // 遍历对象组中的所有对象
      edges.forEach((edge) => {
        if (edge.useable === false) {
          return; // 如果边不可用，则跳过
        }
        // 检查中点的连线
        if (
          segmentsIntersect(
            x1 * tileSize + 32,
            y1 * tileSize + 32,
            x2 * tileSize + 32,
            y2 * tileSize + 32,
            edge.x1,
            edge.y1,
            edge.x2,
            edge.y2
          )
        ) {
          passiable = false; // 如果中点的连线与边相交，则不可通行
          return; // 如果不可通行，则跳出循环
        }
      });
    }
  } else {
    return false;
  }
  return passiable;
}
