export const segmentsIntersect = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  x4: number,
  y4: number
) => {
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (denom === 0) {
    return false; // 平行或重合
  }
  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
  return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1; // 判断是否在有效范围内
};
export const distance = (x1: number, y1: number, x2: number, y2: number) => {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
};

export const getBrustRange = (
  centerX: number,
  centerY: number,
  range: number
) => {
  const grids: Set<{ x: number; y: number }> = new Set();
  for (let dx = -range; dx <= range; dx++) {
    for (let dy = -range; dy <= range; dy++) {
      if (centerX + dx < 0 || centerY + dy < 0) continue;
      else
      {
        grids.add({ x: centerX + dx, y: centerY + dy });
      }
    }
  }
  return grids;
};
