import * as AttackSystem from "../system/AttackSystem";
import * as AttackController from "../controller/UnitAttackController";
import * as InitiativeSystem from "../system/InitiativeSystem";
import * as PIXI from "pixi.js";
import type { TiledMap } from "../MapClass";
import type { Unit } from "@/core/units/Unit";
import * as MoveController from "../controller/UnitMoveController";
import * as UnitMoveSystem from "../system/UnitMoveSystem";
import * as DoorSystem from "../system/DoorSystem";
import type { RLayers } from "../type/RLayersInterface";
let oldselectionBox: PIXI.Graphics | null = null;

export const UnitRightEvent = (
  event: PIXI.FederatedPointerEvent,
  unit: Unit,
  container: PIXI.Container<PIXI.ContainerChild>,
  rlayers: RLayers,
  mapPassiable: TiledMap | null
) => {
  event.stopPropagation();
  //判断控制权
  const controlable = InitiativeSystem.checkIsTurn(unit);
  if (!controlable) {
    console.warn("当前不是该单位的回合，无法进行操作");
    return;
  }
  if (unit.party !== "player") {
    return; // 只处理玩家单位的右键事件
  }

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

  let boxX = unit.x + unit.width + 10;
  if (boxX + boxWidth > container.width) {
    // 如果选择框超出右边界，则调整位置
    boxX = unit.x - boxWidth - 10;
  }
  let boxY = unit.y - boxHeight / 2 + unit.height / 2;
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
  const options = ["结束回合"];
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
    label.on("pointerenter", () => {
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
    });
    label.on("pointertap", () => {
      // alert(`选择了: ${text}`);

      if (text == "结束回合") {
        InitiativeSystem.endTurn(unit);
      }
      const childSelectionBox =
        selectionBox.getChildByLabel("childSelectionBox");
      if (childSelectionBox) {
        if (childSelectionBox instanceof PIXI.Graphics) {
          childSelectionBox.clear();
        }
        selectionBox.removeChild(childSelectionBox);
      }
      selectionBox.clear();
      container.removeChild(selectionBox);
    });

    selectionBox.addChild(label);
  });
  const moveLabel = MoveController.getMoveLabel(
    unit,
    container,
    mapPassiable,
    options,
    selectionBox,
    rlayers
  );
  if (moveLabel) {
    selectionBox.addChild(moveLabel);
    options.push(moveLabel.text);
  }
  const attackControlLabels = AttackController.getAttackControlLabels(
    unit,
    container,
    mapPassiable,
    options,
    selectionBox,
    rlayers
  );
  if (attackControlLabels) {
    attackControlLabels.forEach((label) => {
      selectionBox.addChild(label);
      options.push(label.text);
    });
  }
  //如果附近有门，那么增加开门选择
  console.log("mapPassiable", mapPassiable);
  const doorControlLabels = DoorSystem.getDoorControlLabels(
    unit,
    container,
    mapPassiable,
    options,
    selectionBox,
    rlayers
  );
  doorControlLabels.forEach((label) => {
    selectionBox.addChild(label);
  });
  //绘制选择框
  container.addChild(selectionBox);
  rlayers.selectLayer.attach(selectionBox);
  oldselectionBox = selectionBox;
  // 监听右键点击事件，取消选择
  const removeSelection = () => {
    if (oldselectionBox) {
      const childSelectionBox =
        selectionBox.getChildByLabel("childSelectionBox");

      console.log("selectionBox", selectionBox);
      console.log("childSelectionBox", childSelectionBox);
      if (childSelectionBox) {
        if (childSelectionBox instanceof PIXI.Graphics) {
          childSelectionBox.clear();
        }
        oldselectionBox.removeChild(childSelectionBox);
        childSelectionBox.destroy();
      }
      container.removeChild(oldselectionBox);
      container.off("rightdown", removeSelection);
      oldselectionBox = null;
    }
  };
  container.on("rightdown", removeSelection);
};
