import { TextToPowerConverter, PowerJsonPrinter } from './TextToPowerConverter';
import { demonstrateConversion } from './MagicStoneExample';

/**
 * 命令行工具示例
 * 这个文件展示了如何在Node.js环境中使用Power转换系统
 */

/**
 * 从命令行参数处理文本转换
 */
export function processCommandLineArgs(): void {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('用法:');
    console.log('  npm run power-converter demo           # 运行演示');
    console.log('  npm run power-converter convert <text> # 转换文本');
    console.log('  npm run power-converter file <path>    # 从文件转换');
    return;
  }

  const command = args[0];

  switch (command) {
    case 'demo':
      runDemo();
      break;
    case 'convert':
      if (args[1]) {
        convertText(args[1]);
      } else {
        console.error('请提供要转换的文本');
      }
      break;
    case 'file':
      if (args[1]) {
        convertFromFile(args[1]);
      } else {
        console.error('请提供文件路径');
      }
      break;
    default:
      console.error(`未知命令: ${command}`);
  }
}

/**
 * 运行演示
 */
function runDemo(): void {
  demonstrateConversion();
}

/**
 * 转换单个文本
 */
function convertText(text: string): void {
  try {
    console.log('=== 文本转换 ===');
    console.log('输入文本:');
    console.log(text);
    console.log('\n' + '='.repeat(50) + '\n');

    const power = TextToPowerConverter.parsePowerFromText(text);
    
    console.log('转换结果:');
    console.log(PowerJsonPrinter.printPowerSummary(power));
    
    console.log('\n' + '='.repeat(50) + '\n');
    console.log('完整JSON:');
    console.log(PowerJsonPrinter.printPowerJson(power));
    
  } catch (error) {
    console.error('转换失败:', error);
  }
}

/**
 * 从文件转换
 */
async function convertFromFile(filePath: string): Promise<void> {
  try {
    const fs = await import('fs');
    const text = fs.readFileSync(filePath, 'utf-8');
    
    console.log(`=== 从文件转换: ${filePath} ===`);
    convertText(text);
    
  } catch (error) {
    console.error(`读取文件失败: ${filePath}`, error);
  }
}

/**
 * 交互式转换工具
 */
export async function interactiveConverter(): Promise<void> {
  const readline = await import('readline');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('=== Power系统交互式转换工具 ===');
  console.log('请输入技能文本（输入"exit"退出）:');
  console.log('');

  const askForInput = () => {
    rl.question('> ', (input) => {
      if (input.toLowerCase() === 'exit') {
        console.log('再见！');
        rl.close();
        return;
      }

      if (input.trim() === '') {
        console.log('请输入技能文本...');
        askForInput();
        return;
      }

      try {
        const power = TextToPowerConverter.parsePowerFromText(input);
        console.log('\n转换成功！');
        console.log('技能摘要:');
        console.log(PowerJsonPrinter.printPowerSummary(power));
        console.log('\n' + '='.repeat(50) + '\n');
        
      } catch (error) {
        console.error('转换失败:', error);
      }

      askForInput();
    });
  };

  askForInput();
}

/**
 * 批处理转换工具
 */
export async function batchConverter(inputDir: string, outputDir: string): Promise<void> {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    const files = fs.readdirSync(inputDir).filter(file => file.endsWith('.txt'));
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`找到 ${files.length} 个txt文件`);

    for (const file of files) {
      try {
        const inputPath = path.join(inputDir, file);
        const text = fs.readFileSync(inputPath, 'utf-8');
        
        const power = TextToPowerConverter.parsePowerFromText(text);
        const json = PowerJsonPrinter.printPowerJson(power);
        
        const outputPath = path.join(outputDir, file.replace('.txt', '.json'));
        fs.writeFileSync(outputPath, json, 'utf-8');
        
        console.log(`✓ 已转换: ${file} -> ${path.basename(outputPath)}`);
        
      } catch (error) {
        console.error(`✗ 转换失败: ${file}`, error);
      }
    }

    console.log('\n批处理转换完成！');
    
  } catch (error) {
    console.error('批处理转换失败:', error);
  }
}

// 如果这个文件被直接运行（在Node.js环境中）
if (typeof process !== 'undefined' && process.argv) {
  // 检查是否被直接运行
  const isMainModule = process.argv[1]?.includes('PowerCLI.ts') || 
                      process.argv[1]?.includes('PowerCLI.js');
  
  if (isMainModule) {
    processCommandLineArgs();
  }
}
