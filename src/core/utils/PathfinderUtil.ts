const tileSize = 64;
const defultCheckFunction = (
  x: number,
  y: number,
  preX: number,
  preY: number
) => {
  return true;
};
const defultEndCheckFunction = () => {
  return false;
};
type GeneraWaysOptions = {
  start: { x: number; y: number } | { x: number; y: number }[];
  endCheckFunction?: () => boolean;
  checkFunction?: (x: number, y: number, preX: number, preY: number) => boolean;
  range?: number;
};
export function generateWays(generaWaysOptions: GeneraWaysOptions) {
  const range = generaWaysOptions.range || 0;
  const endCheckFunction =
    generaWaysOptions.endCheckFunction || defultEndCheckFunction;
  const checkFunction = generaWaysOptions.checkFunction || defultCheckFunction;
  //使用切比雪夫距离绘制
  // 使用广度优先搜索(BFS)绘制可移动范围，并记录路径
  const visited = new Set<string>();
  const queue: { x: number; y: number; step: number }[] = [];

  // 用二维数组记录每个格子的前驱节点
  const path: { [key: string]: { x: number; y: number; step: number } | null } =
    {};
  let startX: number;
  let startY: number;
  if (Array.isArray(generaWaysOptions.start)) {
    // If start is an array, use the first element as the starting point

    for (const start of generaWaysOptions.start) {
      queue.push({ x: start.x, y: start.y, step: 0 });
      visited.add(`${start.x},${start.y}`);
      path[`${start.x},${start.y}`] = null;
    }
  } else {
    startX = generaWaysOptions.start.x;
    startY = generaWaysOptions.start.y;
    queue.push({ x: startX, y: startY, step: 0 });
    visited.add(`${startX},${startY}`);
    path[`${startX},${startY}`] = null;
  }

  while (queue.length > 0) {
    const { x, y, step } = queue.shift()!;
    if (step >= range) continue;
    if (endCheckFunction()) continue;
    // 八方向扩展
    const dirs = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
      { dx: 1, dy: 1 },
      { dx: -1, dy: -1 },
      { dx: 1, dy: -1 },
      { dx: -1, dy: 1 },
    ];
    for (const dir of dirs) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;
      const key = `${nx},${ny}`;
      const passiable = checkFunction(nx, ny, x, y);
      if (passiable) {
        if (!visited.has(key)) {
          queue.push({ x: nx, y: ny, step: step + 1 });
          visited.add(key);
          const nStep = step + 1;
          path[key] = { x, y, step: nStep }; // 记录前驱
        }
      }
    }
  }
  // path 是一个以 "x,y" 为 key 的对象，记录每个格子的前驱节点
  return path;
}

export function generateLineGrids(
  x: number,
  y: number,
  range: number,
  endX: number,
  endY: number,
  checkFunction = defultCheckFunction,
  endCheckFunction = defultEndCheckFunction
) {
  const checkShorter = (
    nextX: number,
    nextY: number,
    preX: number,
    preY: number
  ) => {
    let checkFuncResult = checkFunction(nextX, nextY, preX, preY);
    let lineShorterCheck = false;
    const preDis = Math.max(Math.abs(endX - preX), Math.abs(endY - preY));
    const nextDis = Math.max(Math.abs(endX - nextX), Math.abs(endY - nextY));
    if (nextDis < preDis) {
      lineShorterCheck = true;
    }
    return checkFuncResult && lineShorterCheck;
  };

  const ways = generateWays({
    start: { x, y },
    endCheckFunction,
    checkFunction: checkShorter,
    range
  });
  return ways;
}
