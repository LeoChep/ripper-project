import { Point } from "./point";
import { Rectangle } from "./rectangle";
import { Segment } from "./segment";
import { EndPoint } from "./end-point";

const drawRectangle = (
  ctx: CanvasRenderingContext2D,
  color: string,
  rectangle: Rectangle
) => {
  ctx.save();
  ctx.strokeStyle = "black";
  ctx.fillStyle = color;
  ctx.fillRect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
  ctx.strokeRect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
  ctx.restore();
};

const drawSegment = (
  ctx: CanvasRenderingContext2D,
  color: string,
  segment: Segment
) => {
  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = "black";
  ctx.moveTo(segment.p1.x, segment.p1.y);
  ctx.lineTo(segment.p2.x, segment.p2.y);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
};

const drawVisibilityTriangles = (
  ctx: CanvasRenderingContext2D,
  color: string,
  lightSource: Point,
  visibilityOutput: Point[][]
) => {
  ctx.save();
  ctx.strokeStyle = color;
  for (const points of visibilityOutput) {
    ctx.beginPath();
    ctx.moveTo(lightSource.x, lightSource.y);
    ctx.lineTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
};

export const drawScene = (
  ctx: CanvasRenderingContext2D,
  lightSource: Point,
  blocks: Rectangle[],
  walls: Segment[],
  visibilityOutput: Point[][]
) => {
  ctx.clearRect(-10000, -10000, 20000, 20000);
  for (const block of blocks) {
    drawRectangle(ctx, "blue", block);
  }
  for (const wall of walls) {
    drawSegment(ctx, "red", wall);
  }
  drawVisibilityTriangles(ctx, "gray", lightSource, visibilityOutput);
};

export const drawSceneByPoints = (
  ctx: CanvasRenderingContext2D,
  units: Point[],
  blocks: Rectangle[],
  walls: Segment[],
  visibilityOutput: Point[][][]
) => {
  ctx.clearRect(-10000, -10000, 20000, 20000);



  // 绘制覆盖整个画布的黑色矩形
  drawRectangle(ctx, "black", new Rectangle(0, 0, 1000, 1000));

  // 设置合成模式为 destination-out，从黑色矩形中挖洞
  ctx.globalCompositeOperation = "destination-out";
  drawVisibilityTrianglesByPoint(ctx, "gray", units, visibilityOutput);

  // 恢复合成模式
  ctx.globalCompositeOperation = "source-over";
    // 绘制蓝色的障碍物矩形
  for (const block of blocks) {
    drawRectangle(ctx, "blue", block);
  }

  // 绘制红色的墙壁线段
  for (const wall of walls) {
    drawSegment(ctx, "red", wall);
  }
};

const drawVisibilityTrianglesByPoint = (
  ctx: CanvasRenderingContext2D,
  color: string,
  units: Point[],
  visibilityOutput: Point[][][]
) => {
  ctx.strokeStyle = color;
  ctx.lineJoin = "round"; // 设置线条连接样式为圆角，避免接缝

  ctx.beginPath(); // 开始一个新的路径，用于一次性绘制所有三角形

  for (let i = 0; i < units.length; i++) {
    const lightSource = units[i];
    const view = visibilityOutput[i];
    console.log("drawVisibilityTrianglesByPoint: 绘制单位", lightSource, "的视野", view);
    for (const points of view) {
      ctx.moveTo(lightSource.x, lightSource.y);
      ctx.lineTo(points[0].x, points[0].y);
      ctx.lineTo(points[1].x, points[1].y);
      console.log("drawVisibilityTrianglesByPoint: 绘制三角形", lightSource, points[0], points[1]);
    
    }
  }
    ctx.closePath();
  ctx.fill(); // 一次性填充所有路径，确保透明区域连续
  ctx.stroke();
  ctx.restore();
};
