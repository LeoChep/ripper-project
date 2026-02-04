# 战争迷雾问题诊断报告

## 问题描述
当单位在最左列时，id24的墙体不再提供战争迷雾阻断。

## 问题定位

### ID24墙体信息
- **基点坐标**: (63.33, 136)
- **关键线段**: 
  - 从 (59.33, 378) 到 (59.33, 132) - **垂直墙体**
  - 从 (59.33, 132) 到 (241.33, 132) - 水平墙体
  - 从 (241.33, 132) 到 (241.83, 256.5)
  - 从 (241.83, 256.5) 到 (242.33, 381)
  - 从 (242.33, 381) 到 (59.33, 378) - 闭合

### 根本原因分析

**核心问题**: 当单位在x=0（最左列）时，单位的四个角点坐标为：
```
pointsA[0] = (0, unit.y)
pointsA[1] = (64, unit.y)
pointsA[2] = (64, unit.y+64)
pointsA[3] = (0, unit.y+64)
```

墙体id24的关键垂直线段在 **x=59.33**，理论上应该能阻挡从x=0延伸到x>59.33的视线。

**可能的原因**:

1. **浮点数精度问题**: `segmentsIntersect`函数在判断`ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1`时，当数值极度接近边界（0或1）时，浮点数运算误差可能导致判断失败。

2. **边界条件BUG**: 当单位x=0时，某些计算路径可能没有正确处理边界情况。

3. **视线检测逻辑缺陷**: 在`checkPassiable`函数中，4x4=16次视线检测的逻辑可能在特定位置组合下有遗漏。

## 解决方案

### 方案1: 增加浮点数容差（推荐）
修改`segmentsIntersect`函数，增加一个小的容差值：

```typescript
export const segmentsIntersect = (
  x1: number, y1: number,
  x2: number, y2: number,
  x3: number, y3: number,
  x4: number, y4: number
) => {
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (Math.abs(denom) < 1e-10) {
    return false; // 平行或重合
  }
  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
  
  const EPSILON = 1e-10;
  return ua >= -EPSILON && ua <= 1 + EPSILON && 
         ub >= -EPSILON && ub <= 1 + EPSILON;
};
```

### 方案2: 添加调试日志
在`checkPassiable`函数中添加日志，当单位在x<64时输出详细信息：

```typescript
if (unit.x < 64) {
  console.log(`[DEBUG] 单位在最左列: unit.x=${unit.x}, 检查墙体...`);
  edges.forEach((edge) => {
    if (edge.id === 24) {
      console.log(`[DEBUG] ID24墙体: (${edge.x1}, ${edge.y1}) -> (${edge.x2}, ${edge.y2}), useable=${edge.useable}`);
    }
  });
}
```

### 方案3: 检查墙体useable状态
确认id24墙体的`useable`属性在运行时是否正确：
- 检查墙体是否被错误地标记为`useable: false`
- 检查门的开关状态是否影响了id24

## 测试步骤

1. 将单位移动到坐标 (0, 200) 或任何 x=0 的位置
2. 尝试查看 x>60 的区域
3. 检查id24墙体是否正常阻挡视线
4. 添加调试日志输出线段相交计算的中间值

## 需要进一步检查的点

- [ ] 确认墙体id24在运行时的useable属性值
- [ ] 验证单位确切的像素坐标（unit.x是否真的是0）
- [ ] 检查是否有其他代码修改了墙体状态
- [ ] 测试其他墙体在相同位置是否也失效
