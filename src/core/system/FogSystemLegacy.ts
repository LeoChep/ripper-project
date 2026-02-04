/**
 * 战争迷雾系统 - 传统精确多边形绘制方法
 * 
 * 这个文件保留了基于精确多边形计算的战争迷雾绘制方法。
 * 相比网格采样法，这种方法：
 * - 优点：边缘更加精确平滑
 * - 缺点：计算量大，性能较低
 * 
 * 使用场景：
 * - 需要高精度视野边界的场合
 * - 性能要求不高时
 * - 作为网格采样法的对照和备选方案
 */

import type { Polygon } from "../../utils/visibility_polygon.js";
import polygonClipping from "polygon-clipping";

/**
 * 合并多个可视多边形为一个联合多边形
 * @param polygons 多个可视多边形数组
 * @returns 合并后的多边形数组（外环+内环的格式：[外环, 内环1, 内环2, ...]）
 */
export function mergeVisibilityPolygons(polygons: Polygon[]): Polygon[][] {
  if (polygons.length === 0) {
    return [];
  }
  
  if (polygons.length === 1) {
    return [polygons];
  }
  
  try {
    // 将Polygon格式转换为polygon-clipping库所需的格式
    const clipperPolygons: polygonClipping.Polygon[] = polygons.map(poly => {
      return [poly.map(point => [point[0], point[1]] as [number, number])];
    });
    
    // 执行union操作，将所有多边形合并
    const [first, ...rest] = clipperPolygons;
    const unionResult = rest.length > 0 
      ? polygonClipping.union(first, ...rest)
      : [first];
    
    // 转换回Polygon格式，保留所有环（外环+内环）
    const mergedPolygons: Polygon[][] = [];
    unionResult.forEach(multiPoly => {
      if (multiPoly.length > 0) {
        const rings: Polygon[] = [];
        multiPoly.forEach(ring => {
          rings.push(ring.map(point => [point[0], point[1]]));
        });
        mergedPolygons.push(rings);
      }
    });
    
    return mergedPolygons;
  } catch (error) {
    // 如果合并失败，返回原始多边形
    return polygons.map(p => [p]);
  }
}

/**
 * 收缩多边形，让战争迷雾向内扩散
 * @param polygon 原始多边形
 * @param shrinkAmount 收缩距离（像素）
 */
export function shrinkPolygon(polygon: Polygon, shrinkAmount: number): Polygon {
  if (polygon.length < 3 || shrinkAmount <= 0) {
    return polygon;
  }

  const result: Polygon = [];
  const len = polygon.length;

  for (let i = 0; i < len; i++) {
    const prev = polygon[(i - 1 + len) % len];
    const curr = polygon[i];
    const next = polygon[(i + 1) % len];

    // 计算两条边的法向量
    const v1 = [curr[0] - prev[0], curr[1] - prev[1]];
    const v2 = [next[0] - curr[0], next[1] - curr[1]];

    // 归一化法向量（逆时针旋转90度得到内法线）
    const len1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]);
    const len2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1]);
    
    if (len1 === 0 || len2 === 0) continue;

    const n1 = [-v1[1] / len1, v1[0] / len1]; // 内法线1
    const n2 = [-v2[1] / len2, v2[0] / len2]; // 内法线2

    // 平均法向量
    const avgN = [(n1[0] + n2[0]) / 2, (n1[1] + n2[1]) / 2];
    const avgLen = Math.sqrt(avgN[0] * avgN[0] + avgN[1] * avgN[1]);
    
    if (avgLen === 0) continue;

    // 沿平均法向量收缩
    result.push([
      curr[0] + (avgN[0] / avgLen) * shrinkAmount,
      curr[1] + (avgN[1] / avgLen) * shrinkAmount
    ]);
  }

  return result.length >= 3 ? result : polygon;
}

/**
 * 使用精确多边形绘制战争迷雾（传统方法）
 * 
 * @param ctx Canvas 2D上下文
 * @param mergedPolygons 合并后的多边形数组
 * @param mapWidth 地图宽度
 * @param mapHeight 地图高度
 */
export function drawFogWithPolygons(
  ctx: CanvasRenderingContext2D,
  mergedPolygons: Polygon[][],
  mapWidth: number,
  mapHeight: number
) {
  // 绘制全屏黑色
  ctx.fillStyle = 'rgba(0, 0, 0, 1)';
  ctx.fillRect(0, 0, mapWidth, mapHeight);
  
  // 使用 destination-out 模式挖洞（可视区域）
  ctx.globalCompositeOperation = 'destination-out';
  
  // 绘制合并后的多边形（包含外环和内环）
  mergedPolygons.forEach((polygonWithHoles) => {
    // polygonWithHoles[0] 是外环，[1], [2]... 是内环（洞）
    if (polygonWithHoles.length === 0) return;
    
    ctx.beginPath();
    
    // 绘制外环（可视区域）
    const outerRing = polygonWithHoles[0];
    if (outerRing.length >= 3) {
      ctx.moveTo(outerRing[0][0], outerRing[0][1]);
      for (let i = 1; i < outerRing.length; i++) {
        ctx.lineTo(outerRing[i][0], outerRing[i][1]);
      }
      ctx.closePath();
    }
    
    // 绘制内环（洞，应该保持迷雾）
    // 使用反向绘制顺序，配合evenodd填充规则
    for (let ringIdx = 1; ringIdx < polygonWithHoles.length; ringIdx++) {
      const hole = polygonWithHoles[ringIdx];
      if (hole.length >= 3) {
        // 反向绘制内环以创建洞
        ctx.moveTo(hole[0][0], hole[0][1]);
        for (let i = hole.length - 1; i >= 0; i--) {
          ctx.lineTo(hole[i][0], hole[i][1]);
        }
        ctx.closePath();
      }
    }
    
    // 使用 evenodd 填充规则，自动处理洞
    ctx.fill('evenodd');
  });
  
  // 恢复绘制模式
  ctx.globalCompositeOperation = 'source-over';
}

/**
 * 完整的传统方法战争迷雾绘制流程
 * 
 * 使用示例：
 * ```typescript
 * import { drawFogLegacy } from './FogSystemLegacy';
 * 
 * // 在FogSystem中调用
 * drawFogLegacy(
 *   ctx,
 *   allVisibilityPolygons,
 *   mapWidth,
 *   mapHeight,
 *   3  // 收缩距离
 * );
 * ```
 */
export function drawFogLegacy(
  ctx: CanvasRenderingContext2D,
  visibilityPolygons: Polygon[],
  mapWidth: number,
  mapHeight: number,
  shrinkAmount: number = 10  
) {
  // 收缩所有多边形
  const shrunkPolygons = visibilityPolygons.map(poly => shrinkPolygon(poly, shrinkAmount));
  
  // 合并所有可视多边形
  const mergedPolygons = mergeVisibilityPolygons(shrunkPolygons);
  
  // 绘制
  drawFogWithPolygons(ctx, mergedPolygons, mapWidth, mapHeight);
}
