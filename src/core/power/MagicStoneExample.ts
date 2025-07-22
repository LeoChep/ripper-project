import { TextToPowerConverter, PowerJsonPrinter } from './TextToPowerConverter';
import { AttackPower } from './AttackPower';

/**
 * 魔法石技能的示例用法
 */

// 魔法石的文本内容
const magicStoneText = `魔法石 Magic Stones  HoF
德鲁伊攻击 1
Three small stones clutched in your hand glow with a green light as you throw them, then explode when they strike your foes.
随意✦法器，原力
标准动作✦远程10
目标：	一、二或三个生物
攻击：	感知 vs. 反射
命中：	1d4 + 感知调整值的伤害，且你可以推离目标1格。
21级：2d4 + 感知调整值的伤害。`;

/**
 * 从文本创建魔法石技能
 */
export function createMagicStonePower(): AttackPower {
  const power = TextToPowerConverter.parsePowerFromText(magicStoneText);
  return power as AttackPower;
}

/**
 * 打印魔法石技能的JSON
 */
export function printMagicStoneJson(): string {
  const magicStone = createMagicStonePower();
  return PowerJsonPrinter.printPowerJson(magicStone);
}

/**
 * 打印魔法石技能的摘要
 */
export function printMagicStoneSummary(): string {
  const magicStone = createMagicStonePower();
  return PowerJsonPrinter.printPowerSummary(magicStone);
}

/**
 * 下载魔法石技能的JSON文件
 */
export function downloadMagicStoneJson(): void {
  const magicStone = createMagicStonePower();
  PowerJsonPrinter.downloadPowerJson(magicStone, 'magic-stone.json');
}

/**
 * 通用的文本转换函数
 */
export function convertTextToPower(text: string): AttackPower {
  return TextToPowerConverter.parsePowerFromText(text) as AttackPower;
}

/**
 * 通用的Power对象JSON打印函数
 */
export function printPowerAsJson(power: AttackPower): string {
  return PowerJsonPrinter.printPowerJson(power);
}

/**
 * 从文件读取文本并转换为Power对象
 */
export async function loadPowerFromTextFile(filePath: string): Promise<AttackPower> {
  try {
    const response = await fetch(filePath);
    const text = await response.text();
    return convertTextToPower(text);
  } catch (error) {
    console.error(`Failed to load power from ${filePath}:`, error);
    throw error;
  }
}

/**
 * 批量转换多个文本为Power对象
 */
export function convertMultipleTexts(texts: string[]): AttackPower[] {
  return texts.map(text => convertTextToPower(text));
}

/**
 * 演示函数：展示完整的转换流程
 */
export function demonstrateConversion(): void {
  console.log('=== 魔法石技能转换演示 ===\n');
  
  // 1. 从文本创建Power对象
  console.log('1. 原始文本:');
  console.log(magicStoneText);
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 2. 转换为Power对象
  const magicStone = createMagicStonePower();
  console.log('2. 转换后的Power对象属性:');
  console.log(`名称: ${magicStone.name}`);
  console.log(`等级: ${magicStone.level}`);
  console.log(`使用类型: ${magicStone.system.useType}`);
  console.log(`动作类型: ${magicStone.actionType}`);
  console.log(`武器类型: ${magicStone.weaponType}`);
  console.log(`范围: ${magicStone.range}`);
  console.log(`主要能力: ${magicStone.getPrimaryAbility()}`);
  console.log(`目标防御: ${magicStone.getTargetDefense()}`);
  console.log(`关键词: ${magicStone.getKeywords().join(', ')}`);
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 3. 打印摘要
  console.log('3. 技能摘要:');
  console.log(printMagicStoneSummary());
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 4. 打印完整JSON（截取前500字符）
  console.log('4. 完整JSON（截取）:');
  const fullJson = printMagicStoneJson();
  console.log(fullJson.substring(0, 500) + '...');
  console.log(`\n完整JSON长度: ${fullJson.length} 字符`);
}

// 如果需要在浏览器控制台中测试，可以取消注释下面这行
// demonstrateConversion();
