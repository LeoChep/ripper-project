# createCreature 技能

生物资源生成技能，供 Agent 使用。

## 快速开始

```javascript
const { createCreature } = require('./helpers.cjs');

// 创建生物
const result = await createCreature('CYCLOPS');
console.log(result.success ? '成功' : '失败');
console.log(result.data); // 生成的 JSON 数据
```

## 文件列表

| 文件 | 用途 |
|------|------|
| `skill.md` | 技能文档，供 Agent 阅读 |
| `helpers.cjs` | 便捷函数，供程序调用 |
| `creatureGenerator.cjs` | 核心生成器（来自 src/core/tool_modules） |

## Agent 使用指南

### 步骤 1：检查约束文件

```bash
# 检查 data-des.txt 是否存在
ls src/assets/creature/<生物名称>/data-des.txt
```

### 步骤 2：分析格式

```javascript
const { analyzeConstraints, readConstraints } = require('./helpers');

const constraints = readConstraints('CYCLOPS');
const analysis = analyzeConstraints(constraints);
console.log(analysis);
// { hasNameAndLevel: true, hasAttributes: true, ... }
```

### 步骤 3：调整解析逻辑（如需要）

如果约束格式与现有解析器不匹配，修改 `creatureGenerator.cjs` 中的 `aiParseDataDes` 函数。

### 步骤 4：运行生成器

```javascript
const result = await createCreature('CYCLOPS');
```

## 常见约束格式

### 格式 A：中文为主
```
独眼巨人CYCLOPS
"独眼巨人打击者（Cyclops Crusher） LV14 蛮战
大型 精界 类人生物 XP1000"
```

### 格式 B：英文为主
```
GOBLIN
"Goblin Warrior LV1 Skirmisher
Small Humanoid Goblin XP25"
```

## 数据结构

详见 `skill.md` 中的完整数据结构说明。

## 命令行使用

```bash
# 直接运行生成器
node ../../../src/core/tool_modules/creatureGenerator/creatureGenerator.cjs CYCLOPS

# 或使用 helpers
node helpers.cjs CYCLOPS
```
