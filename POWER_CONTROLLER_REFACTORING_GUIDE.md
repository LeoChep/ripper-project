# PowerController 重构指南

## 目的
将所有 Power 子目录下的 controller 集成到统一的 ControllerCancelHandler 系统中。

## 已完成的修改

### 1. MoveSelector (src/core/selector/MoveSeletor.ts)
✅ 移除了结束回合询问逻辑
✅ 恢复为简单的取消（返回 { cancel: true }）

### 2. CharacterCombatMoveController (src/core/controller/CharacterCombatMoveController.ts)
✅ 添加结束回合询问逻辑（只在 MoveController 中）
✅ 使用 ControllerHelper 创建 removeFunction
✅ 自动注册到 ControllerCancelHandler

### 3. AbstractPwoerController (src/core/controller/AbstractPwoerController.ts)
✅ 使用 ControllerHelper 创建 removeFunction
✅ selectWithBasicSelector 自动注册控制器

### 4. ControllerHelper (src/core/controller/ControllerHelper.ts)
✅ 新增辅助工具类，提供统一的 removeFunction 创建

## 需要修改的 PowerController

所有在 `src/core/power/` 子目录下的 Controller 文件，例如：

### Wizard Controllers
- MagicMissileController
- IceRaysController
- FreezingBurstController
- OrbmastersIncendiaryDetonationController

### Cleric Controllers
- DivineGlowController
- HearteningStrikeController
- SonnlinorsHammerController
- WeaponOfDivineProtectionController

### Fighter Controllers
- ChargeAttackController
- FunnelingFlurryController
- LungingStrikeController
- ShieldEdgeBlockController

## 修改步骤

### 对于每个 PowerController，需要做以下修改：

#### 步骤 1: 导入 ControllerHelper

```typescript
import { ControllerHelper } from "../../controller/ControllerHelper";
```

#### 步骤 2: 修改 selectBasic 调用

**原代码**:
```typescript
const selector = BasicSelector.getInstance().selectBasic(
  grids,
  selectNum,
  color,
  canCancel,
  checkPassiable
);
this.graphics = selector.graphics;
this.removeFunction = selector.removeFunction;
```

**新代码**:
```typescript
const controllerFullName = this.powerName + "Controller";
const selector = BasicSelector.getInstance().selectBasic(
  grids,
  selectNum,
  color,
  canCancel,
  checkPassiable,
  this.selectedCharacter || undefined,
  controllerFullName  // 添加 controllerName 参数
);
this.graphics = selector.graphics;

// 使用 ControllerHelper 创建标准的 removeFunction
this.removeFunction = ControllerHelper.createRemoveFunction(
  controllerFullName,
  this.graphics,
  () => {
    this.graphics = null;
  }
);

// 注册控制器到 ControllerCancelHandler
ControllerHelper.registerController(controllerFullName, this);
```

### 示例：MagicMissileController

**修改前**:
```typescript
const selector = BasicSelector.getInstance().selectBasic(
  grids,
  1,
  "red",
  true,
  () => true
);
this.graphics = selector.graphics;
this.removeFunction = selector.removeFunction;
```

**修改后**:
```typescript
import { ControllerHelper } from "../../controller/ControllerHelper";

// ...

const controllerFullName = this.powerName + "Controller";
const selector = BasicSelector.getInstance().selectBasic(
  grids,
  1,
  "red",
  true,
  () => true,
  this.selectedCharacter || undefined,
  controllerFullName
);
this.graphics = selector.graphics;

this.removeFunction = ControllerHelper.createRemoveFunction(
  controllerFullName,
  this.graphics,
  () => {
    this.graphics = null;
  }
);

ControllerHelper.registerController(controllerFullName, this);
```

## 自动化脚本

如果你想批量修改所有 PowerController，可以使用以下正则表达式替换：

### 查找模式：
```typescript
const selector = BasicSelector\.getInstance\(\)\.selectBasic\(
\s*grids,
\s*(\d+),
\s*"([^"]+)",
\s*(true|false),
\s*([^)]+)
\s*\);
this\.graphics = selector\.graphics;
this\.removeFunction = selector\.removeFunction;
```

### 替换为：
```typescript
const controllerFullName = this.powerName + "Controller";
const selector = BasicSelector.getInstance().selectBasic(
  grids,
  $1,
  "$2",
  $3,
  $4,
  this.selectedCharacter || undefined,
  controllerFullName
);
this.graphics = selector.graphics;

this.removeFunction = ControllerHelper.createRemoveFunction(
  controllerFullName,
  this.graphics,
  () => {
    this.graphics = null;
  }
);

ControllerHelper.registerController(controllerFullName, this);
```

## 验证修改

修改完成后，运行类型检查：
```bash
npm run type-check
```

然后启动游戏测试：
```bash
npm run dev
```

### 测试场景
1. 使用任何 Power 技能
2. 右键取消技能选择
3. 预期：检查动作点后决定下一步（切换到移动或结束回合）

## 注意事项

1. **不要修改 AbstractPwoerController 中的 selectWithBasicSelector** - 它已经正确实现了
2. **只在直接使用 BasicSelector.getInstance().selectBasic() 的地方修改**
3. **确保所有 PowerController 都继承了 AbstractPwoerController** - 它们应该已经继承

## 当前状态

### ✅ 已完成
- MoveSelector: 移除结束回合询问
- CharacterCombatMoveController: 添加结束回合询问 + 使用 ControllerHelper
- AbstractPwoerController: 使用 ControllerHelper
- ControllerHelper: 创建辅助工具

### 🔄 待完成
- 所有 power 子目录下的 Controller 需要修改
- 建议逐个修改并测试

## 优先级

**高优先级**（常用技能）：
1. MagicMissileController
2. IceRaysController
3. HearteningStrikeController
4. ChargeAttackController

**中优先级**：
5. FreezingBurstController
6. DivineGlowController
7. FunnelingFlurryController
8. LungingStrikeController

**低优先级**：
9. OrbmastersIncendiaryDetonationController
10. SonnlinorsHammerController
11. WeaponOfDivineProtectionController
12. ShieldEdgeBlockController

---

## 快速参考

### ControllerHelper 方法

```typescript
// 创建 removeFunction
ControllerHelper.createRemoveFunction(
  controllerName: string,
  graphics: object | null,
  extraCleanup?: () => void
): (args?: any) => void

// 注册控制器
ControllerHelper.registerController(
  controllerName: string,
  instance: { removeFunction: (args?: any) => void }
): void
```

### BasicSelector 参数

```typescript
selectBasic(
  grids: object,
  selectNum: number,
  color: string,
  canCancel: boolean,
  checkPassiable: function,
  unit?: Unit,           // 新增
  controllerName?: string  // 新增
)
```
