#!/usr/bin/env node

/**
 * createCreature 技能助手
 *
 * 提供给 Agent 调用的便捷函数
 */

const fs = require('fs');
const path = require('path');

// 路径配置
const SKILL_PATH = __dirname;
const GENERATOR_PATH = path.join(__dirname, '../src/core/tool_modules/creatureGenerator/creatureGenerator.cjs');
const CREATURE_BASE_PATH = path.join(__dirname, '../../../src/assets/creature');

/**
 * 检查生物文件夹是否存在
 */
function checkCreatureExists(creatureName) {
    const creaturePath = path.join(CREATURE_BASE_PATH, creatureName);
    return fs.existsSync(creaturePath);
}

/**
 * 读取约束文件
 */
function readConstraints(creatureName) {
    const dataDesPath = path.join(CREATURE_BASE_PATH, creatureName, 'data-des.txt');
    if (!fs.existsSync(dataDesPath)) {
        return null;
    }
    return fs.readFileSync(dataDesPath, 'utf-8');
}

/**
 * 运行生成器
 */
function runGenerator(creatureName, customBasePath) {
    const { spawn } = require('child_process');
    const basePath = customBasePath || CREATURE_BASE_PATH;
    const generatorPath = path.join(__dirname, '../../../src/core/tool_modules/creatureGenerator/creatureGenerator.cjs');

    return new Promise((resolve, reject) => {
        const proc = spawn('node', [generatorPath, creatureName, basePath], {
            cwd: path.dirname(generatorPath),
            stdio: 'pipe'
        });

        let stdout = '';
        let stderr = '';

        proc.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        proc.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        proc.on('close', (code) => {
            if (code === 0) {
                resolve({ success: true, output: stdout });
            } else {
                reject({ success: false, error: stderr, output: stdout });
            }
        });
    });
}

/**
 * 读取生成的 JSON
 */
function readGeneratedJson(creatureName) {
    const jsonPath = path.join(CREATURE_BASE_PATH, creatureName, `${creatureName}.json`);
    if (!fs.existsSync(jsonPath)) {
        return null;
    }
    const content = fs.readFileSync(jsonPath, 'utf-8');
    return JSON.parse(content);
}

/**
 * Agent 使用的主函数
 *
 * @param {string} creatureName - 生物名称（如 CYCLOPS, GOBLIN）
 * @param {string} constraints - 约束内容（可选，如果提供会写入 data-des.txt）
 * @returns {object} 生成结果
 */
async function createCreature(creatureName, constraints = null) {
    const result = {
        creatureName,
        success: false,
        errors: [],
        data: null
    };

    // 1. 检查文件夹
    if (!checkCreatureExists(creatureName)) {
        result.errors.push('生物文件夹不存在');
        return result;
    }

    // 2. 如果提供了约束，写入 data-des.txt
    if (constraints) {
        const dataDesPath = path.join(CREATURE_BASE_PATH, creatureName, 'data-des.txt');
        try {
            fs.writeFileSync(dataDesPath, constraints, 'utf-8');
        } catch (e) {
            result.errors.push(`写入约束文件失败: ${e.message}`);
            return result;
        }
    }

    // 3. 检查约束文件
    const constraintsText = readConstraints(creatureName);
    if (!constraintsText) {
        result.errors.push('约束文件 data-des.txt 不存在');
        return result;
    }

    // 4. 运行生成器
    try {
        const genResult = await runGenerator(creatureName);
        result.output = genResult.output;
    } catch (e) {
        result.errors.push(`生成失败: ${e.error || e.message}`);
        return result;
    }

    // 5. 读取生成的 JSON
    result.data = readGeneratedJson(creatureName);
    result.success = !!result.data;

    return result;
}

/**
 * 分析约束文件格式
 *
 * 帮助 AI 理解 data-des.txt 的结构
 */
function analyzeConstraints(constraintsText) {
    const lines = constraintsText.split('\n');
    const analysis = {
        hasNameAndLevel: false,
        hasAttributes: false,
        hasAbilities: false,
        hasPowers: false,
        hasTraits: false,
        format: 'unknown',
        sections: []
    };

    // 检测各部分
    const fullText = constraintsText.toLowerCase();

    if (fullText.includes('lv') || fullText.includes('等级')) analysis.hasNameAndLevel = true;
    if (fullText.includes('hp') || fullText.includes('ac')) analysis.hasAttributes = true;
    if (fullText.includes('力量') || fullText.includes('str')) analysis.hasAbilities = true;
    if (fullText.includes('标准动作') || fullText.includes('次要动作')) analysis.hasPowers = true;
    if (fullText.includes('特性')) analysis.hasTraits = true;

    // 检测格式
    if (constraintsText.includes('（') && constraintsText.includes('）')) {
        analysis.format = 'chinese-with-english';
    } else if (constraintsText.includes('(') && constraintsText.includes(')')) {
        analysis.format = 'english-with-chinese';
    }

    // 检测章节
    lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (trimmed === '标准动作' || trimmed === '次要动作' || trimmed === '自由动作' || trimmed === '特性') {
            analysis.sections.push({ type: trimmed, line: idx });
        }
    });

    return analysis;
}

// 导出
module.exports = {
    createCreature,
    checkCreatureExists,
    readConstraints,
    readGeneratedJson,
    analyzeConstraints,
    runGenerator,
    CREATURE_BASE_PATH,
    SKILL_PATH
};

// 命令行直接运行
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.log('用法: node helpers.js <生物名称>');
        console.log('示例: node helpers.js CYCLOPS');
        process.exit(1);
    }

    createCreature(args[0])
        .then(result => {
            console.log(JSON.stringify(result, null, 2));
        })
        .catch(err => {
            console.error('错误:', err);
            process.exit(1);
        });
}
