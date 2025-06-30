import type { CreatureAttack } from "@/units/Creature";
import { distance } from "./DoorController";
import type { TiledMap } from "./MapClass";
import type { RLayers } from "./RLayersInterface";
import type { Unit } from "./Unit";
import * as PIXI from "pixi.js";
import { DiceCommand } from "./dice_modules/dices/commandMoudle/DiceCommand";
import { diceRoll } from "./DiceTryer";
import hitURL from "@/assets/effect/Impact_03_Regular_Yellow_400x400.webm";
import missHRL from "@/assets/effect/Miss_02_White_200x200.webm";
import { takeDamage } from "./DamageController";
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

    // 添加选项
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
      const passiable = checkPassiable(
        unit,
        startX * 64,
        startX * 64,
        nx * 64,
        ny * 64,
        mapPassiable
      );
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
    attackMovement(e, unit, attack, lineLayer, container, mapPassiable);
    // moveMovement(e, unit, container, path);
  });

  container.on("pointerup", removeGraphics);
};

async function attackMovement(
  e: PIXI.FederatedPointerEvent,
  unit: Unit,
  attack: CreatureAttack,
  lineLayer: PIXI.IRenderLayer,
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
  // 获取点击位置
  const pos = e.data.global;
  // 计算点击位置相对于动画精灵的偏移
  const clickX = pos.x - container.x;
  const clickY = pos.y - container.y;

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
    let hitFlag = false;
    let damage = 0;
    if (target) {
      hitFlag = await checkHit(unit, target, attack);
      createMissOrHitAnimation(unit, target, hitFlag, container, lineLayer);

      if (hitFlag) {
        damage = await getDamage(unit, target, attack);
        createDamageAnim(
          damage.toString(),
          unit,
          target,
          hitFlag,
          container,
          lineLayer
        );
      }
    }
    // hitFlag = true;

    //播放攻击动画
    await playAttackAnim(unit, targetX, targetY);

    console.log(`单位 ${unit.name} 攻击目标位置: (${targetX}, ${targetY})`);
    //结算
    if (target) {
      if (hitFlag) {
        //  alert("攻击命中!");
        takeDamage(damage, target, container);
      } else {
        // alert("攻击未命中!");
      }
    }
  }
}

async function playAttackAnim(unit: Unit, targetX: number, targetY: number) {
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
  const framesEndPromise = new Promise<void>((resolve) => {
    if (unit.animUnit) {
      unit.animUnit.animationCallback = resolve;
    }
  });
  let animEndResolve: (value: void | PromiseLike<void>) => void;
  const animEndPromise = new Promise<void>((resolve) => {
    animEndResolve = resolve;
  });
  framesEndPromise.then(() => {
    if (unit.animUnit) {
      unit.animUnit.anims[unit.animUnit.state]?.stop();
      // unit.animUnit.state = "walk"; // 恢复为行走状态
      setTimeout(() => {
        // 延时一段时间后恢复为行走状态
        if (unit.animUnit && unit.animUnit.anims["walk"]) {
          unit.animUnit.state = "walk"; // 恢复为行走状态
          animEndResolve();
        }
      }, 100); // 延时100毫秒
    }
  });

  return animEndPromise;
}

async function checkHit(unit: Unit, target: any, attack: CreatureAttack) {
  // 检查攻击是否命中
  const attackBonus = attack.attackBonus || 0; // 攻击加值
  const targetAC = target.creature?.ac || 10; // 目标护甲等级，默认10

  const roll = parseInt(await diceRoll("1d20+" + attackBonus));
  console.log(`攻击掷骰: ${roll} vs AC ${targetAC}`);
  if (roll >= targetAC) {
    console.log("攻击命中!");

    return true; // 命中
  } else {
    console.log("攻击未命中!");
    return false; // 未命中
  }
}

async function createMissOrHitAnimation(
  unit: Unit,
  target: { x: number; y: number },
  hitFlag: boolean,
  container: PIXI.Container<PIXI.ContainerChild>,
  lineLayer: PIXI.IRenderLayer
) {
  let texture: PIXI.Texture;
  let video: HTMLVideoElement | null = null;

  video = document.createElement("video");
  if (hitFlag) {
    video.src = hitURL;
  } else {
    video.src = missHRL;
  }

  video.loop = false;
  video.autoplay = false;
  video.muted = true;
  await video.play(); // 兼容自动播放策略
  texture = PIXI.Texture.from(video);
  if (video) {
    console.log("重播");
    video.currentTime = 0;
    video.play();
  }
  console.log("texturetexture", texture);
  const sprite = new PIXI.Sprite(texture);
  // 设置 sprite 位置和大小
  if (hitFlag) {
    sprite.x = target.x - 32;
    sprite.y = target.y - 32;
  } else {
    sprite.x = target.x - 32;
    sprite.y = target.y - 90;
  }
  // alert(video.width)
  sprite.scale = (1 / (sprite.width / 64)) * 2;
  // sprite.width=64
  // sprite.height=64
  // alert(sprite.width)
  container.addChild(sprite);
  lineLayer.attach(sprite);
  setTimeout(() => {
    container.removeChild(sprite);
  }, 1000);
}

async function createDamageAnim(
  damage: string,
  unit: Unit,
  target: { x: number; y: number },
  hitFlag: boolean,
  container: PIXI.Container<PIXI.ContainerChild>,
  lineLayer: PIXI.IRenderLayer
) {
  const damageText = new PIXI.Text({
    text: `-${damage}`,
    style: {
      fontFamily: "Arial",
      fontSize: 24,
      fill: 0xffffff,
      // align: "center",
    },
  });

  damageText.x = target.x + 32 - damageText.width / 2;
  damageText.y = target.y;

  container.addChild(damageText);
  lineLayer.attach(damageText);

  const duration = 800;
  const startY = damageText.y;
  const endY = startY - 40;
  const startAlpha = 1;
  const endAlpha = 0;

  let startTime: number | null = null;

  function animateDamageText(ts: number) {
    if (startTime === null) startTime = ts;
    const elapsed = ts - startTime;
    const t = Math.min(elapsed / duration, 1.2);

    damageText.y = startY + (endY - startY) * t;
    damageText.alpha = startAlpha + (endAlpha - startAlpha) * t;

    if (t < 1.2) {
      requestAnimationFrame(animateDamageText);
    } else {
      container.removeChild(damageText);
      damageText.destroy();
    }
  }

  requestAnimationFrame(animateDamageText);
}

async function getDamage(unit: Unit, target: any, attack: CreatureAttack) {
  // 检查攻击是否命中
  const attackBonus = attack.attackBonus || 0; // 攻击加值
  const targetAC = target.creature?.ac || 10; // 目标护甲等级，默认10

  const roll = parseInt(await diceRoll(attack.damage));
  console.log(`攻击掷骰: ${roll} vs AC ${targetAC}`);
  return roll;
}

export const checkPassiable = (
  unit: Unit,
  prex: number,
  prey: number,
  x: number,
  y: number,
  mapPassiable: TiledMap | null
) => {
  let passiable = true;
  if (mapPassiable) {
    const edges = mapPassiable.edges;
    // 检查是否穿过边
    if (edges) {
      // console.log(edges)
      // 检查是否有对象在指定位置
      // 遍历对象组中的所有对象
      edges.forEach((edge) => {
        if (edge.useable === false) {
          return; // 如果边不可用，则跳过
        }
        let testx = x;
        let testy = y;

        // 获取两个格子的四个顶点和中点
        const pointsA = [
          { x: prex + 32, y: prey + 32 },
          { x: prex, y: prey },
          { x: prex + 64, y: prey },
          { x: prex + 64, y: prey + 64 },
          { x: prex, y: prey + 64 },
        ];
        const pointsB = [
          { x: testx + 32, y: testy + 32 },
          { x: testx, y: testy },
          { x: testx + 64, y: testy },
          { x: testx + 64, y: testy + 64 },
          { x: testx, y: testy + 64 },
        ];
        // 检查所有中点的连线
        let intersectCount = 0;
        for (let i = 0; i < 1; i++) {
          if (
            segmentsIntersect(
              pointsA[i].x,
              pointsA[i].y,
              pointsB[i].x,
              pointsB[i].y,
              edge.x1,
              edge.y1,
              edge.x2,
              edge.y2
            )
          ) {
            intersectCount++;
          }
        }
        if (intersectCount >= 1) {
          passiable = false;
          return;
        }
      });
    }
    // 检查是否被敌人阻挡
  }

  return passiable;
};
const segmentsIntersect = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  x4: number,
  y4: number
) => {
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (denom === 0) {
    return false; // 平行或重合
  }
  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
  return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1; // 判断是否在有效范围内
};
