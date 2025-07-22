# POJO类使用指南

本文档介绍如何使用项目中的POJO（Plain Old JavaScript Object）类。POJO类只包含属性，不包含方法，适用于数据传输、序列化和状态管理。

## 目录结构

```
src/core/type/
├── index.ts          # 统一导出文件
├── PowerPojo.ts      # Power系统相关POJO类
├── UnitPojo.ts       # Unit和Creature相关POJO类
├── GameSystemPojo.ts # 游戏系统相关POJO类
├── pojo.test.ts      # 测试文件
└── test-pojo.ts      # 功能演示文件
```

## 快速开始

### 导入POJO类

```typescript
// 导入所有POJO类和工具
import { 
  PowerPojo, 
  AttackPowerPojo, 
  UnitPojo, 
  CreaturePojo,
  CombatStatePojo,
  GameSettingsPojo,
  PojoFactory,
  PojoValidator,
  PojoConverter
} from '@/core/type';

// 或者导入特定的POJO类
import { PowerPojo } from '@/core/type/PowerPojo';
```

## 主要POJO类介绍

### 1. Power系统POJO类

#### PowerPojo - 基础技能POJO
```typescript
const power = new PowerPojo();
power.id = "magic-stone";
power.name = "魔法石";
power.level = 1;
power.actionType = "minor";
power.isAtWill = true;
power.range = 20;
power.weaponType = "ranged";
```

#### AttackPowerPojo - 攻击技能POJO
```typescript
const attackPower = new AttackPowerPojo();
attackPower.name = "基础攻击";
attackPower.id = "basic-attack";
attackPower.level = 1;
attackPower.actionType = "standard";
attackPower.weaponType = "melee";
attackPower.range = 1;
attackPower.attackBonus = 5;
attackPower.primaryAbility = "str";
attackPower.targetDefense = "ac";
attackPower.damageFormula = "1d8+3";
attackPower.keywords = ["weapon"];
```

### 2. Unit系统POJO类

#### UnitPojo - 游戏单位POJO
```typescript
const unit = new UnitPojo();
unit.name = "战士";
unit.id = 1;
unit.x = 5;
unit.y = 3;
unit.direction = 0;
unit.party = "player";
unit.unitTypeName = "fighter";
unit.state = "idle";
```

#### CreaturePojo - 生物属性POJO
```typescript
const creature = new CreaturePojo();
creature.name = "人类战士";
creature.level = 3;
creature.hp = 35;
creature.bloodied = 17;
creature.ac = 18;
creature.fortitude = 15;
creature.reflex = 13;
creature.will = 12;
creature.speed = 6;
creature.initiative = 2;
creature.type = "humanoid";
creature.size = "Medium";
creature.role = "Defender";
```

### 3. 游戏系统POJO类

#### CombatStatePojo - 战斗状态POJO
```typescript
const combatState = new CombatStatePojo();
combatState.isInCombat = true;
combatState.currentTurn = 1;
combatState.currentRound = 1;
combatState.initiativeOrder = [];
```

#### GameSettingsPojo - 游戏设置POJO
```typescript
const gameSettings = new GameSettingsPojo();
gameSettings.gridSize = 32;
gameSettings.animationSpeed = 1.0;
gameSettings.soundEnabled = true;
gameSettings.musicEnabled = true;
gameSettings.debugMode = false;
```

## 工具类使用

### PojoFactory - POJO工厂

用于创建具有默认值的POJO实例：

```typescript
// 创建默认的Power POJO
const defaultPower = PojoFactory.createDefaultPowerPojo();

// 创建默认的Unit POJO
const defaultUnit = PojoFactory.createDefaultUnitPojo();

// 创建默认的Creature POJO
const defaultCreature = PojoFactory.createDefaultCreaturePojo();

// 创建默认的CombatState POJO
const defaultCombatState = PojoFactory.createDefaultCombatStatePojo();

// 创建默认的GameSettings POJO
const defaultGameSettings = PojoFactory.createDefaultGameSettingsPojo();

// 创建默认的PlayerState POJO
const defaultPlayerState = PojoFactory.createDefaultPlayerStatePojo();
```

### PojoValidator - POJO验证器

用于验证POJO对象的有效性：

```typescript
const power = new PowerPojo();
power.name = "火球术";
power.id = "fireball";
power.level = 3;

// 验证Power POJO
const isPowerValid = PojoValidator.validatePowerPojo(power);
console.log("Power有效:", isPowerValid); // true

// 验证Unit POJO
const unit = new UnitPojo();
unit.name = "法师";
unit.id = 1;
unit.x = 0;
unit.y = 0;

const isUnitValid = PojoValidator.validateUnitPojo(unit);
console.log("Unit有效:", isUnitValid); // true

// 验证Creature POJO
const creature = new CreaturePojo();
creature.name = "精灵法师";
creature.level = 5;
creature.hp = 25;
creature.ac = 15;

const isCreatureValid = PojoValidator.validateCreaturePojo(creature);
console.log("Creature有效:", isCreatureValid); // true

// 验证GameSettings POJO
const settings = new GameSettingsPojo();
settings.gridSize = 64;
settings.animationSpeed = 1.5;

const isSettingsValid = PojoValidator.validateGameSettingsPojo(settings);
console.log("Settings有效:", isSettingsValid); // true
```

### PojoConverter - POJO转换器

用于在POJO和其他格式之间进行转换：

```typescript
// 从普通对象转换为Power POJO
const plainObject = {
  name: "闪电箭",
  id: "lightning-bolt",
  level: 2,
  actionType: "standard",
  isAtWill: false,
  isEncounter: true,
  weaponType: "ranged",
  range: 15
};

const powerPojo = PojoConverter.toPowerPojo(plainObject);
console.log("转换后的Power POJO:", powerPojo);

// 将POJO转换为普通对象
const backToPlain = PojoConverter.toPlainObject(powerPojo);
console.log("转换后的普通对象:", backToPlain);

// 深拷贝POJO
const originalPower = new PowerPojo();
originalPower.name = "原始技能";

const clonedPower = PojoConverter.clonePojo(originalPower);
console.log("克隆的POJO:", clonedPower);
console.log("是同一个对象?", clonedPower === originalPower); // false

// 修改克隆对象不会影响原始对象
clonedPower.name = "修改后的技能";
console.log("原始对象名称:", originalPower.name); // "原始技能"
console.log("克隆对象名称:", clonedPower.name); // "修改后的技能"
```

## 使用场景

### 1. 数据传输

POJO类非常适合在不同模块之间传输数据：

```typescript
// 从服务器获取数据并转换为POJO
async function loadPowerFromServer(powerId: string): Promise<PowerPojo> {
  const response = await fetch(`/api/powers/${powerId}`);
  const data = await response.json();
  return PojoConverter.toPowerPojo(data);
}

// 将POJO数据发送到服务器
async function savePowerToServer(power: PowerPojo): Promise<void> {
  const plainData = PojoConverter.toPlainObject(power);
  await fetch('/api/powers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(plainData)
  });
}
```

### 2. 状态管理

在Vue/Pinia状态管理中使用POJO：

```typescript
// stores/gameState.ts
import { defineStore } from 'pinia';
import { GameSettingsPojo, CombatStatePojo, PlayerStatePojo } from '@/core/type';

export const useGameStore = defineStore('game', {
  state: () => ({
    settings: new GameSettingsPojo(),
    combatState: new CombatStatePojo(),
    playerState: new PlayerStatePojo()
  }),
  
  actions: {
    updateSettings(newSettings: Partial<GameSettingsPojo>) {
      Object.assign(this.settings, newSettings);
    },
    
    startCombat() {
      this.combatState.isInCombat = true;
      this.combatState.currentRound = 1;
      this.combatState.currentTurn = 0;
    }
  }
});
```

### 3. 本地存储

POJO类易于序列化，适合本地存储：

```typescript
// 保存游戏状态到本地存储
function saveGameState() {
  const gameState = {
    settings: PojoConverter.toPlainObject(gameSettings),
    units: units.map(unit => PojoConverter.toPlainObject(unit)),
    powers: powers.map(power => PojoConverter.toPlainObject(power))
  };
  
  localStorage.setItem('gameState', JSON.stringify(gameState));
}

// 从本地存储加载游戏状态
function loadGameState() {
  const savedState = localStorage.getItem('gameState');
  if (savedState) {
    const data = JSON.parse(savedState);
    
    const settings = PojoConverter.toPlainObject(data.settings);
    const units = data.units.map((u: any) => PojoConverter.toUnitPojo(u));
    const powers = data.powers.map((p: any) => PojoConverter.toPowerPojo(p));
    
    return { settings, units, powers };
  }
  return null;
}
```

### 4. 测试数据创建

在测试中快速创建测试数据：

```typescript
// 测试文件中
import { PojoFactory } from '@/core/type';

describe('游戏逻辑测试', () => {
  it('应该正确计算攻击结果', () => {
    // 快速创建测试数据
    const attacker = PojoFactory.createDefaultUnitPojo();
    attacker.name = "测试攻击者";
    
    const defender = PojoFactory.createDefaultUnitPojo();
    defender.name = "测试防御者";
    
    const attackPower = PojoFactory.createDefaultAttackPowerPojo();
    attackPower.name = "测试攻击";
    attackPower.damageFormula = "1d6+2";
    
    // 执行测试逻辑...
  });
});
```

## 最佳实践

1. **保持纯数据性质**：POJO类应该只包含属性，不包含业务逻辑方法
2. **使用工厂创建默认实例**：优先使用`PojoFactory`创建具有合理默认值的实例
3. **验证数据有效性**：在关键位置使用`PojoValidator`验证数据
4. **适当使用转换器**：在需要序列化/反序列化时使用`PojoConverter`
5. **类型安全**：充分利用TypeScript的类型检查确保数据结构正确

## 扩展POJO系统

如果需要添加新的POJO类：

1. 在相应的文件中定义POJO类
2. 在`index.ts`中导出新类
3. 在`PojoFactory`中添加创建方法
4. 在`PojoValidator`中添加验证方法
5. 在`PojoConverter`中添加转换方法（如果需要）
6. 编写相应的测试

这样可以保持POJO系统的一致性和可维护性。
