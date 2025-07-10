import type { CreatureAttack } from "@/units/Creature";
import { segmentsIntersect } from "../utils/MathUtil";
import type { TiledMap } from "../MapClass";
import type { RLayers } from "../type/RLayersInterface";
import type { Unit } from "../Unit";
import * as PIXI from "pixi.js";
import { playerSelectAttackMovement } from "../action/UnitAttack";
import { generateWays } from "../utils/PathfinderUtil";

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
  const startX = Math.floor(centerX / tileSize);
  const startY = Math.floor(centerY / tileSize);
  const path = generateWays(startX, startY, range, (x, y, preX, preY) => {
    return checkPassiable(
      unit,
      preX * tileSize,
      preY * tileSize,
      x * tileSize,
      y * tileSize,
      mapPassiable
    );
  });
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
    playerSelectAttackMovement(e, unit, attack, mapPassiable);
    // moveMovement(e, unit, container, path);
  });

  container.on("pointerup", removeGraphics);
};

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
  }

  return passiable;
};
