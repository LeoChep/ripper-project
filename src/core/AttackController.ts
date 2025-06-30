import type { CreatureAttack } from "@/units/Creature";
import { distance } from "./DoorController";
import type { TiledMap } from "./MapClass";
import type { RLayers } from "./RLayersInterface";
import type { Unit } from "./Unit";
import * as PIXI from "pixi.js";

export const getAttackControlLabels = (
  unit: Unit,
  container: PIXI.Container<PIXI.ContainerChild>,
  mapPassiable: TiledMap | null,
  options: string[],
  selectionBox: PIXI.Graphics,
  rlayers: RLayers
) => {
  const labels: PIXI.Text[] = [];
  let text = "攻击";
  const label = new PIXI.Text({
    text: `${text}`,
    style: {
      fontFamily: "Arial",
      fontSize: 12,
      fill: 0xffffff,
      align: "center",
    },
  });
  const boxWidth = 40;
  const boxHeight = 80;
  label.x = boxWidth / 2 - label.width / 2;
  label.y = 8 + options.length * 20;
  label.eventMode = "static";
  label.cursor = "pointer";
  const childSelectionBox = new PIXI.Graphics();
  label.on("pointerenter", () => {
    if (selectionBox) {
      const childSelectionBox =
        selectionBox.getChildByLabel("childSelectionBox");
      if (childSelectionBox) {
        if (childSelectionBox instanceof PIXI.Graphics) {
          childSelectionBox.clear();
        }
        if (childSelectionBox.children) {
          childSelectionBox.children.forEach((child) => {
            if (child instanceof PIXI.Text) {
              child.destroy();
            }
          });
        }
        selectionBox.removeChild(childSelectionBox);
      }
    }
    // childSelectionBox.clear();
    const boxWidth = 40;
    const boxHeight = 80;
    let boxX = boxWidth + 10;

    let boxY = 0;

    // 绘制竖排选择框背景
    childSelectionBox.x = boxX;
    childSelectionBox.y = boxY;

    childSelectionBox.roundRect(0, 0, boxWidth, boxHeight, 12);
    childSelectionBox.fill({ color: 0x333366, alpha: 0.9 });
    selectionBox.addChild(childSelectionBox);
    childSelectionBox.label = "childSelectionBox";

    // 示例：添加三个选项
    const attacks = unit.creature?.attacks;
    if (attacks) {
      attacks.forEach((attack, i) => {
        const text = attack.name;
        const optionLabel = new PIXI.Text({
          text,
          style: {
            fontFamily: "Arial",
            fontSize: 12,
            fill: 0xffffff,
            align: "center",
          },
        });
        optionLabel.x = boxWidth / 2 - optionLabel.width / 2;
        optionLabel.y = 8 + i * 20;
        optionLabel.eventMode = "static";
        optionLabel.cursor = "pointer";
        optionLabel.on("pointertap", () => {
          // 执行攻击逻辑
          console.log(`选择了攻击选项: ${text}`);
          const range = attack.range ? attack.range : 1;
          attackSelect(
            unit,
            attack,
            container,
            rlayers.lineLayer,
            mapPassiable
          );
          container.removeChild(selectionBox);
          if (childSelectionBox.parent) {
            childSelectionBox.parent.removeChild(childSelectionBox);
          }
        });
        childSelectionBox.addChild(optionLabel);
      });
    }
  });

  labels.push(label);
  return labels;
};
const attackSelect = (
  unit: Unit,
  attack: CreatureAttack,
  container: PIXI.Container<PIXI.ContainerChild>,
  lineLayer: PIXI.IRenderLayer,
  mapPassiable: TiledMap | null
) => {
  //显示红色的可移动范围
  const range = attack.range ? attack.range : 1; // 默认攻击范围为1
  const tileSize = 64;
  const graphics = new PIXI.Graphics();
  graphics.alpha = 0.4;
  graphics.zIndex = 1000;
  const spriteUnit = unit.animUnit;
  console.log("spriteUnits", unit);
  if (!spriteUnit) {
    return;
  }
  console.log(`动画精灵位置: (${spriteUnit.x}, ${spriteUnit.y})`);
  //
  const centerX = spriteUnit.x;
  const centerY = spriteUnit.y;
  //使用切比雪夫距离绘制
  // 使用广度优先搜索(BFS)绘制可移动范围，并记录路径
  const visited = new Set<string>();
  const queue: { x: number; y: number; step: number }[] = [];
  const startX = Math.floor(centerX / tileSize);
  const startY = Math.floor(centerY / tileSize);

  // 用二维数组记录每个格子的前驱节点
  const path: { [key: string]: { x: number; y: number } | null } = {};

  queue.push({ x: startX, y: startY, step: 0 });
  visited.add(`${startX},${startY}`);
  path[`${startX},${startY}`] = null;

  while (queue.length > 0) {
    const { x, y, step } = queue.shift()!;
    if (step >= range) continue;

    // 八方向扩展
    const dirs = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
      { dx: 1, dy: 1 },
      { dx: -1, dy: -1 },
      { dx: 1, dy: -1 },
      { dx: -1, dy: 1 },
    ];
    for (const dir of dirs) {
      // 检查是否是对角线方向
      if (dir.dx * dir.dx + dir.dy * dir.dy > 1) {
        // 如果是对角线方向，检查是否是拐角,拐角则不可对角线移动
        if (dir.dx < 0 && dir.dy < 0) {
          // 左上角
          if (
            path[`${x - 1},${y}`] === undefined ||
            path[`${x},${y - 1}`] === undefined
          ) {
            continue; // 如果左或上不可通行，则跳过
          }
        }
        if (dir.dx > 0 && dir.dy < 0) {
          // 右上角
          if (
            path[`${x + 1},${y}`] === undefined ||
            path[`${x},${y - 1}`] === undefined
          ) {
            continue; // 如果右或上不可通行，则跳过
          }
        }
        if (dir.dx < 0 && dir.dy > 0) {
          // 左下角
          if (
            path[`${x - 1},${y}`] === undefined ||
            path[`${x},${y + 1}`] === undefined
          ) {
            continue; // 如果左或下不可通行，则跳过
          }
        }
        if (dir.dx > 0 && dir.dy > 0) {
          // 右下角
          if (
            path[`${x + 1},${y}`] === undefined ||
            path[`${x},${y + 1}`] === undefined
          ) {
            continue; // 如果右或下不可通行，则跳过
          }
        }
      }
      const nx = x + dir.dx;
      const ny = y + dir.dy;
      const key = `${nx},${ny}`;
      const passiable = true;
      if (passiable) {
        if (!visited.has(key)) {
          queue.push({ x: nx, y: ny, step: step + 1 });
          visited.add(key);
          path[key] = { x, y }; // 记录前驱
        }
      }
    }
  }
  // 绘制可移动范围
  graphics.clear();
  if (path) {
    Object.keys(path).forEach((key) => {
      const [x, y] = key.split(",").map(Number);
      const drawX = x * tileSize;
      const drawY = y * tileSize;
      graphics.rect(drawX, drawY, tileSize, tileSize);
      graphics.fill({ color: 0xff0000 });
    });
  }
  // path 是一个以 "x,y" 为 key 的对象，记录每个格子的前驱节点
  graphics.eventMode = "static";

  container.addChild(graphics);
  lineLayer.attach(graphics);
  // 点击其他地方移除移动范围
  const removeGraphics = () => {
    if (graphics.parent) {
      graphics.parent.removeChild(graphics);
    }
    container.off("pointerup", removeGraphics);
  };
  let cannel = false;
  graphics.on("rightdown", (e) => {
    e.stopPropagation();
    console.log("rightdown");
    cannel = true;
    removeGraphics();
  });
  graphics.on("pointerup", (e) => {
    console.log("pointerup");
    e.stopPropagation();
    removeGraphics();
    if (cannel) {
      return;
    }
    attackMovement(e, unit, attack, container, mapPassiable);
    // moveMovement(e, unit, container, path);
  });

  container.on("pointerup", removeGraphics);
};

async function attackMovement(
  e: PIXI.FederatedPointerEvent,
  unit: Unit,
  attack: CreatureAttack,
  container: PIXI.Container<PIXI.ContainerChild>,
  mapPassiable: TiledMap | null
) {
  e.stopPropagation();
  const spriteUnit = unit.animUnit;
  if (!spriteUnit) {
    console.error("动画精灵不存在");
    return;
  }
  // 获取点击位置
  const clickX = e.data.global.x;
  const clickY = e.data.global.y;

  // 检查点击位置是否在可攻击范围内
  const targetX = Math.floor(clickX / 64);
  const targetY = Math.floor(clickY / 64);

  // 检查目标位置是否在地图范围内
  if (mapPassiable && mapPassiable.sprites) {
    const target = mapPassiable.sprites.find((sprite) => {
      const spriteX = Math.floor(sprite.x / 64);
      const spriteY = Math.floor(sprite.y / 64);
      const inrange = spriteX === targetX && spriteY === targetY;
      console.log(
        `检查目标位置: (${spriteX}, ${spriteY}) 是否在攻击范围内: (${targetX}, ${targetY}) - 结果: ${inrange}`
      );
      // 检查
      return inrange;
    });
    // 执行攻击逻辑
    console.log(target);
    // if (target) alert("attack " + target?.name);

    let direction = unit.direction;
    const spriteUnitX = Math.floor(unit.x / 64); // 假设动画
    const spriteUnitY = Math.floor(unit.y / 64); // 假设动画
    const dx = targetX - spriteUnitX;
    const dy = targetY - spriteUnitY;
    //设置朝向
    if (Math.abs(dx) >= Math.abs(dy) && Math.abs(dx) > 0) {
      // 水平移动
      direction = dx > 0 ? 0 : 1; // 0向右, 1向左
    } else if (Math.abs(dy) > Math.abs(dx)) {
      // 垂直移动
      direction = dy > 0 ? 2 : 3; // 2向下, 3向上
    }
    console.log(
      `单位 ${unit.name} 攻击方向: ${direction}，目标位置: (${targetX}, ${targetY}), dx: ${dx}, dy: ${dy}`
    );
    // 设置动画精灵的新位置
    unit.direction = direction;
    if (unit.animUnit) {
      unit.animUnit.state = "slash";
    }
    const animEndPromise = new Promise<void>((resolve) => {
      if (unit.animUnit) {
        unit.animUnit.animationCallback = resolve;
      }
    });
    animEndPromise.then(() => {
      if (unit.animUnit) {
        unit.animUnit.anims[unit.animUnit.state]?.stop();
        // unit.animUnit.state = "walk"; // 恢复为行走状态
        setTimeout(() => {
          // 延时一段时间后恢复为行走状态
          if (unit.animUnit&&unit.animUnit.anims["walk"]) {
            unit.animUnit.state = "walk"; // 恢复为行走状态
          }
        }, 100); // 延时100毫秒
      }
      // alert(
      //   `单位 ${unit.name} 攻击目标: ${target?.name}，位置: (${targetX}, ${targetY})`
      // );
    });

    console.log(`单位 ${unit.name} 攻击目标位置: (${targetX}, ${targetY})`);
  }
}
