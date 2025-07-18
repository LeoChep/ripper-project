import type { TiledMap } from "../MapClass";
import { Unit } from "../units/Unit";
import type { AIInterface } from "../type/AIInterface";
import * as InitiativeController from "../system/InitiativeSystem";
import { generateWays } from "../utils/PathfinderUtil";
import * as UnitMove from "../action/UnitMove";
import * as UnitMoveController from "../system/UnitMoveSystem";
import * as UnitAttack from "../action/UnitAttack";
import { segmentsIntersect } from "../utils/MathUtil";

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
      //移动
      
      await UnitMove.moveMovement(result.x, result.y, unit, path);
      console.log('aiUnit state',unit)
      const attack = unit.creature?.attacks[0];
      const enemyX = Math.floor(result.target.x / tileSize);
      const enemyY = Math.floor(result.target.y / tileSize);
      if (attack) {
        await UnitAttack.attackMovement(enemyX, enemyY, unit, attack, map);
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
  let passiable = true;
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
            nx * tileSize + 32,
            ny * tileSize + 32,
            x * tileSize + 32,
            y * tileSize + 32,
            edge.x1,
            edge.y1,
            edge.x2,
            edge.y2
          )
        ) {
          passiable = false; // 如果中点的连线与边相交，则不可通行
          return; // 如果不可通行，则跳过
        }
      });
    }
  }
  if (!passiable) {
    return false; // 如果不可通行，直接返回
  }
  tiledMap.sprites.forEach((sprite) => {
    if (sprite.party !== unit.party) {
      //检测敌人是否在这个点
      const spriteX = Math.floor(sprite.x / tileSize);
      const spriteY = Math.floor(sprite.y / tileSize);

      if (spriteX === nx && spriteY === ny) {
        //找到了就不需要继续寻找了
        noHaveTarget = false;
        result.x = x;
        result.y = y;
        result.target = sprite;
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
