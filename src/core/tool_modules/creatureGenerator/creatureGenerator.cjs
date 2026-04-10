#!/usr/bin/env node

/**
 * 生物文件夹生成器 (Creature Folder Generator)
 *
 * 这是一个 AI 辅助的生物资源生成工具。
 *
 * 【工作流程】
 * 1. AI 读取 data-des.txt 约束文件
 * 2. AI 分析文件格式，提取生物数据
 * 3. AI 调用 createCreatureOptions 生成标准化数据
 * 4. 生成完整的生物文件夹结构
 *
 * 【使用方式】
 *   node creatureGenerator.cjs <生物名称> [资源路径]
 *
 * 【生物文件夹结构】
 *   <CREATURE_NAME>/
 *   ├── <CREATURE_NAME>.json        # 核心生物数据（必填）
 *   ├── data-des.txt                # 约束条件（必填，AI 读取此文件）
 *   ├── avatar.png                  # 头像（推荐 256x256）
 *   ├── README.md                   # 生物说明文档
 *   └── anim/                       # 动画文件夹
 *       ├── character.json          # 动画元数据（必填）
 *       ├── standard/               # 标准动画
 *       │   └── <creature>_body.png # 精灵图集
 *       ├── custom/                 # 自定义动画
 *       │   └── (可选动画文件)
 *       └── credits/                # 资源归属
 *           └── README.md
 */

const fs = require('fs');
const path = require('path');

// ==================== 配置 ====================

const DEFAULT_CREATURE_BASE_PATH = path.resolve(__dirname, '../../../assets/creature');

// 根据体型确定帧尺寸
const FRAME_SIZES = {
    '小型': { width: 64, height: 64 },
    '中型': { width: 128, height: 128 },
    '大型': { width: 192, height: 192 },
    '超大型': { width: 256, height: 256 }
};

// 动画帧配置
const ANIMATION_CONFIG = {
    idle: { frames: [0, 1, 2, 3, 4, 5], fps: 6, loop: true },
    walk: { frames: [6, 7, 8, 9, 10, 11, 12, 13], fps: 8, loop: true },
    run: { frames: [14, 15, 16, 17, 18, 19, 20, 21], fps: 10, loop: true },
    attack: { frames: [22, 23, 24, 25, 26], fps: 12, loop: false },
    hurt: { frames: [27, 28, 29], fps: 8, loop: false },
    death: { frames: [30, 31, 32, 33, 34, 35], fps: 6, loop: false }
};

// ==================== 核心数据结构 ====================

/**
 * 生物选项数据结构
 * 对应 TypeScript 版本的 CreatureOptions
 */
function createEmptyCreatureOptions() {
    return {
        name: "",
        nameEn: "",
        level: 0,
        role: "",
        xp: 0,
        size: "中型",
        type: "类人生物",
        origin: "",
        hp: 0,
        maxHp: 0,
        bloodied: 0,
        ac: 0,
        fortitude: 0,
        reflex: 0,
        will: 0,
        speed: 6,
        fly: null,
        initiative: 0,
        senses: "",
        immunities: [],
        resistances: [],
        alignment: "无",
        languages: [],
        skills: [],
        abilities: {
            STR: { value: 10, modifier: 0 },
            DEX: { value: 10, modifier: 0 },
            CON: { value: 10, modifier: 0 },
            INT: { value: 10, modifier: 0 },
            WIS: { value: 10, modifier: 0 },
            CHA: { value: 10, modifier: 0 }
        },
        equipment: [],
        weapons: [],
        powers: [],
        traits: [],
        feats: [],
        notes: []
    };
}

// ==================== AI 解析接口 ====================

/**
 * AI 解析 data-des.txt 的接口函数
 *
 * AI 需要根据具体的 data-des.txt 格式实现此函数
 *
 * @param {string} txt - data-des.txt 的原始内容
 * @param {object} options - 空的 CreatureOptions 对象
 * @returns {object} 填充后的 CreatureOptions
 *
 * 【AI 实现指南】
 * 1. 分析 txt 的格式模式（可能有多种格式）
 * 2. 提取：名称、等级、角色、XP
 * 3. 提取：体型、类型、起源
 * 4. 提取：HP、血量、AC、强韧、反射、意志、速度
 * 5. 提取：先攻、感官
 * 6. 提取：能力值（STR, DEX, CON, INT, WIS, CHA）
 * 7. 提取：技能、语言、阵营
 * 8. 提取：装备
 * 9. 提取：攻击/技能（分为 weapons 和 powers）
 * 10. 提取：特性（traits）
 */
function aiParseDataDes(txt, options) {
    // 预处理：统一格式
    txt = txt
        .replace(/\/\/.*\n/g, "")      // 移除注释
        .replace(/"/g, "")              // 移除引号
        .replace(/\r\n/g, "\n")         // 统一换行
        .replace(/\r/g, "\n")
        .replace(/\t+/g, " ")           // Tab 转空格
        .replace(/；/g, ";");           // 全角分号转半角

    // ===== AI: 请在此处实现具体的解析逻辑 =====
    // 以下是示例解析，AI 应根据实际格式调整

    // 示例：提取名称和等级（格式多样，需要灵活匹配）
    parseNameAndLevel(txt, options);

    // 示例：提取属性
    parseAttributes(txt, options);

    // 示例：提取能力值
    parseAbilities(txt, options);

    // 示例：提取技能
    parsePowers(txt, options);

    // 示例：提取特性
    parseTraits(txt, options);

    // 示例：提取装备和语言
    parseEquipmentAndLanguages(txt, options);

    return options;
}

// ===== 辅助解析函数（AI 可调用或重写）=====

function parseNameAndLevel(txt, options) {
    // 格式1: "名称（英文名）\n体型 类型 LV等级 职业\nXP数值"
    const format1 = txt.match(/(.+?)[（(](.+?)[)）]\s+LV(\d+)\s+(.+?)\n.*?XP(\d+)/);
    if (format1) {
        options.name = format1[1].trim();
        options.nameEn = format1[2].trim();
        options.level = parseInt(format1[3]);
        options.role = format1[4].trim();
        options.xp = parseInt(format1[5]);
        return;
    }

    // 格式2: "名称\nLV等级 职业\n体型 类型\nXP数值"
    const format2 = txt.match(/(.+?)\s+LV(\d+)\s+(.+?)\n(.+?)\s+XP(\d+)/);
    if (format2) {
        options.name = format2[1].trim();
        options.level = parseInt(format2[2]);
        options.role = format2[3].trim();
        options.xp = parseInt(format2[5]);
        // 解析体型和类型
        const sizeType = format2[4].trim().split(/\s+/);
        options.size = sizeType[0] || "中型";
        if (sizeType.length > 2) {
            options.origin = sizeType[1] || "";
            options.type = sizeType.slice(2).join(" ");
        } else if (sizeType.length > 1) {
            options.type = sizeType[1] || "类人生物";
        }
        return;
    }

    // 兜底：只提取名称
    const nameMatch = txt.match(/^([^\n]+)/);
    if (nameMatch) {
        options.name = nameMatch[1].trim();
    }
}

function parseAttributes(txt, options) {
    // HP
    const hpMatch = txt.match(/HP(\d+)/);
    if (hpMatch) options.hp = parseInt(hpMatch[1]);

    // 重伤值
    const bloodiedMatch = txt.match(/重伤\s+(\d+)/);
    if (bloodiedMatch) {
        options.bloodied = parseInt(bloodiedMatch[1]);
    } else {
        options.bloodied = Math.floor(options.hp / 2);
    }

    // 防御 - 格式: "AC26 强韧 27 反射 26 意志 25"
    const defMatch = txt.match(/AC(\d+)\s+强韧\s+(\d+)\s+反射\s+(\d+)\s+意志\s+(\d+)/);
    if (defMatch) {
        options.ac = parseInt(defMatch[1]);
        options.fortitude = parseInt(defMatch[2]);
        options.reflex = parseInt(defMatch[3]);
        options.will = parseInt(defMatch[4]);
    }

    // 速度
    const speedMatch = txt.match(/速度\s*(\d+)/);
    if (speedMatch) options.speed = parseInt(speedMatch[1]);

    // 先攻和感官
    const initMatch = txt.match(/先攻\+(\d+)/);
    if (initMatch) options.initiative = parseInt(initMatch[1]);

    const sensesMatch = txt.match(/侦查\+(\d+)/);
    if (sensesMatch) {
        options.senses = `侦查 +${sensesMatch[1]}`;
        options.skills.push(`侦查 +${sensesMatch[1]}`);
    }
}

function parseAbilities(txt, options) {
    // 格式: "力量 23(+13) 敏捷 20(+12)..."
    const abilities = [
        ['STR', '力量'],
        ['DEX', '敏捷'],
        ['CON', '体质'],
        ['INT', '智力'],
        ['WIS', '感知'],
        ['CHA', '魅力']
    ];

    abilities.forEach(([key, zhName]) => {
        const match = txt.match(new RegExp(zhName + '\\s*(\\d+)[（(]\\+?([\\-\\d]+)[)）]'));
        if (match) {
            options.abilities[key] = {
                value: parseInt(match[1]),
                modifier: parseInt(match[2])
            };
        }
    });
}

function parsePowers(txt, options) {
    // 查找动作块（标准动作、次要动作等）
    const actionBlocks = txt.split(/(?:标准动作|次要动作|自由动作|即时动作)/);

    actionBlocks.forEach(block => {
        // 解析单个技能/攻击
        // 格式: "名称（属性）·类型\n详细描述"
        const powerMatches = block.matchAll(/(.+?)[（(](.+?)[)）]·(.+?)\n([^]+)/g);

        for (const match of powerMatches) {
            const name = match[1].trim();
            const actionType = match[2].trim();
            const useType = match[3].trim();
            const description = match[4].trim();

            // 判断是武器还是技能
            if (name.includes('近战') || name.includes('武器')) {
                // 作为武器
                const rangeMatch = description.match(/触及\s*(\d+)/);
                const atkMatch = description.match(/\+(\d+)vs\.?(\w+)/);
                const dmgMatch = description.match(/(\d+d\d+\+?\d*)\s*伤害/);

                options.weapons.push({
                    name: name.replace(/基本近战[：:]\s*/, ''),
                    type: 'Melee',
                    action: actionType,
                    range: rangeMatch ? parseInt(rangeMatch[1]) : 1,
                    proficiency: 3,
                    bonus: atkMatch ? parseInt(atkMatch[1]) : 0,
                    target: atkMatch ? atkMatch[2].toLowerCase() : 'ac',
                    weapon: dmgMatch ? dmgMatch[1] : '1d8',
                    damage: dmgMatch ? dmgMatch[1] : '',
                    effect: '',
                    missEffect: null
                });
            }

            // 同时也作为 power 记录
            const power = {
                name: name.replace(/\s+/g, ''),
                displayName: name,
                useType: useType.includes('充能') ? 'recharge' :
                         useType.includes('遭遇') ? 'encounter' :
                         useType.includes('每日') ? 'daily' : 'atwill',
                actionType: block.includes('次要') ? 'minor' :
                           block.includes('自由') ? 'free' : 'standard',
                range: '',
                target: '',
                description: description,
                damage: null,
                attackBonus: null,
                missEffect: null
            };

            // 提取范围和目标
            const rangeMatch = description.match(/(触及|射程|近程冲击|视线)\s*(\d+)?/);
            if (rangeMatch) {
                power.range = rangeMatch[1] + (rangeMatch[2] ? ` ${rangeMatch[2]}` : '');
            }

            const targetMatch = description.match(/(一个生物|范围内所有敌人|一个敌人)/);
            if (targetMatch) {
                power.target = targetMatch[1];
            }

            const atkMatch = description.match(/\+(\d+)vs\.?(\w+)/);
            if (atkMatch) {
                power.attackBonus = `+${atkMatch[1]} vs. ${atkMatch[2]}`;
            }

            const dmgMatch = description.match(/(\d+d\d+\+?\d*)\s*伤害/);
            if (dmgMatch) {
                power.damage = dmgMatch[1];
            }

            options.powers.push(power);
        }
    });
}

function parseTraits(txt, options) {
    // 查找特性块
    const traitsMatch = txt.match(/特性\s*\n(.+?)(?=\n\s*\n|标准动作|次要动作)/s);
    if (traitsMatch) {
        const traitLines = traitsMatch[1].trim().split('\n');
        for (let i = 0; i < traitLines.length; i++) {
            const name = traitLines[i].trim();
            if (name && !name.includes('：')) {
                const desc = traitLines[i + 1] ? traitLines[i + 1].trim() : '';
                if (desc) {
                    options.traits.push({
                        name: name.replace(/\s+/g, ''),
                        displayName: name,
                        description: desc,
                        icon: '',
                        type: 'passive'
                    });
                    i++; // 跳过描述行
                }
            }
        }
    }
}

function parseEquipmentAndLanguages(txt, options) {
    // 装备
    const equipMatch = txt.match(/装备[：:]\s*([^\n]+)/);
    if (equipMatch) {
        options.equipment = equipMatch[1].split(/[，,]/).map(s => s.trim());
    }

    // 语言和阵营
    const alignLangMatch = txt.match(/阵营[：:]\s*(\S+)\s+语言[：:]\s*(.+)/);
    if (alignLangMatch) {
        options.alignment = alignLangMatch[1];
        options.languages = alignLangMatch[2].split(/[，,]/).map(s => s.trim());
    }

    // 技能
    const skillMatch = txt.match(/技能[：:]\s*([^\n]+)/);
    if (skillMatch) {
        // 解析 "运动+18" 格式
        const skills = skillMatch[1].split(/[\s，,]/);
        skills.forEach(s => {
            if (s && s.includes('+')) {
                options.skills.push(s.trim());
            }
        });
    }
}

// ==================== 生成函数 ====================

function generateCreatureJson(options, creatureName) {
    const json = {
        name: options.name,
        nameEn: options.nameEn || creatureName,
        level: options.level,
        role: options.role,
        xp: options.xp,
        size: options.size,
        type: options.type,
        origin: options.origin,
        hp: options.hp,
        maxHp: options.hp,
        bloodied: options.bloodied,
        ac: options.ac,
        fortitude: options.fortitude,
        reflex: options.reflex,
        will: options.will,
        speed: options.speed,
        fly: options.fly,
        initiative: options.initiative,
        senses: options.senses,
        immunities: options.immunities,
        resistances: options.resistances,
        alignment: options.alignment,
        languages: options.languages,
        skills: options.skills,
        abilities: options.abilities,
        equipment: options.equipment,
        weapons: options.weapons,
        powers: options.powers,
        traits: options.traits,
        feats: options.feats,
        notes: options.notes
    };
    return JSON.stringify(json, null, 2);
}

function generateAnimationConfig(options) {
    const frameSize = FRAME_SIZES[options.size] || FRAME_SIZES['中型'];
    const anchor = { x: frameSize.width / 2, y: frameSize.height - 24 };

    const animations = [];
    for (const [name, config] of Object.entries(ANIMATION_CONFIG)) {
        animations.push({
            name,
            frames: config.frames,
            fps: config.fps,
            loop: config.loop
        });
    }

    return JSON.stringify({
        version: "1.0",
        creature: {
            name: options.name,
            size: options.size,
            frameWidth: frameSize.width,
            frameHeight: frameSize.height,
            anchor: anchor
        },
        animations
    }, null, 2);
}

function generateReadme(options, creatureName) {
    const abilitiesStr = [
        `STR ${options.abilities.STR.value} (+${options.abilities.STR.modifier})`,
        `DEX ${options.abilities.DEX.value} (+${options.abilities.DEX.modifier})`,
        `CON ${options.abilities.CON.value} (+${options.abilities.CON.modifier})`,
        `INT ${options.abilities.INT.value} (+${options.abilities.INT.modifier})`,
        `WIS ${options.abilities.WIS.value} (+${options.abilities.WIS.modifier})`,
        `CHA ${options.abilities.CHA.value} (+${options.abilities.CHA.modifier})`
    ].join('\n');

    return `# ${options.name} (${options.nameEn || creatureName})

## 基本信息

- **等级**: ${options.level}
- **角色**: ${options.role} ${options.origin ? `(${options.origin})` : ''}
- **体型**: ${options.size}
- **类型**: ${options.type}
- **XP**: ${options.xp}

## 属性

| 属性 | 值 |
|------|-----|
| HP | ${options.hp} |
| Bloodied | ${options.bloodied} |
| AC | ${options.ac} |
| Fortitude | ${options.fortitude} |
| Reflex | ${options.reflex} |
| Will | ${options.will} |
| Speed | ${options.speed} |
| Initiative | +${options.initiative} |

## 能力值

\`\`\`
${abilitiesStr}
\`\`\`

## 技能

${options.skills.length > 0 ? options.skills.map(s => `- ${s}`).join('\n') : '无'}

## 装备

${options.equipment.length > 0 ? options.equipment.map(e => `- ${e}`).join('\n') : '无'}

## 特性

${options.traits.length > 0 ? options.traits.map(t => `- **${t.displayName}**: ${t.description}`).join('\n') : '无'}

## 技能

${options.powers.map(p => `- **${p.displayName}** (${p.useType}): ${p.description}`).join('\n')}

## 文件说明

- \`${creatureName}.json\` - 核心生物数据
- \`data-des.txt\` - 约束条件文件
- \`anim/character.json\` - 动画配置
- \`anim/standard/\` - 标准精灵图
- \`avatar.png\` - UI 头像 (推荐 256x256)

---
*由 creatureGenerator.cjs 自动生成*
`;
}

function generateStandardAnimReadme(creatureName, options) {
    const frameSize = FRAME_SIZES[options.size] || FRAME_SIZES['中型'];
    const totalFrames = 36;

    return `# ${creatureName} 标准动画精灵图

## 规格

- **文件名**: \`${creatureName}_body.png\`
- **帧尺寸**: ${frameSize.width}x${frameSize.height} 像素
- **总帧数**: ${totalFrames} 帧
- **布局**: 横向排列，每帧 ${frameSize.width}x${frameSize.height}

## 动画帧分配

| 动画 | 帧范围 | 帧数 | FPS |
|------|--------|------|-----|
| Idle | 0-5 | 6 | 6 |
| Walk | 6-13 | 8 | 8 |
| Run | 14-21 | 8 | 10 |
| Attack | 22-26 | 5 | 12 |
| Hurt | 27-29 | 3 | 8 |
| Death | 30-35 | 6 | 6 |

## 精灵图尺寸

- 单帧: ${frameSize.width}x${frameSize.height}
- 总宽度: ${frameSize.width * totalFrames} 像素
- 总高度: ${frameSize.height} 像素

## 锚点设置

- X: ${frameSize.width / 2} (中心)
- Y: ${frameSize.height - 24} (脚底)
`;
}

function generateCreditsReadme(creatureName) {
    return `# ${creatureName} 资源归属

## 资源来源

请在此记录资源的原始来源和授权信息。

## 艺术家

- **精灵图**: [艺术家名称] - [链接]
- **头像**: [艺术家名称] - [链接]
- **音效**: [艺术家名称] - [链接] (如有)

## 授权

请记录资源的使用许可:
- CC0
- CC-BY
- CC-BY-SA
- 其他

## 修改记录

- [日期] - [修改内容]
`;
}

function generateCustomAnimReadme(creatureName) {
    return `# ${creatureName} 自定义动画

## 用途

此文件夹用于存放非标准动画，如:
- 特殊技能动画
- 受击状态变体
- 环境交互动画

## 文件命名规范

- \`<animation_name>.png\` - 单个动画精灵图
- \`<animation_name>.json\` - 动画配置

## 配置示例

\`\`\`json
{
  "name": "special_attack",
  "frames": [0, 1, 2, 3],
  "fps": 12,
  "loop": false
}
\`\`\`
`;
}

// ==================== 主函数 ====================

function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('\n【生物文件夹生成器】');
        console.log('\n使用方式:');
        console.log('  node creatureGenerator.cjs <生物名称> [资源路径]');
        console.log('\n示例:');
        console.log('  node creatureGenerator.cjs CYCLOPS');
        console.log('  node creatureGenerator.cjs goblin src/assets/creature');
        console.log('\n说明:');
        console.log('  - 需要先在生物文件夹中创建 data-des.txt 约束文件');
        console.log('  - AI 会自动分析约束文件格式并生成对应数据');
        console.log('  - 如需支持新格式，请在 aiParseDataDes 函数中添加解析逻辑');
        process.exit(1);
    }

    const creatureName = args[0];
    const basePath = args[1] || DEFAULT_CREATURE_BASE_PATH;
    const creaturePath = path.join(basePath, creatureName);

    // 检查文件夹是否存在
    if (!fs.existsSync(creaturePath)) {
        console.log(`✗ 生物文件夹不存在: ${creaturePath}`);
        console.log('  请先创建文件夹或检查名称是否正确');
        process.exit(1);
    }

    // 检查 data-des.txt
    const dataDesPath = path.join(creaturePath, 'data-des.txt');
    if (!fs.existsSync(dataDesPath)) {
        console.log(`✗ 约束文件不存在: ${dataDesPath}`);
        console.log('  请创建 data-des.txt 文件');
        process.exit(1);
    }

    // 读取约束文件
    const dataDesContent = fs.readFileSync(dataDesPath, 'utf-8');

    // AI 解析
    console.log(`→ 正在解析 ${dataDesPath}...`);
    const options = createEmptyCreatureOptions();
    aiParseDataDes(dataDesContent, options);
    console.log(`  名称: ${options.name}`);
    console.log(`  等级: ${options.level}`);
    console.log(`  体型: ${options.size}`);
    console.log(`  技能数: ${options.powers.length}`);
    console.log(`  特性数: ${options.traits.length}`);

    // 生成文件
    console.log(`→ 正在生成文件...`);

    // 1. 生成生物 JSON
    const jsonPath = path.join(creaturePath, `${creatureName}.json`);
    fs.writeFileSync(jsonPath, generateCreatureJson(options, creatureName));
    console.log(`  ✓ ${creatureName}.json`);

    // 2. 生成 README
    const readmePath = path.join(creaturePath, 'README.md');
    fs.writeFileSync(readmePath, generateReadme(options, creatureName));
    console.log(`  ✓ README.md`);

    // 3. 创建 anim 文件夹结构
    const animPath = path.join(creaturePath, 'anim');
    if (!fs.existsSync(animPath)) fs.mkdirSync(animPath, { recursive: true });

    // 4. 生成动画配置
    const characterJsonPath = path.join(animPath, 'character.json');
    fs.writeFileSync(characterJsonPath, generateAnimationConfig(options));
    console.log(`  ✓ anim/character.json`);

    // 5. 创建子文件夹
    const standardPath = path.join(animPath, 'standard');
    const customPath = path.join(animPath, 'custom');
    const creditsPath = path.join(animPath, 'credits');

    if (!fs.existsSync(standardPath)) fs.mkdirSync(standardPath, { recursive: true });
    if (!fs.existsSync(customPath)) fs.mkdirSync(customPath, { recursive: true });
    if (!fs.existsSync(creditsPath)) fs.mkdirSync(creditsPath, { recursive: true });

    // 6. 生成 README 文件
    fs.writeFileSync(path.join(standardPath, 'README.md'), generateStandardAnimReadme(creatureName, options));
    console.log(`  ✓ anim/standard/README.md`);

    fs.writeFileSync(path.join(customPath, 'README.md'), generateCustomAnimReadme(creatureName));
    console.log(`  ✓ anim/custom/README.md`);

    fs.writeFileSync(path.join(creditsPath, 'README.md'), generateCreditsReadme(creatureName));
    console.log(`  ✓ anim/credits/README.md`);

    console.log(`\n✓ 生成完成!`);
    console.log(`\n下一步:`);
    console.log(`  1. 添加头像: ${creaturePath}/avatar.png (256x256)`);
    console.log(`  2. 添加精灵图: ${standardPath}/${creatureName}_body.png`);
}

// 运行主函数
if (require.main === module) {
    main();
}

module.exports = {
    createEmptyCreatureOptions,
    aiParseDataDes,
    generateCreatureJson,
    generateAnimationConfig,
    generateReadme,
    FRAME_SIZES,
    ANIMATION_CONFIG
};
