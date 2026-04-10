# createCreature 技能

## 用途

根据 data-des.txt 约束文件生成完整的生物资源文件夹。

## 触发条件

当用户描述想要创建新生物时触发，例如：
- "创建一个 goblin warrior"
- "帮我生成一个 level 10 dragon"
- "添加一个新的 skeleton mage"

## 使用方式

### 在 skill.json 中配置

```json
{
  "name": "createCreature",
  "description": "根据约束文件生成生物资源文件夹",
  "parameters": {
    "creatureName": "生物名称（如 GOBLIN）",
    "constraints": "data-des.txt 的内容或约束条件"
  }
}
```

### Agent 调用流程

1. **检查约束文件** - 查看 `src/assets/creature/<CREATURE_NAME>/data-des.txt`
2. **读取并分析** - 分析约束文件的格式和数据
3. **调用生成器** - 运行 `creatureGenerator.cjs`
4. **验证输出** - 检查生成的 JSON 是否正确

## 文件列表

```
.claude/skills/createCreature/
├── skill.md              # 技能文档（本文件）
├── helpers.cjs           # 便捷函数
├── README.md             # 使用说明
└── creatureGenerator.cjs # 核心生成器
```

## 生成的文件夹结构

生成的生物文件夹结构：

```
src/assets/creature/<CREATURE_NAME>/
├── <CREATURE_NAME>.json        # 核心生物数据
├── data-des.txt                # 约束条件（输入）
├── README.md                   # 生物说明文档
└── anim/
    ├── character.json          # 动画元数据
    ├── standard/               # 标准动画
    ├── custom/                 # 自定义动画
    └── credits/                # 资源归属
```

## 数据结构

### CreatureOptions

```javascript
{
    name: "",           // 中文名称
    nameEn: "",         // 英文名称
    level: 0,           // 等级
    role: "",           // 角色（蛮战、法师等）
    xp: 0,              // 经验值
    size: "",           // 体型（小型、中型、大型、超大型）
    type: "",           // 类型（类人生物、亡灵等）
    origin: "",         // 起源（精界、元素界等）
    hp: 0,              // 生命值
    maxHp: 0,
    bloodied: 0,        // 重伤值
    ac: 0,              // 护甲级
    fortitude: 0,       // 强韧
    reflex: 0,          // 反射
    will: 0,            // 意志
    speed: 0,           // 速度
    fly: null,          // 飞行速度
    initiative: 0,      // 先攻
    senses: "",         // 感官
    immunities: [],     // 免疫
    resistances: [],    // 抗性
    alignment: "",      // 阵营
    languages: [],      // 语言
    skills: [],         // 技能
    abilities: {},      // 能力值
    equipment: [],      // 装备
    weapons: [],        // 武器
    powers: [],         // 技能
    traits: [],         // 特性
    feats: [],          // 天赋
    notes: []           // 备注
}
```

## 解析函数

### aiParseDataDes(txt, options)

AI 需要根据约束文件格式实现此函数的各个部分：

| 函数 | 用途 |
|------|------|
| `parseNameAndLevel()` | 解析名称、等级、角色、XP |
| `parseAttributes()` | 解析 HP、防御、速度 |
| `parseAbilities()` | 解析六项能力值 |
| `parsePowers()` | 解析技能/攻击 |
| `parseTraits()` | 解析特性 |
| `parseEquipmentAndLanguages()` | 解析装备、语言、技能 |

## 约束文件格式示例

```
独眼巨人CYCLOPS
"独眼巨人打击者（Cyclops Crusher）                   LV14 蛮战
大型 精界 类人生物                                                    XP1000"
"HP171；重伤 85
AC26 强韧 27 反射 26 意志 25
速度 8"		先攻+12				侦查+16
特性
真视
该独眼巨人可以看到隐形的生物和物件。
标准动作
基本近战：尖刺巨木棒（武器）·随意
"攻击：近战 2（一个生物）+19vs.AC
命中：3d12+8 伤害。"
近程：震地粉碎（武器）·充能 5,6
"攻击：近程冲击 2（范围内所有敌人）+19vs.AC
命中：5d12+12 伤害，且目标倒地。"
次要动作
邪眼·随意（一轮一次）
"效果：射程 视线（一个敌人）。目标的攻击骰和所有防御受到-2 减值直到遭遇结束或直到
该独眼巨人再次使用该威能。"
"技能：运动+18
力量 23（+13）   敏捷 20（+12）体质 21（+12）   智力 10（+7）"			感知 19（+11）魅力 11（+7）
"阵营：无   语言：精灵语
装备：鳞甲，巨木棒"
```

## 命令行使用

```bash
cd src/core/tool_modules/creatureGenerator
node creatureGenerator.cjs <生物名称> [资源路径]
```

## 注意事项

1. 约束文件格式可能多样，AI 需要灵活适配
2. 次要动作技能（如邪眼）需要特殊处理
3. 体型解析需要从类型行中提取
4. 生成的 JSON 需要验证是否符合游戏格式
