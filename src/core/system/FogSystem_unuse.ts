import type { TiledMap } from "../MapClass";
import type { Unit } from "../Unit";

import { segmentsIntersect } from "../utils/MathUtil";
import { generateWays } from "../utils/PathfinderUtil";
import * as PIXI from "pixi.js";
const tileSize = 64;
export const caculteFog=(  mapPassiable: TiledMap,
  rlayers: {
    basicLayer?: PIXI.IRenderLayer;
    spriteLayer?: PIXI.IRenderLayer;
    lineLayer: any;
    selectLayer?: PIXI.IRenderLayer;
    controllerLayer?: PIXI.IRenderLayer;
  },
  containers: PIXI.Container<PIXI.ContainerChild>,
  unit:Unit)=>{
 const edge = mapPassiable.edges;


  // 计算单位的视野范围
  const visionRadius =  20; // 假设单位有vision属性，单位为格

  // 单位中心点
  const unitCenter = {
    x: unit.x + tileSize / 2,
    y: unit.y + tileSize / 2,
  };

  // 生成所有可见点
  const visiblePoints: {
    [key: string]: { x: number; y: number } | null;
  } = {};
  const step = (2 * Math.PI) / 360; // 每度采样一次
  //打印时间
  const now = new Date();
  console.log(
    "开始计算可见区域",
    now.toLocaleTimeString() +
      "." +
      now.getMilliseconds().toString().padStart(3, "0")
  );
  for (let angle = 0; angle < 2 * Math.PI; angle += step) {
    for (let r = 0; r < visionRadius * tileSize; r += 1) {
      const px = unitCenter.x + Math.cos(angle) * r;
      const py = unitCenter.y + Math.sin(angle) * r;

      // 检查是否被墙体阻挡
      let blocked = false;
      for (const wall of edge) {
        if (wall.useable==true&&
          segmentsIntersect(
            unitCenter.x,
            unitCenter.y,
            px,
            py,
            wall.x1,
            wall.y1,
            wall.x2,
            wall.y2
          )
        ) {
          blocked = true;
          break;
        }
      }
      if (!blocked) {
        visiblePoints[`${angle}`] = { x: px, y: py };
      } else {
        break;
      }
    }
  }
  return visiblePoints;
}
export const makeFogOfWar = (
  mapPassiable: TiledMap,
  rlayers: {
    basicLayer?: PIXI.IRenderLayer;
    spriteLayer?: PIXI.IRenderLayer;
    lineLayer: any;
    selectLayer?: PIXI.IRenderLayer;
    controllerLayer?: PIXI.IRenderLayer;
  },
  containers: PIXI.Container<PIXI.ContainerChild>,
  unit:Unit
) => {
 
  const visiblePoints = caculteFog(mapPassiable, rlayers, containers, unit);

  // 绘制可见区域（挖洞）
  console.log("可见区域", visiblePoints);
      let mask = new PIXI.Graphics();
  if (
    visiblePoints &&
    Object.keys(visiblePoints).length > 2 &&
    visiblePoints["0"]
  ) {
    // 创建一个遮罩层


    // mask.rect(0, 0, 200, 200);
    mask.moveTo(visiblePoints["0"].x, visiblePoints["0"].y);
    console.log("visiblePoints", visiblePoints);

    for (const pt of Object.values(visiblePoints)) {
      if (pt) {
        mask.lineTo(pt.x, pt.y);
      }
    }

    mask.fill({ color: 0x00000, alpha: 1 });

  }
  const endnow = new Date();
  console.log(
    "结束计算可见区域",
    endnow.toLocaleTimeString() +
      "." +
      endnow.getMilliseconds().toString().padStart(3, "0")
  );
  return mask;
};

/**
 * 对PIXI.Container的边缘进行平滑处理（抗锯齿/羽化效果）。
 * 通过在container外围绘制半透明渐变遮罩实现。
 * @param container 需要平滑边缘的PIXI.Container
 * @param featherWidth 羽化宽度，像素
 */
export function  smoothContainerEdge(
  container: PIXI.Container,
  featherWidth: number = 16
) {
  const bounds = container.getLocalBounds();
  const mask = new PIXI.Graphics();

  // 绘制主区域
  mask.rect(bounds.x, bounds.y, bounds.width, bounds.height);
  mask.fill({ color: 0xffffff, alpha: 1 });

  // 绘制四条边的羽化渐变
  const gradientSteps = 8;
  for (let i = 1; i <= gradientSteps; i++) {
    const alpha = 1 - i / (gradientSteps + 1);
    const offset = (featherWidth * i) / gradientSteps;

    // 上
    mask.rect(bounds.x, bounds.y - offset, bounds.width, offset);
    mask.fill({ color: 0xffffff, alpha });

    // 下
    mask.rect(bounds.x, bounds.y + bounds.height, bounds.width, offset);
    mask.fill({ color: 0xffffff, alpha });

    // 左
    mask.rect(bounds.x - offset, bounds.y, offset, bounds.height);
    mask.fill({ color: 0xffffff, alpha });

    // 右
    mask.rect(bounds.x + bounds.width, bounds.y, offset, bounds.height);
    mask.fill({ color: 0xffffff, alpha });
  }

  container.mask = mask;
  container.addChild(mask);
}
