# Unit Friendly 属性实现

**日期**: 2026-01-28  
**类型**: Feature  
**影响**: Unit系统、持久化、地图加载

## 概述

为 `Unit` 添加 `friendly: boolean` 属性，标识单位友好状态。

- 地图文件读取支持
- 游戏状态持久化
- 玩家单位自动识别为友好

## 规则

- `party === "player"` → 强制 `friendly = true`
- 其他 → 使用传入值，默认 `false`

## 文件修改

### 1. `src/core/units/Unit.ts`

#### UnitOptions 接口

```typescript
export interface UnitOptions {
  // ...
  friendly?: boolean; // 新增
}
```

#### Unit 类

```typescript
export class Unit {
  // ...
  friendly: boolean = false; // 新增
}
```

#### 构造函数

```typescript
constructor(options: UnitOptions) {
  // ...
  // 玩家单位强制friendly=true，其他单位使用传入值或默认false
  this.friendly = options.party === "player" ? true : (options.friendly ?? false);
}
```

#### 地图加载

```typescript
export function createUnitFromMapSprite(obj: any): Unit {
  // ...
  const friendlyProp = obj.properties?.find((p: any) => p.name === "friendly");
  
  const unitInfo = {
    // ...
    friendly: friendlyProp ? friendlyProp.value : false,
  };
  return createUnitFromUnitInfo(unitInfo);
}

export function createUnitFromUnitInfo(obj: any): Unit {
  return new Unit({
    // ...
    friendly: obj.friendly ?? false,
  });
}
```

从 Tiled 地图对象的 `properties` 读取 `friendly` 自定义属性。

---

### 2. `src/core/saver/Saver.ts`

#### 保存

```typescript
static saveGameState(): boolean {
  const sprites = map.sprites.map((sprite) => ({
    // ...
    friendly: sprite.friendly, // 新增
  }));
}
```

#### 读取

```typescript
static async loadUnit(): Promise<boolean> {
  map.sprites.forEach((sprite: Unit, index: string | number) => {
    const savedSprite = gameState.sprites[index];
    if (savedSprite && savedSprite.creature) {
      // ...
      sprite.friendly = savedSprite.friendly ?? false; // 新增
    }
  });
}
```

使用 `??` 运算符确保旧存档兼容。

---

## 注意事项

- **优先级**: `party === "player"` 强制 `friendly = true`，忽略传入值
- **兼容性**: 使用 `??` 运算符处理旧存档（无 friendly 字段时默认 false）
- **类型**: `UnitOptions.friendly` 可选，`Unit.friendly` 必需
