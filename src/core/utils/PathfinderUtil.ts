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
export function generateWays(
  x: number,
  y: number,
  range: number,
  checkFunction = defultCheckFunction,
  endCheckFunction = defultEndCheckFunction
) {
  const startX = x;
  const startY = y;
  //使用切比雪夫距离绘制
  // 使用广度优先搜索(BFS)绘制可移动范围，并记录路径
  const visited = new Set<string>();
  const queue: { x: number; y: number; step: number }[] = [];

  // 用二维数组记录每个格子的前驱节点
  const path: { [key: string]: { x: number; y: number; step: number } | null } = {};

  queue.push({ x: startX, y: startY, step: 0 });
  visited.add(`${startX},${startY}`);
  path[`${startX},${startY}`] = null;

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
      // 检查是否是对角线方向
    //   if (dir.dx * dir.dx + dir.dy * dir.dy > 1) {
    //     // 如果是对角线方向，检查是否是拐角,拐角则不可对角线移动
    //     if (dir.dx < 0 && dir.dy < 0) {
    //       // 左上角
    //       if (
    //         path[`${x - 1},${y}`] === undefined ||
    //         path[`${x},${y - 1}`] === undefined
    //       ) {
    //         continue; // 如果左或上不可通行，则跳过
    //       }
    //     }
    //     if (dir.dx > 0 && dir.dy < 0) {
    //       // 右上角
    //       if (
    //         path[`${x + 1},${y}`] === undefined ||
    //         path[`${x},${y - 1}`] === undefined
    //       ) {
    //         continue; // 如果右或上不可通行，则跳过
    //       }
    //     }
    //     if (dir.dx < 0 && dir.dy > 0) {
    //       // 左下角
    //       if (
    //         path[`${x - 1},${y}`] === undefined ||
    //         path[`${x},${y + 1}`] === undefined
    //       ) {
    //         continue; // 如果左或下不可通行，则跳过
    //       }
    //     }
    //     if (dir.dx > 0 && dir.dy > 0) {
    //       // 右下角
    //       if (
    //         path[`${x + 1},${y}`] === undefined ||
    //         path[`${x},${y + 1}`] === undefined
    //       ) {
    //         continue; // 如果右或下不可通行，则跳过
    //       }
    //     }
    //   }
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
