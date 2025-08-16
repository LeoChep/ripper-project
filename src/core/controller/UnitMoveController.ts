import * as envSetting from './../envSetting';
import type { TiledMap } from "../MapClass";
import type { RLayers } from "../type/RLayersInterface";
import * as PIXI from "pixi.js";
import type { Unit } from "../units/Unit";

import * as UnitMoveSystem from "../system/UnitMoveSystem";
import { playerSelectMovement } from "../action/UnitMove";
import { useInitiativeStore } from "@/stores/initiativeStore";
import { generateWays } from "../utils/PathfinderUtil";
import { golbalSetting } from "../golbalSetting";

export function getMoveLabel(
  unit: Unit,
  container: PIXI.Container<PIXI.ContainerChild>,
  mapPassiable: TiledMap | null,
  options: string[],
  selectionBox: PIXI.Graphics,
  rlayers: RLayers
) {
  console.log("getMoveLabel", unit.initiative?.moveActionNumber);
  if ((unit.initiative?.moveActionNumber ?? 0) <= 0) {
    return;
  }
  const boxWidth = 40;
  const boxHeight = 80;
  const label = new PIXI.Text({
    text: `移动`,
    style: {
      fontFamily: "Arial",
      fontSize: 12,
      fill: 0xffffff,
      align: "center",
    },
  });
  label.x = boxWidth / 2 - label.width / 2;
  label.y = 8 + options.length * 20;
  label.eventMode = "static";
  label.cursor = "pointer";
  label.on("pointerenter", () => {
    const childSelectionBox = selectionBox.getChildByLabel("childSelectionBox");
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
  });
  label.on("pointertap", () => {
    // alert(`选择了: ${text}`);
    moveSelect(unit, container, rlayers.lineLayer, mapPassiable);

    const childSelectionBox = selectionBox.getChildByLabel("childSelectionBox");
    if (childSelectionBox) {
      if (childSelectionBox instanceof PIXI.Graphics) {
        childSelectionBox.clear();
      }
      selectionBox.removeChild(childSelectionBox);
    }
    selectionBox.clear();
    container.removeChild(selectionBox);
  });

  return label;
}
export const moveSelect = (
  unit: Unit,
  container: PIXI.Container<PIXI.ContainerChild>,
  lineLayer: PIXI.IRenderLayer,
  mapPassiable: TiledMap | null
) => {
  //显示可移动范围
  const range = unit.creature?.speed ?? 0;
  const tileSize = 64;
  const graphics = new PIXI.Graphics();
  graphics.alpha = 0.4;
  graphics.zIndex = envSetting.zIndexSetting.mapZindex;
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
  // path 是一个以 "x,y" 为 key 的对象，记录每个格子的前驱节点
  const path = generateWays({
    start: { x: startX, y: startY },
    range: range,
    checkFunction: (x: number, y: number, preX: number, preY: number) => {
      return UnitMoveSystem.checkPassiable(
        unit,
        preX * tileSize,
        preY * tileSize,
        x * tileSize,
        y * tileSize,
        mapPassiable
      );
    }
  });
  // 绘制可移动范围
  graphics.clear();
  if (path) {
    Object.keys(path).forEach((key) => {
      const [x, y] = key.split(",").map(Number);
      const drawX = x * tileSize;
      const drawY = y * tileSize;
      graphics.rect(drawX, drawY, tileSize, tileSize);
      graphics.fill({ color: 0x66ccff });
    });
  }

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
    
    playerSelectMovement(e, unit, path,{});
    if (
      unit.initiative &&
      typeof unit.initiative.moveActionNumber === "number"
    ) {
      unit.initiative.moveActionNumber = unit.initiative.moveActionNumber - 1;
      useInitiativeStore().updateActionNumbers(
        unit.initiative.standerActionNumber,
        unit.initiative.minorActionNumber,
        unit.initiative.moveActionNumber
      );
      console.log(`剩余移动次数: ${unit.initiative.moveActionNumber}`);
    }
  });

  container.on("pointerup", removeGraphics);
};
