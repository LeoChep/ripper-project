import type { TiledMap } from "../MapClass";
import type { Unit } from "../units/Unit";

import { segmentsIntersect } from "../utils/MathUtil";
import { generateWays } from "../utils/PathfinderUtil";
import * as PIXI from "pixi.js";
const tileSize = 64;
function calculateFogOfWar(unit: Unit, mapPassiable: TiledMap | null) {
  // 计算可视单元格
  const centerX = unit.x;
  const centerY = unit.y;
  const startX = Math.floor(centerX / tileSize);
  const startY = Math.floor(centerY / tileSize);
  const path = generateWays({
    start: { x: startX, y: startY },
    range: 20,
    checkFunction: (
      x: number,
      y: number,
      preX: number,
      preY: number
    ) => {
      return checkPassiable(
        unit,
        preX * tileSize,
        preY * tileSize,
        x * tileSize,
        y * tileSize,
        mapPassiable
      );
    }
  });
  return path;
}

function makeMaskShapOfVersion(path: {
  [x: string]: { x: number; y: number; step: number } | null;
}) {
  const graphics = new PIXI.Graphics();
  if (path) {
    Object.keys(path).forEach((key) => {
      const [x, y] = key.split(",").map(Number);
      const drawX = x * tileSize;
      const drawY = y * tileSize;
      graphics.rect(drawX, drawY, tileSize, tileSize);
      graphics.fill({ color: 0xff0000 });
    });
  }
  return graphics;
}
export const checkPassiable = (
  unit: Unit,
  prex: number,
  prey: number,
  x: number,
  y: number,
  mapPassiable: TiledMap | null
) => {
  if (!mapPassiable) {
    return false;
  }
  const mapWidth = mapPassiable.width * mapPassiable.tilewidth;
  const mapHeight = mapPassiable.height * mapPassiable.tileheight;
  if (x < 0 || y < 0 || x >= mapWidth || y >= mapHeight) {
    return false;
  }

  // console.log(
  //   `检查可视性: 单位位置 (${unit.x}, ${unit.x}), 目标位置 (${x}, ${y})`
  // );
  // 检查单位是否在地图上
  let passiable = true;
  let testx = x;
  let testy = y;
  const pointsA = [
    { x: unit.x, y: unit.y },
    { x: unit.x + 64, y: unit.y },
    { x: unit.x + 64, y: unit.y + 64 },
    { x: unit.x, y: unit.y + 64 },
  ];
  const pointsB = [
    { x: testx, y: testy },
    { x: testx + 64, y: testy },
    { x: testx + 64, y: testy + 64 },
    { x: testx, y: testy + 64 },
  ];
  if (mapPassiable) {
    const edges = mapPassiable.edges;
    // 检查是否穿过边
    let intersectCount = 0;
    if (edges) {
      // console.log(edges)
      // 检查是否有对象在指定位置
      // 遍历对象组中的所有对象
      let visited=[false,false,false,false] //目标的四角可否看见 
      for (let i = 0; i < 4; i++)
        for (let j = 0; j < 4; j++) {
            let visable = true;
          edges.forEach((edge) => {
            if (edge.useable === false) {
              return; // 如果边不可用，则跳过
            }
            if (
              segmentsIntersect(
                pointsA[i].x,
                pointsA[i].y,
                pointsB[j].x,
                pointsB[j].y,
                edge.x1,
                edge.y1,
                edge.x2,
                edge.y2
              )
            ) {
              //这条连线不行
              visable=false
              return
            }
          });
            if (visable) {
                //如果这条连线可行
                intersectCount++;
                //记录这个角可以看到
                visited[j]=true;
            }
        }
      if (visited[0] || visited[1] || visited[2] || visited[3]) {
        passiable = true;
        // return passiable;
      }
      else {
        passiable = false;
        return passiable;
      }
    }
  }

  return passiable;
};
export const makeFog = (
  mapPassiable: TiledMap,
  rlayers: {
    basicLayer?: PIXI.IRenderLayer;
    spriteLayer?: PIXI.IRenderLayer;
    lineLayer: any;
    selectLayer?: PIXI.IRenderLayer;
    controllerLayer?: PIXI.IRenderLayer;
  },
  containers: PIXI.Container<PIXI.ContainerChild>,
  unit: Unit
) => {
  // 创建一个覆盖整个地图的黑色层
  const fogOfWar = new PIXI.Graphics();
  fogOfWar.rect(0, 0, 1200, 900); // 比屏幕稍大
  fogOfWar.fill({ color: 0x000000, alpha: 0.8 }); // 黑色半透明
  let now = new Date();
  console.log(
    "开始计算可见区域",
    now.toLocaleTimeString() +
      "." +
      now.getMilliseconds().toString().padStart(3, "0")
  );
  // 创建视野圆形 - 相对于角色位置
  const fogPath = calculateFogOfWar(unit, mapPassiable);
  const visionCircle = makeMaskShapOfVersion(fogPath);
  console.log("视野路径", fogPath);
  // 应用遮罩
  // fogOfWar.setMask({ mask: visionCircle, inverse: true }); // 反转遮罩

  // 创建容器来管理遮罩
  // const maskContainer = new PIXI.Container();
  // maskContainer.addChild(visionCircle); // 先添加遮罩
  // maskContainer.addChild(fogOfWar); // 再添加被遮罩的对象

  // // 将整个容器添加到舞台，而不是分别添加
  // containers.addChild(maskContainer);
  //令遮罩不影响事件

  // 令遮罩不影响其下方的事件发生

  // 将战争迷雾附加到渲染层
  // rlayers.lineLayer.attach(fogOfWar);
  now = new Date();
  console.log(
    "结束计算可见区域",
    now.toLocaleTimeString() +
      "." +
      now.getMilliseconds().toString().padStart(3, "0")
  );
  return visionCircle;
};

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

) => {
    const edge= mapPassiable.edges;
    const unit=mapPassiable.sprites[0];
    if (!unit) return;
    const maskContainer = makeFog(mapPassiable, rlayers, containers, unit);
  return 
};