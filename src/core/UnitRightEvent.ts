import * as PIXI from "pixi.js";
import type { TiledMap } from "./MapClass";
import type { Unit } from "@/core/Unit";
import * as MoveController from "./UnitMoveController";
import * as DoorController from "./DoorController";
import type { RLayers } from "./RLayersInterface";
let oldselectionBox: PIXI.Graphics | null = null;

export const UnitRightEvent = (
  event: PIXI.FederatedPointerEvent,
  unit: Unit,
  container: PIXI.Container<PIXI.ContainerChild>,
  rlayers: RLayers,
  mapPassiable: TiledMap | null
) => {
  event.stopPropagation();

  const spriteUnit = unit.animUnit;
  if (!spriteUnit) {
    console.error("动画精灵不存在");
    return;
  }
  // 如果之前有选择框，先移除它
  if (oldselectionBox) {
    container.removeChild(oldselectionBox);
    oldselectionBox = null;
  }

  const selectionBox = new PIXI.Graphics();
  const boxWidth = 40;
  const boxHeight = 80;

  let boxX = spriteUnit.x + spriteUnit.width + 10;
  if (boxX + boxWidth > container.width) {
    // 如果选择框超出右边界，则调整位置
    boxX = spriteUnit.x - boxWidth - 10;
  }
  let boxY = spriteUnit.y - boxHeight / 2 + spriteUnit.height / 2;
  if (boxY < 0) {
    // 如果选择框超出上边界，则调整位置
    boxY = 0;
  } else if (boxY + boxHeight > container.height) {
    // 如果选择框超出下边界，则调整位置
    boxY = container.height - boxHeight;
  }
  // 绘制竖排选择框背景
  selectionBox.x = boxX;
  selectionBox.y = boxY;

  selectionBox.roundRect(0, 0, boxWidth, boxHeight, 12);
  selectionBox.fill({ color: 0x333366, alpha: 0.9 });

  // 示例：添加三个选项
  const options = ["攻击", "移动", "取消"];
  options.forEach((text, i) => {
    const label = new PIXI.Text({
      text,
      style: {
        fontFamily: "Arial",
        fontSize: 12,
        fill: 0xffffff,
        align: "center",
      },
    });
    label.x = boxWidth / 2 - label.width / 2;
    label.y = 8 + i * 20;
    label.eventMode = "static";
    label.cursor = "pointer";
    label.on("pointertap", () => {
     // alert(`选择了: ${text}`);
      if (text == "移动") {
        MoveController.moveSelect(unit, container, rlayers.lineLayer, mapPassiable);
      }
      container.removeChild(selectionBox);
    });

    selectionBox.addChild(label);
  });
  //如果附近有门，那么增加开门选择
  console.log("mapPassiable", mapPassiable);
  const doorControlLabels=DoorController.getDoorControlLabels(unit,container,mapPassiable,options,selectionBox,rlayers);
  doorControlLabels.forEach((label) => {
    selectionBox.addChild(label);
  });
  //绘制选择框
  container.addChild(selectionBox);
  rlayers.selectLayer.attach(selectionBox);
  oldselectionBox = selectionBox;
  // 监听右键点击事件，取消选择
  container.once("rightdown", () => {
    if (oldselectionBox) {
      container.removeChild(oldselectionBox);
      oldselectionBox = null;
    }
  });

};



