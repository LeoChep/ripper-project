import { Point } from "./point";
import { Rectangle } from "./rectangle";
import { Segment } from "./segment";
//分割线段
export function splitSegmentByEachOther(segments: Segment[]): Segment[] {
  const list: Segment[] = [];
  for (let i = 0; i < segments.length; i++) {
    list.push(segments[i]);
  }
  let head = 0;
  let checkAt = 1;
  let tail = list.length;
  while (head < tail) {
    checkAt = head + 1;
    while (checkAt <= tail) {
      const segment = list[head];
      const intersectPoint = segmentsIntersect(segment, list[head]);
      //检测是否时端点，如果时端点，不分割
      if (intersectPoint) {
        if (
          (intersectPoint.x === segment.p1.x &&
            intersectPoint.y === segment.p1.y) ||
          (intersectPoint.x === segment.p2.x &&
            intersectPoint.y === segment.p2.y)
        ) {
          continue;
        }
      }
      if (intersectPoint) {
        const splitedSegments = splitSegment(segment, intersectPoint);
        list[head] = splitedSegments[0];
        list.push(splitedSegments[1]);
      }
      checkAt++;
    }
    head++;
  }
  return list;
}

//检测线段是否相交，返回交点，如果不相交，返回null
export function segmentsIntersect(
  segment1: Segment,
  segment2: Segment
): Point | null {
  // 解构变量，简化公式书写
  const { p1: A, p2: B } = segment1;
  const { p1: C, p2: D } = segment2;

  // 计算分母：denominator = (Dy - Cy)(Bx - Ax) - (Dx - Cx)(By - Ay)
  const denominator = (D.y - C.y) * (B.x - A.x) - (D.x - C.x) * (B.y - A.y);

  // 处理分母为 0 的情况（线段平行，无交点或重合）
  if (denominator === 0) {
    return null;
  }

  // 计算 s：正确公式（原代码中 t 错误复用了 s 的公式）
  const s =
    ((D.x - C.x) * (A.y - C.y) - (D.y - C.y) * (A.x - C.x)) / denominator;

  // 计算 t：正确公式（与 s 不同）
  const t =
    ((B.x - A.x) * (A.y - C.y) - (B.y - A.y) * (A.x - C.x)) / denominator;

  // 判断 s 和 t 是否都在 [0, 1] 范围内（线段相交的核心条件）
  if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
    // 计算交点坐标
    return {
      x: A.x + s * (B.x - A.x),
      y: A.y + s * (B.y - A.y),
    };
  }

  // 不相交则返回 null
  return null;
}
//线段相交时，将他们分为两段
export function splitSegment(segment: Segment, point: Point): Segment[] {
  return [
    new Segment(segment.p1.x, segment.p1.y, point.x, point.y),
    new Segment(point.x, point.y, segment.p2.x, segment.p2.y),
  ];
}
export function getSegments(
  room: Rectangle,
  lightSource: Point,
  blocks: Rectangle[],
  walls: Segment[]
) {
  const segments: Segment[] = [];
  for (const segment of room.getCornerSegments()) {
    segments.push(segment);
  }
  for (const block of blocks) {
    for (const segment of block.getCornerSegments()) {
      segments.push(segment);
    }
  }
  for (const segment of walls) {
    segments.push(segment);
  }
  console.log("初始线段", segments);
  //   const splitSegments = splitSegmentByEachOther(segments);
  //   console.log("分割完毕", splitSegments);
  return segments;
}
//做扫描线
export function createScanLineSegments(point: Point, room: Rectangle) {
  const segments: Segment[] = [];
  const lineLength = Math.max(room.width, room.height) * 2;
  for (let i = 0; i < 360; i += 1) {
    const radians = i * (Math.PI / 180);
    const dx = Math.cos(radians);
    const dy = Math.sin(radians);
    const x = point.x + dx * lineLength; // 扫描线长度
    const y = point.y + dy * lineLength;
    const segment = new Segment(point.x, point.y, x, y);
    segment.d = i;
    segments.push(segment);
  }
  return segments;
}
export function getView(
  lightSource: Point,
  segments: Segment[],
  room: Rectangle
) {
  const scanLineSegments = createScanLineSegments(lightSource, room);
  // 这里可以添加更多的逻辑来处理视图
  //找到扫描线交点
  for (const scanSegment of scanLineSegments) {
    let shortLineValue = room.width * room.width + room.height * room.height;
    for (const segment of segments) {
      // 检测 scanSegment 和 segment 是否相交
      // 如果相交，计算交点并更新 scanSegment 的终点
      // 这里需要实现线段相交的算法
      const intersectionPoint = segmentsIntersect(scanSegment, segment);
      if (intersectionPoint) {
        // 更新 scanSegment 的终点为交点
        let lineValue =
          (intersectionPoint.x - lightSource.x) *
            (intersectionPoint.x - lightSource.x) +
          (intersectionPoint.y - lightSource.y) *
            (intersectionPoint.y - lightSource.y);
        if (lineValue < shortLineValue) {
          shortLineValue = lineValue;
          scanSegment.p2.x = intersectionPoint.x;
          scanSegment.p2.y = intersectionPoint.y;
        }
      }
    }
  }
  const points = [] as Point[];

  //寻找线段端点，增加精度，防止扫描线略过的额问题
  const splitSegments = splitSegmentByEachOther(segments);
  for (const segment of splitSegments) {
    const p1 = segment.p1;
    const p2 = segment.p2;
    console.log("检测端点", p1, p2);
    if (checkSeePoint(lightSource, p1, segments)) {
      //   points.push(p1);
      console.log("添加端点", p1);
      const line = new Segment(lightSource.x, lightSource.y, p1.x, p1.y);
      // 计算线段与水平线的夹角
      line.d =
        Math.atan2(p2.y - lightSource.y, p2.x - lightSource.x) *
        (180 / Math.PI);
      if (line.d < 0) {
        line.d += 360;
      }
      scanLineSegments.push(line);
      //   line.d *= 10;
      //   line.d = line.d / 2;
    }
    if (checkSeePoint(lightSource, p2, segments)) {
      //   points.push(p2);
      console.log("添加端点", p2);
      const line = new Segment(lightSource.x, lightSource.y, p2.x, p2.y);
      // 计算线段与水平线的夹角

      //   console.log("添加端点线段", line);
      scanLineSegments.push(line);
      line.d =
        Math.atan2(p2.y - lightSource.y, p2.x - lightSource.x) *
        (180 / Math.PI);
      if (line.d < 0) {
        line.d += 360;
      }
      //   line.d *= 10;
      //   line.d = line.d / 2;
    }
  }
  for (const segment of scanLineSegments) {
    segment.d =
      Math.atan2(segment.p2.y - lightSource.y, segment.p2.x - lightSource.x) *
      (180 / Math.PI);
    segment.d *= 10;
  }
  //按照d排序，如果d相同，按照距离排序
  scanLineSegments.sort((a, b) => a.d - b.d);
  for (const scanSegment of scanLineSegments) {
    points.push(scanSegment.p2);
  }
  return points;
}
const checkSeePoint = (unit: Point, point: Point, segments: Segment[]) => {
  const line = new Segment(unit.x, unit.y, point.x, point.y);
  const seePointValue =
    (point.x - unit.x) * (point.x - unit.x) +
    (point.y - unit.y) * (point.y - unit.y);
  for (const segment of segments) {
    const intersectionPoint = segmentsIntersect(line, segment);
    if (intersectionPoint) {
      // 如果相交，更新最小可见值
      const lineValue =
        (intersectionPoint.x - unit.x) * (intersectionPoint.x - unit.x) +
        (intersectionPoint.y - unit.y) * (intersectionPoint.y - unit.y);
      if (lineValue < seePointValue) {
        return false;
      }
    }
  }
  return true;
};
const drawRectangle = (
  ctx: CanvasRenderingContext2D,
  color: string,
  rectangle: Rectangle
) => {
  ctx.save();
  ctx.strokeStyle = "red";
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
  ctx.strokeStyle = "red";
  ctx.moveTo(segment.p1.x, segment.p1.y);
  ctx.lineTo(segment.p2.x, segment.p2.y);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
};

export function drawView(
  viewPoints: Point[],
  width: number,
  height: number,
  ctx: CanvasRenderingContext2D
) {
  ctx.clearRect(-10000, -10000, 20000, 20000);

  // 绘制覆盖整个画布的黑色矩形

  drawRectangle(ctx, "black", new Rectangle(0, 0, width, height));
  // 设置合成模式为 destination-out，从黑色矩形中挖洞
  ctx.globalCompositeOperation = "destination-out";
  //
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(viewPoints[0].x, viewPoints[0].y);
  for (const point of viewPoints) {
    ctx.lineTo(point.x, point.y);
  }
  //   ctx.clip();
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // 恢复合成模式
  ctx.globalCompositeOperation = "source-over";

  // 绘制蓝色的障碍物矩形
  //   for (const block of blocks) {
  //     drawRectangle(ctx, "blue", block);
  //   }

  // 绘制红色的墙壁线段
  //   for (const wall of walls) {
  //     drawSegment(ctx, "red", wall);
  //   }
  //绘制扫描线
  //   for (const point of viewPoints) {
  //     drawSegment(ctx, "yellow", new Segment(unit.x, unit.y, point.x, point.y));
  //   }
}

export function getViews(
  lightSources: Point[],
  segments: Segment[],
  room: Rectangle
) {
  const splitSegments = splitSegmentByEachOther(segments);
  let views = [] as Point[][];
  for (const lightSource of lightSources) {
    const scanLineSegments = createScanLineSegments(lightSource, room);
    // 这里可以添加更多的逻辑来处理视图
    //找到扫描线交点
    let view = [] as Point[];
    for (const scanSegment of scanLineSegments) {
      let shortLineValue = room.width * room.width + room.height * room.height;
      for (const segment of segments) {
        // 检测 scanSegment 和 segment 是否相交
        // 如果相交，计算交点并更新 scanSegment 的终点
        // 这里需要实现线段相交的算法
        const intersectionPoint = segmentsIntersect(scanSegment, segment);
        if (intersectionPoint) {
          // 更新 scanSegment 的终点为交点
          let lineValue =
            (intersectionPoint.x - lightSource.x) *
              (intersectionPoint.x - lightSource.x) +
            (intersectionPoint.y - lightSource.y) *
              (intersectionPoint.y - lightSource.y);
          if (lineValue < shortLineValue) {
            shortLineValue = lineValue;
            scanSegment.p2.x = intersectionPoint.x;
            scanSegment.p2.y = intersectionPoint.y;
          }
        }
      }
    }
    //寻找线段端点，增加精度，防止扫描线略过的额问题

    for (const segment of splitSegments) {
      const p1 = segment.p1;
      const p2 = segment.p2;
      console.log("检测端点", p1, p2);
      if (checkSeePoint(lightSource, p1, segments)) {
        //   points.push(p1);
        console.log("添加端点", p1);
        const line = new Segment(lightSource.x, lightSource.y, p1.x, p1.y);
        // 计算线段与水平线的夹角
        line.d =
          Math.atan2(p2.y - lightSource.y, p2.x - lightSource.x) *
          (180 / Math.PI);
        if (line.d < 0) {
          line.d += 360;
        }
        scanLineSegments.push(line);
        //   line.d *= 10;
        //   line.d = line.d / 2;
      }
      if (checkSeePoint(lightSource, p2, segments)) {
        //   points.push(p2);
        console.log("添加端点", p2);
        const line = new Segment(lightSource.x, lightSource.y, p2.x, p2.y);
        // 计算线段与水平线的夹角

        //   console.log("添加端点线段", line);
        scanLineSegments.push(line);
        line.d =
          Math.atan2(p2.y - lightSource.y, p2.x - lightSource.x) *
          (180 / Math.PI);
        if (line.d < 0) {
          line.d += 360;
        }
        //   line.d *= 10;
        //   line.d = line.d / 2;
      }
    }
    for (const segment of scanLineSegments) {
      segment.d =
        Math.atan2(segment.p2.y - lightSource.y, segment.p2.x - lightSource.x) *
        (180 / Math.PI);
      segment.d *= 10;
    }
    //按照d排序，如果d相同，按照距离排序
    scanLineSegments.sort((a, b) => a.d - b.d);
    for (const scanSegment of scanLineSegments) {
      view.push(scanSegment.p2);
    }
    views.push(view);
  }

  return views;
}
export function drawViews(
  views: Point[][],
  width: number,
  height: number,
  ctx: CanvasRenderingContext2D
) {
  ctx.clearRect(-10000, -10000, 20000, 20000);

  // 绘制覆盖整个画布的黑色矩形

  drawRectangle(ctx, "black", new Rectangle(0, 0, width, height));
  // 设置合成模式为 destination-out，从黑色矩形中挖洞
  ctx.globalCompositeOperation = "destination-out";
  //
  ctx.save();
  for (const viewPoints of views) {
    ctx.beginPath();
    ctx.moveTo(viewPoints[0].x, viewPoints[0].y);
    for (const point of viewPoints) {
      ctx.lineTo(point.x, point.y);
    }
    //   ctx.clip();
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
  // 恢复合成模式
  ctx.globalCompositeOperation = "source-over";
}
