import type { TiledMap } from "../MapClass";
import type { RLayers } from "../type/RLayersInterface";
import type { Unit } from "../Unit";
import * as PIXI from "pixi.js";

export const getDoorControlLabels = (
  spriteUnit: Unit,
  container: PIXI.Container<PIXI.ContainerChild>,
  mapPassiable: TiledMap | null,
  options: string[],
    selectionBox: PIXI.Graphics,
    rlayers:RLayers
) => {
    const labels: PIXI.Text[]=[]
  if (mapPassiable && mapPassiable.doors) {
    const doors = mapPassiable.doors;

    if (doors.length > 0) {
      doors.forEach((door, i) => {
        // 检查门是否在选择框范围内
        const doorX = door.x1 + (door.x2 - door.x1) / 2;
        const doorY = door.y1 + (door.y2 - door.y1) / 2;
        if (distance(doorX, doorY, spriteUnit.x + 32, spriteUnit.y + 32) > 64) {
          return; // 如果门不在选择框范围内，则跳过
        }
        let text = "开门";
        if (door.useable === false) {
          text = "关门";
        }
        const label = new PIXI.Text({
          text: `${text} ${i + 1}`,
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
        label.y = 8 + (options.length + i) * 20;
        label.eventMode = "static";
        label.cursor = "pointer";
        const graphics = new PIXI.Graphics();
        label.on("pointertap", () => {
          //alert(`选择了: ${text} ${i + 1}`);
          door.useable = !door.useable; // 设置边不再阻挡
          container.removeChild(selectionBox);
          if (graphics.parent) {
            graphics.parent.removeChild(graphics);
          }
        });
        label.on("pointerenter", () => {
            graphics.clear()
          graphics.alpha = 0.4;
          graphics.zIndex = 1000;
          graphics.rect(
            door.x1 - 5,
            door.y1 - 5,
            door.x2 - door.x1 + 5,
            door.y2 - door.y1 + 5
          );
          graphics.fill({ color: 0xff0000 });
          container.addChild(graphics);
          const lineLayer = rlayers.lineLayer
          lineLayer.attach(graphics);
          label.once("pointerleave", () => {
            if (graphics.parent) {
              graphics.parent.removeChild(graphics);
            }
          });
        });
        labels.push(label);
      });
    }
  }
  return labels;
};

//计算两点间距离的函数
export const distance = (x1: number, y1: number, x2: number, y2: number) => {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
};
