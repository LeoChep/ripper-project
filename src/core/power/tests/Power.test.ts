import { describe, it, expect } from 'vitest';
import { PowerFactory } from '../PowerManager';
import { AttackPower } from '../AttackPower';
import { createViciousOffensivePower } from '../examples';
import { TextToPowerConverter, PowerJsonPrinter } from '../TextToPowerConverter';
import { createMagicStonePower, printMagicStoneJson } from '../MagicStoneExample';

describe('Power System', () => {
  it('should create Vicious Offensive power correctly', async () => {
    const power = await createViciousOffensivePower();
    
    expect(power).toBeInstanceOf(AttackPower);
    expect(power.name).toBe('恶毒攻击 Vicious Offensive DSCS');
    expect(power.isAttack).toBe(true);
    expect(power.isAtWill).toBe(true);
    expect(power.actionType).toBe('standard');
    expect(power.weaponType).toBe('melee');
    expect(power.range).toBe(1);
  });

  it('should have correct power properties', async () => {
    const power = await createViciousOffensivePower();
    
    expect(power.level).toBe(1);
    expect(power.getPrimaryAbility()).toBe('str');
    expect(power.getTargetDefense()).toBe('ac');
    expect(power.hasKeyword('武术')).toBe(true);
    expect(power.hasKeyword('武器')).toBe(true);
    expect(power.hasDamageType('physical')).toBe(true);
  });

  it('should provide correct descriptions', async () => {
    const power = await createViciousOffensivePower();
    
    const htmlDesc = power.getHTMLDescription();
    expect(htmlDesc).toContain('恶毒攻击');
    expect(htmlDesc).toContain('战士攻击 1');
    expect(htmlDesc).toContain('力量 vs. AC');
  });

  it('should convert to CreatureAttack format', async () => {
    const power = await createViciousOffensivePower();
    
    // 创建一个模拟的Unit对象
    const mockUnit = {
      creature: {
        abilities: [
          { name: 'Strength', value: 16, modifier: 3 }
        ]
      }
    } as any;

    const attack = power.toCreatureAttack(mockUnit);
    
    expect(attack.name).toBe('恶毒攻击 Vicious Offensive DSCS');
    expect(attack.type).toBe('Melee');
    expect(attack.range).toBe(1);
    expect(attack.target).toBe('ac');
    expect(attack.attackBonus).toBeGreaterThan(0);
  });
});

describe('Text to Power Converter', () => {
  const magicStoneText = `魔法石 Magic Stones  HoF
德鲁伊攻击 1
Three small stones clutched in your hand glow with a green light as you throw them, then explode when they strike your foes.
随意✦法器，原力
标准动作✦远程10
目标：	一、二或三个生物
攻击：	感知 vs. 反射
命中：	1d4 + 感知调整值的伤害，且你可以推离目标1格。
21级：2d4 + 感知调整值的伤害。`;

  it('should parse magic stone text correctly', () => {
    const power = TextToPowerConverter.parsePowerFromText(magicStoneText);
    console.log(power);
    expect(power).toBeInstanceOf(AttackPower);
    expect(power.name).toBe('魔法石 Magic Stones  HoF');
    expect(power.level).toBe(1);
    expect(power.isAtWill).toBe(true);
    expect(power.actionType).toBe('standard');
    expect(power.weaponType).toBe('implement');
    expect(power.range).toBe(10);
    expect(power.getPrimaryAbility()).toBe('wis');
    expect(power.getTargetDefense()).toBe('reflex');
    expect(power.system.powersource).toBe('primal');
  });

  it('should have correct keywords', () => {
    const power = TextToPowerConverter.parsePowerFromText(magicStoneText);
    
    const keywords = power.getKeywords();
    expect(keywords).toContain('法器');
    expect(keywords).toContain('原力');
  });

  it('should have correct target and damage info', () => {
    const power = TextToPowerConverter.parsePowerFromText(magicStoneText);
    
    expect(power.system.target).toBe('一、二或三个生物');
    expect(power.system.hit.detail).toContain('1d4 + 感知调整值的伤害');
    expect(power.system.hit.detail).toContain('推离目标1格');
  });

  it('should infer damage type correctly', () => {
    const power = TextToPowerConverter.parsePowerFromText(magicStoneText);
    
    expect(power.hasDamageType('force')).toBe(true);
    expect(power.hasDamageType('physical')).toBe(false);
  });

  it('should infer effect type correctly', () => {
    const power = TextToPowerConverter.parsePowerFromText(magicStoneText);
    
    expect(power.hasEffectType('evocation')).toBe(true);
  });
});
describe('Text to Power Converter2', () => {
  const magicStoneText = `凶猛撕扯 Savage Rend  PH2
德鲁伊攻击 1
你用爪子耙抓对手，使它朝死亡迈进。
随意✦野兽形态，法器，原力
标准动作✦近战触及
目标：	一个生物
攻击：	感知 vs. 反射
命中：	1d8 + 感知调整值的伤害，且你滑动目标1格。
21级：2d8 + 感知调整值的伤害。
特殊：	此威能可以作为近战基本攻击使用。`;

  it('should parse magic stone text correctly', () => {
    const power = TextToPowerConverter.parsePowerFromText(magicStoneText);
    console.log(power);
   
  });
});

