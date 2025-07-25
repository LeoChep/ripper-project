import { Power } from '../power/Power';
import { Trait } from '../trait/Trait';

export interface CreatureAttack {
    name: string;
    type: string; // e.g. "Melee", "Ranged", "Burst"
    action: string; // e.g. "Standard Action; At-will", "Standard Action; Recharge 5,6"
    range?: number;
    attackBonus: number;
    target: string; // e.g. "AC", "Fortitude", "Will"
    damage: string;
    effect?: string;
    missEffect?: string;
}

export interface CreatureSkill {
    name: string;
    bonus: number;
}

export interface CreatureAbility {
    name: String
    value: number;
    modifier: number;
}

export interface CreatureResistance {
    type: string;
    value: number;
}

export interface CreatureOptions {
    maxHp: number;
    name: string;
    level: number;
    role: string;
    xp: number;
    size: string;
    type: string;
    hp: number;
    bloodied: number;
    ac: number;
    fortitude: number;
    reflex: number;
    will: number;
    speed: number;
    fly?: number;
    initiative: number;
    senses?: string;
    immunities?: string[];
    resistances?: CreatureResistance[];
    alignment?: string;
    languages?: string[];
    skills?: CreatureSkill[];
    abilities?: CreatureAbility[];
    equipment?: string[];
    attacks?: CreatureAttack[];
    traits?: Trait[];
    notes?: string[];
    powers?: Power[];
}

export class Creature {
    name: string;
    level: number;
    role: string;
    xp: number;
    size: string;
    type: string;
    hp: number;
    bloodied: number;
    ac: number;
    fortitude: number;
    reflex: number;
    will: number;
    speed: number;
    fly?: number;
    initiative: number;
    senses?: string;
    immunities: string[];
    resistances: CreatureResistance[];
    alignment?: string;
    languages: string[];
    skills: CreatureSkill[];
    abilities: CreatureAbility[];
    equipment: string[];
    maxHp: number;
    traits: Trait[];
    notes: string[];
    attacks: CreatureAttack[];
    powers: Power[];

    constructor(options: CreatureOptions) {
        this.name = options.name;
        this.level = options.level;
        this.role = options.role;
        this.xp = options.xp;
        this.size = options.size;
        this.type = options.type;
        this.hp = options.hp;
        this.maxHp = options.maxHp; // Initialize maxHp with hp
        this.bloodied = options.bloodied;
        this.ac = options.ac;
        this.fortitude = options.fortitude;
        this.reflex = options.reflex;
        this.will = options.will;
        this.speed = options.speed;
        this.fly = options.fly;
        this.initiative = options.initiative;
        this.senses = options.senses;
        this.immunities = options.immunities || [];
        this.resistances = options.resistances || [];
        this.alignment = options.alignment;
        this.languages = options.languages || [];
        this.skills = options.skills || [];
        this.abilities = options.abilities || [];
        this.equipment = options.equipment || [];
        this.attacks = options.attacks || [];
        this.traits = options.traits || [];
        this.notes = options.notes || [];
        this.powers = options.powers || [];
    }
}

/**
 * 将 angle.txt 的内容解析为 Creature 实例
 * @param txt angle.txt 的文本内容
 */
export function createCreatureOptions(txt: string): CreatureOptions {
    // 预处理：去除注释和多余空白
    txt = txt.replace(/\/\/.*\n/g, "").replace(/\r/g, "");

    // 1. 名称、类型、等级、职业、经验
    // 动态提取名称、类型、等级、职业、经验，兼容多种格式
    // 支持：中英文名、同一行或分行、不同顺序
    let name = "Unknown";
    let sizeType = "";
    let level = 0;
    let role = "";
    let xp = 0;

    // 先尝试匹配常见格式（如权天使、地亚空行者等）
    // 1.1 匹配两行模式（如权天使）
    let nameBlockMatch = txt.match(/["“]?(.+?)[”"]?\n(.+?)["”]?\t*["“]?LV(\d+)\s+(.+?)\nXP(\d+)/);
    if (nameBlockMatch) {
        // nameBlockMatch[1] 可能为：权天使（Angel of Authority）
        // 尝试提取括号内英文名
        const nameZhEnMatch = nameBlockMatch[1].match(/^(.+?)(?:（(.+?)）)?$/);
        if (nameZhEnMatch) {
            if (nameZhEnMatch[2]) {
                // 有中英文
                name = `${nameZhEnMatch[1].trim()} (${nameZhEnMatch[2].trim()})`;
            } else {
                name = nameZhEnMatch[1].trim();
            }
        } else {
            name = nameBlockMatch[1].trim();
        }
        sizeType = nameBlockMatch[2].trim();
        level = parseInt(nameBlockMatch[3]);
        role = nameBlockMatch[4].trim();
        xp = parseInt(nameBlockMatch[5]);
    } else {
        // 1.2 匹配一行模式（如地亚空行者）
        // 例："地亚空行者（Earth Archon Rumbler）                                    LV17 蛮战"
        //     中型 元素界 类人生物（地系）                                             XP1600
        const singleLineMatch = txt.match(/["“]?(.+?)[”"]?\s+LV(\d+)\s+([^\n]+)\n([^\n]+)\s+XP(\d+)/);
        if (singleLineMatch) {
            // singleLineMatch[1]: 名称
            // singleLineMatch[2]: 等级
            // singleLineMatch[3]: 职业
            // singleLineMatch[4]: 类型/体型
            // singleLineMatch[5]: XP
            const nameZhEnMatch = singleLineMatch[1].match(/^(.+?)(?:（(.+?)）)?$/);
            if (nameZhEnMatch) {
                if (nameZhEnMatch[2]) {
                    name = `${nameZhEnMatch[1].trim()} (${nameZhEnMatch[2].trim()})`;
                } else {
                    name = nameZhEnMatch[1].trim();
                }
            } else {
                name = singleLineMatch[1].trim();
            }
            level = parseInt(singleLineMatch[2]);
            role = singleLineMatch[3].trim();
            sizeType = singleLineMatch[4].trim();
            xp = parseInt(singleLineMatch[5]);
        } else {
            // 1.3 兜底：只提取第一行的名称
            const firstLine = txt.split('\n')[0].replace(/["“”]/g, '').trim();
            const nameZhEnMatch = firstLine.match(/^(.+?)(?:（(.+?)）)?$/);
            if (nameZhEnMatch) {
                if (nameZhEnMatch[2]) {
                    name = `${nameZhEnMatch[1].trim()} (${nameZhEnMatch[2].trim()})`;
                } else {
                    name = nameZhEnMatch[1].trim();
                }
            } else {
                name = firstLine;
            }
        }
    }

    // 2. HP、血量、AC、属性防御、速度、飞行
    const hpMatch = txt.match(/HP(\d+)/);
    const hp = hpMatch ? parseInt(hpMatch[1]) : 0;
    const bloodied = Math.floor(hp /2);

    const acMatch = txt.match(/AC(\d+)\s+强韧\s*(\d+)\s+反射\s*(\d+)\s+意志\s*(\d+)/);
    const ac = acMatch ? parseInt(acMatch[1]) : 0;
    const fortitude = acMatch ? parseInt(acMatch[2]) : 0;
    const reflex = acMatch ? parseInt(acMatch[3]) : 0;
    const will = acMatch ? parseInt(acMatch[4]) : 0;

    const speedMatch = txt.match(/速度\s*(\d+)/);
    const speed = speedMatch ? parseInt(speedMatch[1]) : 0;
    const flySpeedMatch = txt.match(/飞行\s*(\d+)/);
    const fly = flySpeedMatch ? parseInt(flySpeedMatch[1]) : undefined;

    // 3. 先攻、感官
    const initiativeMatch = txt.match(/先攻\+(\d+)\s+感官：(.+?)\n/);
    const initiative = initiativeMatch ? parseInt(initiativeMatch[1]) : 0;
    const senses = initiativeMatch ? initiativeMatch[2].trim() : "";

    // 4. 免疫、抗性
    const immunitiesMatch = txt.match(/免疫：([^；\n]+)/);
    const immunities = immunitiesMatch ? immunitiesMatch[1].split(/[，,]/).map(s => s.trim()) : [];

    const resistancesMatch = txt.match(/抗性：(\d+)\s*([^\s；\n]+)/);
    const resistances = resistancesMatch
        ? [{ type: resistancesMatch[2], value: parseInt(resistancesMatch[1]) }]
        : [];

    // 5. 语言、阵营
    const alignmentMatch = txt.match(/阵营：([^\s]+)\s+语言：([^\s]+)/);
    const alignment = alignmentMatch ? alignmentMatch[1] : "";
    const languages = alignmentMatch ? alignmentMatch[2].split(/[，,]/).map(s => s.trim()) : [];

    // 6. 技能
    const skillsMatch = txt.match(/技能：([^，]+)\+(\d+)，([^，]+)\+(\d+)/);
    const skills = skillsMatch
        ? [
            { name: "Insight", bonus: parseInt(skillsMatch[2]) },
            { name: "Religion", bonus: parseInt(skillsMatch[4]) }
        ]
        : [];

    // 7. 能力值（每项单独匹配，兼容分行）
    let abilities: CreatureAbility[] = [];
    const strengthMatch = txt.match(/力量\s*(\d+)[（(]\+?([-\d]+)[)）]/);
    const dexterityMatch = txt.match(/敏捷\s*(\d+)[（(]\+?([-\d]+)[)）]/);
    const constitutionMatch = txt.match(/体质\s*(\d+)[（(]\+?([-\d]+)[)）]/);
    const intelligenceMatch = txt.match(/智力\s*(\d+)[（(]\+?([-\d]+)[)）]/);
    const wisdomMatch = txt.match(/感知\s*(\d+)[（(]\+?([-\d]+)[)）]/);
    const charismaMatch = txt.match(/魅力\s*(\d+)[（(]\+?([-\d]+)[)）]/);

    if (strengthMatch) {
        abilities.push({ name: "Strength", value: parseInt(strengthMatch[1]), modifier: parseInt(strengthMatch[2]) });
    }
    if (dexterityMatch) {
        abilities.push({ name: "Dexterity", value: parseInt(dexterityMatch[1]), modifier: parseInt(dexterityMatch[2]) });
    }
    if (constitutionMatch) {
        abilities.push({ name: "Constitution", value: parseInt(constitutionMatch[1]), modifier: parseInt(constitutionMatch[2]) });
    }
    if (intelligenceMatch) {
        abilities.push({ name: "Intelligence", value: parseInt(intelligenceMatch[1]), modifier: parseInt(intelligenceMatch[2]) });
    }
    if (wisdomMatch) {
        abilities.push({ name: "Wisdom", value: parseInt(wisdomMatch[1]), modifier: parseInt(wisdomMatch[2]) });
    }
    if (charismaMatch) {
        abilities.push({ name: "Charisma", value: parseInt(charismaMatch[1]), modifier: parseInt(charismaMatch[2]) });
    }

    // 8. 装备
    const equipmentMatch = txt.match(/装备：([^\n]+)/);
    const equipment = equipmentMatch ? equipmentMatch[1].split(/[，,]/).map(s => s.trim()) : [];

    // 9. 攻击方式
    const attacks: CreatureAttack[] = [];
    // 动态提取所有攻击段落
    // 匹配如：基本近战：xxx（xxx）·xxx，xxx\n触及/射程/近程爆发...；+Nvs.XXX；xxx伤害...
    const attackBlockRegex = /(基本近战|远程|近程)：(.+?)（(.+?)）·(.+?)\n([^\n]+)/g;
    let match: RegExpExecArray | null;
    while ((match = attackBlockRegex.exec(txt)) !== null) {
        // match[1]: 攻击类别
        // match[2]: 名称
        // match[3]: 动作
        // match[4]: 属性/伤害类型
        // match[5]: 详细描述（如触及/射程/近程爆发...；+Nvs.XXX；xxx伤害...）
        let type = "";
        if (match[1].includes("近战")) type = "Melee";
        else if (match[1].includes("远程")) type = "Ranged";
        else if (match[1].includes("爆发")) type = "Close Burst";
        else type = match[1];

        // 匹配范围、攻击加值、防御类型、伤害
        // 例：触及 2；+27vs.AC；1d10+8 伤害以及 1d10 光耀伤害。
        // 例：射程 10；+26vs.强韧；2d10+8 闪电伤害...
        // 例：近程爆发 5；以敌人为目标；+26vs.意志；1d10+8 光耀伤害...
        const detail = match[5];
        let range = 0;
        let attackBonus = 0;
        let target = "";
        let damage = "";
        let effect = undefined;
        let missEffect = undefined;
 
        // 匹配范围
        const rangeMatch = detail.match(/(触及|射程|近程爆发)\s*(\d+)/);
        if (rangeMatch) {
            if (rangeMatch[1] === "触及") range = parseInt(rangeMatch[2]);
            else if (rangeMatch[1] === "射程") range = parseInt(rangeMatch[2]);
            else if (rangeMatch[1] === "近程爆发") range = parseInt(rangeMatch[2]);
        }

        // 匹配攻击加值、防御类型
        const atkMatch = detail.match(/\+(\d+)vs\.?([A-Z\u4e00-\u9fa5]+)/);
        if (atkMatch) {
            attackBonus = parseInt(atkMatch[1]);
            target = atkMatch[2];
        }

        // 匹配伤害
        const dmgMatch = detail.match(/；([^。\n]+)/);
        if (dmgMatch) {
            damage = dmgMatch[1].replace(/伤害/g, "damage");
        }

        // 匹配特殊效果（如失手、效果等，往下找几行）
        // 查找当前攻击段落后的几行
        const attackStartIdx = match.index + match[0].length;
        const nextLines = txt.slice(attackStartIdx, attackStartIdx + 200).split('\n');
        for (let i = 0; i < nextLines.length; i++) {
            if (/失手：/.test(nextLines[i])) {
                missEffect = nextLines[i].replace(/失手：/, "").replace(/。$/, "").trim();
            }
            if (/效果：/.test(nextLines[i])) {
                effect = nextLines[i].replace(/效果：/, "").replace(/。$/, "").trim();
            }
        }

        attacks.push({
            name: match[2].trim(),
            type,
            action: match[3].trim(),
            range,
            attackBonus,
            target,
            damage,
            effect,
            missEffect
        });
    }

    // 10. 特性
    const traits: Trait[] = [];
    // 这里可以根据需要解析文本中的特性信息并创建 Trait 实例
    // const traitMatch = txt.match(/天使仪态（不处于重伤时）\n([^\n]+)/);
    // if (traitMatch) {
    //     const trait = new Trait();
    //     trait.name = "Angelic Presence";
    //     trait.displayName = "天使仪态";
    //     trait.description = traitMatch[1].trim();
    //     traits.push(trait);
    // }

    // 11. 备注
    const notes: string[] = [];
    if (equipment.length > 0) notes.push("Equipment: " + equipment.join(", "));

    // 12. 类型拆分
    let size = "";
    let type = "";
    if (sizeType) {
        const arr = sizeType.split(/\s+/);
        size = arr[0] || "";
        type = arr.slice(1).join(" ") || "";
    }

    // 组装 CreatureOptions
    const options: CreatureOptions = {
        name,
        level,
        role,
        xp,
        size,
        type,
        hp,
        bloodied,
        ac,
        fortitude,
        reflex,
        will,
        speed,
        fly,
        initiative,
        senses,
        immunities,
        resistances,
        alignment,
        languages,
        skills,
        abilities,
        equipment,
        attacks,
        traits,
        notes,
        maxHp: 0,
        powers: []
    };

    return options; // 返回 JSON 字符串
}

export function createCreature(creatureOptions:CreatureOptions): Creature {
    return new Creature(creatureOptions);
}