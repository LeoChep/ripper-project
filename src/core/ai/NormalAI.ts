import type { TiledMap } from "../MapClass";
import { Unit } from "../Unit";
import type { AIInterface } from "../type/AIInterface";
import * as InitiativeController from "../contoller/InitiativeController";
import { generateWays } from "../utils/PathfinderUtil";
import * as UnitMove from "../action/UnitMove";
import * as UnitMoveController from "../contoller/UnitMoveController";
import * as UnitAttack from "../action/UnitAttack";

const tileSize = 64; // 假设每个格子的大小为64像素
export class NormalAI implements AIInterface {
  constructor() {
    // Initialization code for NormalAI
  }

  // Method to handle AI actions
  async autoAction(unit: Unit, map: TiledMap) {
    //寻找目标
    // 这里可以实现AI的目标选择逻辑
    //用于存放结果
    const result: any = {};
    const unitX = Math.floor(unit.x / tileSize);
    const unitY = Math.floor(unit.y / tileSize);
    console.log(`AI单位位置: (${unitX}, ${unitY})`);
    const path = generateWays(
      unitX,
      unitY,
      99,
      (nx, ny, x, y) => {
        return findAttackPath(nx, ny, x, y, unit, map, result);
      },
      () => {
        if (result.target) {
          return true;
        } else {
          return false;
        }
      }
    );
    if (result.target) {
      const pathEntry = path ? path[`${result.x},${result.y}`] : null;
      // if (pathEntry && pathEntry.step != null) {
      //   alert(pathEntry.step);
      // }
    
      //移动
     await UnitMove.moveMovement(result.x, result.y, unit, path);
     const attack = unit.creature?.attacks[0];
     if (attack) {
       await UnitAttack.attackMovement(result.x, result.y, unit, attack, map);
     }
    }
    
    InitiativeController.endTurn(unit);
    // Implement the logic for the AI to automatically take actions
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
  let noHaveTarget = true;
  // nx = Math.floor(nx / tileSize);
  // ny = Math.floor(ny / tileSize);
  tiledMap.sprites.forEach((sprite) => {
    if (sprite.party !== unit.party) {
      //检测敌人是否在这个点
      const spriteX = Math.floor(sprite.x / tileSize);
      const spriteY = Math.floor(sprite.y / tileSize);
      console.log(`检测敌人: ${sprite.name} 在 (${spriteX}, ${spriteY})`);
      console.log(`检测敌人: ${sprite.name} 在 (${nx}, ${ny})`);
      if (spriteX === nx && spriteY === ny) {
        //找到了就不需要继续寻找了
        noHaveTarget = false;
        result.x = x;
        result.y = y;
        result.target = sprite;
        // console.log(`找到目标: ${sprite.name} 在 (${sprite.x}, ${sprite
      }
    }
  });
  return noHaveTarget;
}

function findAttackPath(
  nx: number,
  ny: number,
  x: number,
  y: number,
  unit: Unit,
  tiledMap: TiledMap,
  result: any
) {
  let passible = true;
  //从这个点开始寻找攻击目标
  const findAttackTargetResult: { target?: any } = {};
  generateWays(
    x,
    y,
    unit.creature?.attacks[0].range ?? 1,
    (nx, ny, preX, preY) => {
      return findAttackTarget(
        nx,
        ny,
        x,
        y,
        unit,
        tiledMap,
        findAttackTargetResult
      );
    }
  );
  if (findAttackTargetResult.target) {
    //如果找到了目标
    result.target = findAttackTargetResult.target;
    result.x = x;
    result.y = y;
    return false; // 找到目标后不需要继续寻找
  }
  //下一个点可否通行
  let movePassible = UnitMoveController.checkPassiable(
    unit,
    x * tileSize,
    y * tileSize,
    nx * tileSize,
    ny * tileSize,
    tiledMap
  );
  if (!movePassible) {
    return false; // 如果移动不可行，直接返回
  }

  return passible;
}
