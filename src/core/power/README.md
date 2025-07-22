# Power System - 技能系统

这个Power系统是基于您提供的"Vicious Offensive"JSON文件创建的完整技能系统，现在新增了从文本转换为Power对象的功能。

## 核心组件

### 1. PowerInterface.ts
定义了所有Power系统相关的TypeScript接口，包括：
- `PowerData` - 完整的技能数据结构
- `PowerSystem` - 技能的系统配置
- `PowerAttack` - 攻击相关配置
- `PowerHit` - 命中效果配置
- 以及其他各种配置接口

### 2. Power.ts
基础Power类，提供技能的核心功能：
- 基本属性访问
- 技能使用条件检查
- 描述文本处理
- 行动点数消耗
- JSON序列化/反序列化

### 3. AttackPower.ts
攻击型技能类，继承自Power，专门处理攻击逻辑：
- 转换为现有的`CreatureAttack`格式
- 计算攻击范围和目标
- 检查攻击条件
- 执行攻击逻辑

### 4. PowerManager.ts
技能管理器，包含：
- `PowerFactory` - 根据数据创建相应的Power实例
- `PowerManager` - 单位技能管理
- `PowerUtils` - 工具函数

### 5. TextToPowerConverter.ts ⭐ 新增
文本到Power对象的转换器：
- `TextToPowerConverter` - 将文本描述转换为Power对象
- `PowerJsonPrinter` - 将Power对象输出为JSON格式
- 支持多种格式的技能文本解析
- 智能推断技能属性和类型

### 6. MagicStoneExample.ts ⭐ 新增
魔法石技能的示例用法：
- 演示如何从文本创建具体技能
- 提供JSON打印和下载功能
- 完整的转换流程演示

### 7. PowerCLI.ts ⭐ 新增
命令行工具，支持：
- 交互式文本转换
- 批量文件处理
- 演示模式

## 使用方法

### 文本转换功能 ⭐ 新增

#### 从文本创建Power对象

```typescript
import { TextToPowerConverter } from '@/core/power';

const powerText = `魔法石 Magic Stones  HoF
德鲁伊攻击 1
Three small stones clutched in your hand glow with a green light as you throw them, then explode when they strike your foes.
随意✦法器，原力
标准动作✦远程10
目标：	一、二或三个生物
攻击：	感知 vs. 反射
命中：	1d4 + 感知调整值的伤害，且你可以推离目标1格。`;

// 转换为Power对象
const power = TextToPowerConverter.parsePowerFromText(powerText);
console.log(power.name); // "魔法石 Magic Stones"
```

#### 打印Power对象为JSON

```typescript
import { PowerJsonPrinter } from '@/core/power';

// 打印完整JSON
const fullJson = PowerJsonPrinter.printPowerJson(power);
console.log(fullJson);

// 打印摘要
const summary = PowerJsonPrinter.printPowerSummary(power);
console.log(summary);

// 下载为JSON文件（浏览器环境）
PowerJsonPrinter.downloadPowerJson(power, 'magic-stone.json');
```

#### 快捷示例函数

```typescript
import { 
  createMagicStonePower, 
  printMagicStoneJson,
  demonstrateConversion 
} from '@/core/power/MagicStoneExample';

// 创建魔法石技能
const magicStone = createMagicStonePower();

// 打印JSON
const json = printMagicStoneJson();

// 运行完整演示
demonstrateConversion();
```

### 支持的文本格式

转换器能够智能解析以下格式的技能文本：

```
技能名称 [英文名称] [标识]
职业/类型 + 等级
英文描述（可选）
使用类型✦关键词1，关键词2
动作类型✦范围类型+数值
目标：目标描述
攻击：能力值 vs. 防御类型
命中：伤害描述和效果
效果：额外效果（可选）
升级：高等级效果（可选）
```

### 原有功能

#### 创建技能实例

```typescript
import { createViciousOffensivePower } from '@/core/power/examples';

// 创建恶毒攻击技能
const viciousOffensive = await createViciousOffensivePower();
console.log(viciousOffensive.name); // "恶毒攻击 Vicious Offensive DSCS"
```

#### 为单位添加技能管理

```typescript
import { PowerManager } from '@/core/power';

// 为单位创建技能管理器
const powerManager = new PowerManager(unit);

// 添加技能
powerManager.addPower(viciousOffensive);

// 获取可用技能
const availablePowers = powerManager.getAvailablePowers();

// 获取攻击技能
const attackPowers = powerManager.getAttackPowers();
```

#### 使用技能进行攻击

```typescript
import { usePowerToAttack } from '@/core/power/examples';

// 使用技能攻击指定位置
const success = await usePowerToAttack(
  viciousOffensive, // 技能
  caster,          // 施法者
  targetX,         // 目标X坐标
  targetY,         // 目标Y坐标
  map             // 地图对象
);
```

## 特性

### 1. 智能文本解析 ⭐ 新增
- 自动识别技能名称、等级、类型
- 智能推断能力值和防御类型
- 支持中英文混合格式
- 自动解析关键词和效果

### 2. 多格式输出 ⭐ 新增
- 完整JSON格式
- 摘要格式
- 浏览器下载支持
- 对比分析功能

### 3. 批量处理 ⭐ 新增
- 命令行工具支持
- 批量文件转换
- 交互式转换界面

### 4. 类型安全
完全基于TypeScript，提供完整的类型检查和智能提示。

### 5. 兼容性
攻击型技能可以无缝转换为现有的`CreatureAttack`格式，与现有战斗系统兼容。

### 6. 可扩展性
- 可以轻松添加新的技能类型（如治疗技能、增益技能等）
- PowerFactory支持根据技能类型自动创建相应的实例
- 支持复杂的公式解析和效果计算

## 扩展指南

### 添加新的文本解析规则

在`TextToPowerConverter.parseBasicInfo()`中添加新的解析逻辑：

```typescript
// 解析特殊格式
if (line.includes('特殊标记')) {
  info.specialProperty = parseSpecialValue(line);
}
```

### 自定义输出格式

扩展`PowerJsonPrinter`类：

```typescript
static printCustomFormat(power: Power): string {
  // 实现自定义格式
}
```

## 文件结构

```
src/core/power/
├── PowerInterface.ts       # 接口定义
├── Power.ts               # 基础Power类
├── AttackPower.ts         # 攻击型技能类
├── PowerManager.ts        # 管理器和工厂类
├── TextToPowerConverter.ts # 文本转换器 ⭐
├── MagicStoneExample.ts   # 魔法石示例 ⭐
├── PowerCLI.ts           # 命令行工具 ⭐
├── examples.ts           # 使用示例
├── tests/
│   └── Power.test.ts     # 单元测试（含转换测试）
├── index.ts             # 导出文件
└── README.md           # 说明文档
```

## 命令行使用

```bash
# 运行演示
npm run power-converter demo

# 转换单个文本
npm run power-converter convert "技能文本内容"

# 从文件转换
npm run power-converter file "./magic-stone.txt"

# 批量转换（需要实现）
npm run power-converter batch "./input" "./output"
```

这个增强的Power系统现在不仅能处理JSON格式的技能数据，还能从自然语言文本中智能解析并创建Power对象，大大提高了技能创建的效率和便利性。
