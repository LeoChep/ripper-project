import type { TiledMap } from "../MapClass";
import { Unit } from "../units/Unit";
import type { AIInterface } from "../type/AIInterface";
import * as InitiativeController from "../system/InitiativeSystem";
import { generateWays, generateWaysAsync } from "../utils/PathfinderUtil";
import * as UnitMove from "../action/UnitMove";
import * as UnitMoveSystem from "../system/UnitMoveSystem";
import * as AttackSystem from "../system/AttackSystem";
import * as UnitAttack from "../action/UnitAttack";
import * as InitiativeSysteam from "../system/InitiativeSystem";
import { segmentsIntersect } from "../utils/MathUtil";
import { golbalSetting } from "../golbalSetting";
import { ModifierSystem } from "../system/ModifierSystem";
import { UnitSystem } from "../system/UnitSystem";
import { BuffSystem } from "../system/BuffSystem";
import { testDraw } from "../anim/DrawTest";

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
    console.log("AI行动:", unit);
    //检测倒立起立
    standAI(unit);
    const initiative = unit.initiative;

    const result: any = { canAttack: false };
    const unitX = Math.floor(unit.x / tileSize);
    const unitY = Math.floor(unit.y / tileSize);

    // 使用异步版本，真正不阻塞渲染
    //先检查原地
    console.log("AI检查原地攻击:", unitX, unitY, result);
    const findAttackTargetByUnitResult = findAttackTargetByUnit(
      unitX,
      unitY,
      unitX,
      unitY,
      unit,
      map,
      result
    );
    console.log("AI检查原地攻击:", unitX, unitY, result);
    let path: any = {};
    if (result.canAttack) {
      path[`${result.x},${result.y}`] = null;
      console.log("AI原地就能攻击，攻击目标:", result.target);
    } else {
      path = await generateWaysAsync({
        start: { x: unitX, y: unitY },
        range: 20,
        checkFunction: (nx: number, ny: number, x: number, y: number) => {
          return findAttackTargetByUnit(nx, ny, x, y, unit, map, result);
        },
        endCheckFunction: () => {
          if (result.target && result.canAttack) {
            return true;
          } else {
            return false;
          }
        },
      });
    }
    console.log(
      "AI路径计算结果:",
      path,
      path[`${result.x},${result.y}`],
      result
    );

    if (result.target && path) {
      let lastStep = path[`${result.x},${result.y}`] as unknown as {
        x: number;
        y: number;
        step: number;
      };
      let stepnum = 0;
      if (lastStep?.step) stepnum = lastStep.step;
      let rc = { x: result.x, y: result.y, step: stepnum };
      console.log("AI最终路径点:", rc);
      //移动
      //计算可以移动到的格子
      //  rc = path[`${result.x},${result.y}`] as unknown as {
      //   x: number;
      //   y: number;
      //   step: number;
      // };
      let isCantAttack = !result.canAttack;
      //粗暴的用于跳出
      for (let num = 1; num < 2; num++)
        if (rc) {
          if (!InitiativeSysteam.useMoveAction(unit)) {
            break;
          }

          let speed = ModifierSystem.getInstance().getValueStack(
            unit,
            "speed"
          ).finalValue;

          if (isCantAttack) {
            //如果不能攻击,检查是否为拥堵情况
            console.log(
              "不能攻击，检测是否为拥堵情况:",
              rc,
              unitX,
              unitY,
              unit
            );
            let noUnit = false;
            while (!noUnit && rc) {
              //如果是拥堵情况，往前找到不拥堵位置为止
              const moveEndGrids = UnitSystem.getInstance().getGridsBySize(
                rc.x,
                rc.y,
                unit.creature?.size ?? "middle"
              );
              noUnit = true;

              for (let grid of moveEndGrids) {
                const findUnit = UnitSystem.getInstance().findUnitByGridxy(
                  grid.x,
                  grid.y
                );
                if (
                  rc &&
                  findUnit &&
                  findUnit !== unit &&
                  findUnit.state !== "dead"
                ) {
                  noUnit = false;
                }
              }
              console.log(
                "检测拥堵位置的格子:",
                moveEndGrids,
                rc,
                unitX,
                unitY,
                unit
              );
              if (rc && !noUnit) {
                // testDraw(rc.x, rc.y, "red");
                console.log(
                  `AI单位 ${unit.name} ${unit.id} 在 `,
                  rc,
                  ` 位置拥堵，继续寻找`,
                  rc.step
                );
                rc = path[`${rc.x},${rc.y}`] as unknown as {
                  x: number;
                  y: number;
                  step: number;
                };
              }
            }
          }

          const range = unit.creature?.attacks[0].range ?? 1;
          console.log(
            unit.creature?.name,
            "AI最终移动位置:",
            rc,
            "是否能攻击:",
            range
          );
          if (rc && rc.step > speed) {
            console.log(
              `AI单位 ${unit.name} 的步数 ${rc.step} 超过速度 ${speed} + 攻击范围 ${range}，无法攻击，寻找可攻击位置`,
              rc
            );
            isCantAttack = true; //如果步数大于速度，就不能攻击
            console.log(
              `AI单位 ${unit.name} 的步数 ${rc.step} 超过速度 ${speed} + 攻击范围 ${range}，无法攻击`
            );
          }
          if (rc) {
            result.x = rc.x;
            result.y = rc.y;
            console.log(
              `AI单位 ${unit.name} 的步数 ${rc.step} 超过速度 ${speed}`
            );

            let least = rc.step - speed;
            //需要修改为从可以开始攻击的位置开始回退，而不是从攻击目标位置
            //TODO 最好加上一个保护，least太多使得rc到null
            while (least > 0) {
              rc = path[`${result.x},${result.y}`] as unknown as {
                x: number;
                y: number;
                step: number;
              };

              least--;
              result.x = rc.x;
              result.y = rc.y;
              console.log(
                `AI单位 ${unit.name} 由于速度限制，向前调整一步，`,
                rc
              );
              if (least === 0) {
                //移动力使用殆尽，使用标准动作继续移动
                // if (InitiativeController.useMoveAction(unit)) {
                //   least = ModifierSystem.getInstance().getValueStack(
                //     unit,
                //     "speed",
                //   ).finalValue;
                // }
              }
            }
          }
          console.log(
            "AI停止路径:",
            path[`${result.x},${result.y}`],
            result,
            path
          );
        }
      if (rc) {
        await UnitMove.moveMovement(result.x, result.y, unit, path);
      }
      console.log("aiUnit state", unit);
      console.log("AI攻击目标:", result.target);
      if (!InitiativeSysteam.useStandAction(unit)) {
        isCantAttack = true;
      }
      console.log(
        "AI攻击检查 - 是否能攻击:",
        !isCantAttack,
        "攻击结果:",
        result,
        unit
      );
      if (!isCantAttack) {
        const attack = unit.creature?.attacks[0];
        const enemyX = Math.floor(result.target.x / tileSize);
        const enemyY = Math.floor(result.target.y / tileSize);
        console.log(
          `AI单位 ${unit.name} 准备攻击:`,
          attack,
          "目标坐标:",
          enemyX,
          enemyY,
          attack
        );
        if (attack) {
          console.log(
            `AI单位 ${unit.name} 执行攻击:`,
            attack,
            "目标坐标:",
            enemyX,
            enemyY
          );
          await UnitAttack.attackMovementToXY(
            enemyX,
            enemyY,
            unit,
            attack,
            map
          );
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
    //TODO 需要专门抽象出函数方法来判断阵营是否友好
    let isFriendlyNpc = false;
    if (targetUnit?.party == "player" && this.owner.friendly) {
      isFriendlyNpc = true;
    }
    if (isFriendlyNpc) return;
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
function standAI(unit: Unit) {
  let pronedBuff;
  unit.creature?.buffs.forEach((buff) => {
    if (buff.name === "Proned") {
      pronedBuff = buff;
    }
  });
  if (pronedBuff) {
    if (InitiativeSysteam.useMoveAction(unit)) {
      BuffSystem.getInstance().removeBuff(pronedBuff, unit);
    }
  }
}

function generateAttackRangeGrids(
  grids: { x: number; y: number }[],
  range: number,
  size: string,
  unitSettingx: number,
  unitSettingy: number
): { [key: string]: boolean } {
  const attakRangeWays: { [key: string]: boolean } = {};

  for (const grid of grids) {
    const centerX = grid.x;
    const centerY = grid.y;

    // 遍历以当前格子为中心的 range*range 矩阵
    for (let dx = -range; dx <= range; dx++) {
      for (let dy = -range; dy <= range; dy++) {
        const targetX = centerX + dx;
        const targetY = centerY + dy;
        const key = `${targetX},${targetY}`;

        // 检查是否可通过
        if (
          AttackSystem.checkPassiableBySize(
            size,
            unitSettingx,
            unitSettingy,
            targetX,
            targetY
          )
        ) {
          attakRangeWays[key] = true;
        }
      }
    }
  }

  return attakRangeWays;
}
function findAttackTargetByUnitMap(
  unit: Unit,
  settingx: number,
  settingy: number,
  range: number
) {
  const units = UnitSystem.getInstance().getAllUnits();
  const ememyUnits: Unit[] = [];
  units.forEach((checkUnit) => {
    //TODO 需要专门抽象出函数方法来判断阵营是否友好
    let isFriendlyNpcCheckPlayer = false;
    if (checkUnit.party === "player" && unit.friendly) {
      isFriendlyNpcCheckPlayer = true;
    }
    if (
      checkUnit.party !== unit.party &&
      checkUnit.state !== "dead" &&
      !isFriendlyNpcCheckPlayer
    ) {
      ememyUnits.push(checkUnit);
    }
  });
  const size = unit?.creature?.size ? unit.creature.size : "middle";
  const result: any = { canAttack: false };
  for (let enemyUnit of ememyUnits) {
    // if (result.canAttack) {
    //   break;
    // }
    const grids = UnitSystem.getInstance().getUnitGrids(enemyUnit);
    for (const grid of grids) {
      // if (result.canAttack) {
      //   break;
      // }
      const passable = AttackSystem.checkPassiableBySize(
        size,
        settingx,
        settingy,
        grid.x,
        grid.y
      );
      const dis = Math.max(
        Math.abs(grid.x - settingx),
        Math.abs(grid.y - settingy)
      );
      if (passable && dis <= range) {
        result.canAttack = true;
        result.target = enemyUnit;
      }
      console.log(
        "在AI地图中寻找攻击目标:",
        unit,
        enemyUnit,
        grid,
        passable,
        dis
      );
    }
  }

  return result;
}
function findAttackTargetByUnit(
  nx: number,
  ny: number,
  x: number,
  y: number,
  unit: Unit,
  tiledMap: TiledMap,
  result: any
): boolean {
  let passiable = true;
  if (tiledMap) {
    passiable = UnitMoveSystem.checkPassiable(
      unit,
      x * tileSize,
      y * tileSize,
      nx * tileSize,
      ny * tileSize,
      tiledMap
    );
  }
  console.log("AI检查攻击目标格子1:", nx, ny, "通行性:", passiable);
  if (!passiable) {
    console.log(
      `AI单位 ${unit.name} 检测攻击目标时，路径不可通行: (${x}, ${y}) -> (${nx}, ${ny})`
    );
    return false; // 如果不可通行，直接返回
  }
  let noUnit = true;
  //判断是否有单位阻止你站在这里
  const moveEndGrids = UnitSystem.getInstance().getGridsBySize(
    nx,
    ny,
    unit.creature?.size ?? "middle"
  );
  console.log("AI单位", unit.name, "移动结束格子:", moveEndGrids);
  for (let grid of moveEndGrids) {
    const findUnit = UnitSystem.getInstance().findUnitByGridxy(grid.x, grid.y);
    if (findUnit && findUnit !== unit && findUnit.state !== "dead") {
      noUnit = false;
    }
  }
  console.log("noUnit:", noUnit, moveEndGrids, nx, ny, unit);
  //获得攻击范围内格子

  const unitSettingx = nx;
  const unitSettingy = ny;
  const range = unit.creature?.attacks[0].range ?? 1;
  console.log(unit, "AI检查攻击目标格子:", nx, ny, "攻击范围:", range);
  //遍历格子
  for (let grid of moveEndGrids) {
    const findR = findAttackTargetByUnitMap(unit, grid.x, grid.y, range);
    console.log(nx, ny, "AI检查攻击目标格子428:", grid.x, grid.y, findR);
    const findUnitInThisPoint = findR.target;

    if (findUnitInThisPoint) {
      if (
        findUnitInThisPoint === unit ||
        findUnitInThisPoint.state === "dead"
      ) {
        continue;
      }
      if (findUnitInThisPoint.party === unit.party) {
        continue;
      }
      if (findUnitInThisPoint.party === "player" && unit.friendly == true) {
        continue;
      }

      // 找到了单位
      if (noUnit) {
        result.x = unitSettingx;
        result.y = unitSettingy;
        result.target = findUnitInThisPoint;
        result.canAttack = true;
      }

      result.x = unitSettingx;
      result.y = unitSettingy;
      result.target = findUnitInThisPoint;

      console.log(unit, "AI找到攻击目标:", result, findUnitInThisPoint, unit);
      break;
    }
  }

  return true;
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
    passiable = UnitMoveSystem.checkPassiable(
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
  //判断是否有单位阻止你站在这里
  const moveEndGrids = UnitSystem.getInstance().getGridsBySize(
    x,
    y,
    unit.creature?.size ?? "middle"
  );

  for (let grid of moveEndGrids) {
    const findUnit = UnitSystem.getInstance().findUnitByGridxy(grid.x, grid.y);
    if (findUnit && findUnit !== unit && findUnit.state !== "dead") {
      noUnit = false;
    }
  }
  console.log("noUnit:", noUnit, moveEndGrids, x, y, unit);
  //获得攻击范围内格子
  const size = unit?.creature?.size ? unit.creature.size : "middle";
  const grids = UnitSystem.getInstance().getGridsBySize(x, y, size);
  const unitSettingx = x;
  const unitSettingy = y;
  const range = unit.creature?.attacks[0].range ?? 1;

  const attakRangeWays = generateAttackRangeGrids(
    grids,
    range,
    size,
    unitSettingx,
    unitSettingy
  );
  console.log(unit, "AI攻击范围格子:", attakRangeWays);
  Object.keys(attakRangeWays).forEach((key) => {
    console.log("ATTACKTANGEWAY'", key);
    const [x, y] = key.split(",").map(Number);
    const findUnitInThisPoint = UnitSystem.getInstance().findUnitByGridxy(x, y);
    console.log(
      unit,
      unit.name + "AI检查攻击目标格子:" + key,
      findUnitInThisPoint
    );

    if (findUnitInThisPoint) {
      if (
        findUnitInThisPoint === unit ||
        findUnitInThisPoint.state === "dead"
      ) {
        return; // 如果是自己就跳过
      }
      if (findUnitInThisPoint.party === unit.party) {
        return;
      }
      if (findUnitInThisPoint)
        console.log(
          unit,
          unit.name + "找到攻击目标:" + key + "!!!",

          findUnitInThisPoint
        );
      // 找到了单位
      if (noUnit) {
        continueFind = false;
        result.canAttack = true;
      }
      console.log(unit, "AI找到攻击目标:", findUnitInThisPoint, unit);
      result.x = unitSettingx;
      result.y = unitSettingy;
      result.target = findUnitInThisPoint;
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
