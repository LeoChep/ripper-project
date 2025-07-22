import type { PowerData, PowerSystem } from './PowerInterface';
import { PowerFactory } from './PowerManager';
import { Power } from './Power';

/**
 * 文本到Power对象的转换器
 */
export class TextToPowerConverter {
  
  /**
   * 从文本内容解析并创建Power对象
   */
  static parsePowerFromText(text: string): Power {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    if (lines.length === 0) {
      throw new Error('文本内容为空');
    }

    // 解析基本信息
    const parsed = this.parseBasicInfo(lines);
    
    // 创建PowerData对象
    const powerData: PowerData = this.createPowerData(parsed);
    
    // 使用PowerFactory创建Power实例
    return PowerFactory.createPower(powerData);
  }

  /**
   * 解析文本的基本信息
   */
  private static parseBasicInfo(lines: string[]) {
    const info = {
      name: '',
      subName: '',
      description: '',
      keywords: [] as string[],
      actionType: 'standard',
      useType: 'atwill',
      rangeType: 'melee',
      range: 1,
      target: 'One Creature',
      ability: 'str',
      defense: 'ac',
      damage: '',
      effect: '',
      level: '1',
      powersource: 'martial',
      weaponType: 'melee'
    };

    // 第一行：技能名称
    if (lines[0]) {
      // 移除末尾的标识符（如HoF, DSCS等）
      // 使用更灵活的正则表达式来匹配末尾的大写字母标识符，允许多个空格
      const nameWithoutSuffix = lines[0].replace(/\s+[A-Z]{2,}$/, '');
      info.name = nameWithoutSuffix.trim();
    }

    // 第二行：子名称（如"德鲁伊攻击 1"）
    if (lines[1]) {
      info.subName = lines[1];
      
      // 从子名称推断等级
      const levelMatch = lines[1].match(/(\d+)/);
      if (levelMatch) {
        info.level = levelMatch[1];
      }

      // 从子名称推断能力来源
      if (lines[1].includes('德鲁伊')) {
        info.powersource = 'primal';
        info.ability = 'wis';
      } else if (lines[1].includes('法师') || lines[1].includes('术士')) {
        info.powersource = 'arcane';
        info.ability = 'int';
      } else if (lines[1].includes('牧师') || lines[1].includes('圣武士')) {
        info.powersource = 'divine';
        info.ability = 'wis';
      }
    }

    // 第三行：英文描述
    if (lines[2]) {
      info.description = lines[2];
    }

    let currentLineIndex = 3;

    // 解析关键词行（如"随意✦法器，原力"）
    if (currentLineIndex < lines.length) {
      const keywordLine = lines[currentLineIndex];
      
      // 解析使用类型
      if (keywordLine.includes('随意')) {
        info.useType = 'atwill';
      } else if (keywordLine.includes('遭遇')) {
        info.useType = 'encounter';
      } else if (keywordLine.includes('每日')) {
        info.useType = 'daily';
      }

      // 解析关键词
      const keywordMatch = keywordLine.match(/✦(.+)$/);
      if (keywordMatch) {
        info.keywords = keywordMatch[1].split(/[，,]/).map(k => k.trim()).filter(k => k);
        
        // 根据关键词推断武器类型和能力来源
        if (info.keywords.some(k => k.includes('法器') || k.includes('原力'))) {
          info.weaponType = 'implement';
          info.powersource = info.powersource === 'martial' ? 'arcane' : info.powersource;
        }
      }
      
      currentLineIndex++;
    }

    // 解析动作和范围行（如"标准动作✦远程10"）
    if (currentLineIndex < lines.length) {
      const actionLine = lines[currentLineIndex];
      
      // 解析动作类型
      if (actionLine.includes('标准动作')) {
        info.actionType = 'standard';
      } else if (actionLine.includes('移动动作')) {
        info.actionType = 'move';
      } else if (actionLine.includes('次要动作')) {
        info.actionType = 'minor';
      }

      // 解析范围
      const rangeMatch = actionLine.match(/([远程近战]+)(\d*)/);
      if (rangeMatch) {
        if (rangeMatch[1].includes('远程')) {
          info.rangeType = 'range';
          info.weaponType = info.weaponType === 'melee' ? 'ranged' : info.weaponType;
          info.range = rangeMatch[2] ? parseInt(rangeMatch[2]) : 10;
        } else if (rangeMatch[1].includes('近战')) {
          info.rangeType = 'melee';
          info.weaponType = 'melee';
          info.range = rangeMatch[2] ? parseInt(rangeMatch[2]) : 1;
        }
      }
      
      currentLineIndex++;
    }

    // 解析目标行
    if (currentLineIndex < lines.length && lines[currentLineIndex].startsWith('目标：')) {
      info.target = lines[currentLineIndex].replace('目标：', '').trim();
      currentLineIndex++;
    }

    // 解析攻击行（如"攻击：感知 vs. 反射"）
    if (currentLineIndex < lines.length && lines[currentLineIndex].startsWith('攻击：')) {
      const attackLine = lines[currentLineIndex].replace('攻击：', '').trim();
      
      // 解析能力值
      if (attackLine.includes('力量')) {
        info.ability = 'str';
      } else if (attackLine.includes('敏捷')) {
        info.ability = 'dex';
      } else if (attackLine.includes('体质')) {
        info.ability = 'con';
      } else if (attackLine.includes('智力')) {
        info.ability = 'int';
      } else if (attackLine.includes('感知')) {
        info.ability = 'wis';
      } else if (attackLine.includes('魅力')) {
        info.ability = 'cha';
      }

      // 解析防御类型
      if (attackLine.includes('vs.') || attackLine.includes('vs ')) {
        const defenseMatch = attackLine.match(/vs\.?\s*(.+)/);
        if (defenseMatch) {
          const defense = defenseMatch[1].trim();
          if (defense.includes('AC') || defense === '护甲等级') {
            info.defense = 'ac';
          } else if (defense.includes('强韧')) {
            info.defense = 'fortitude';
          } else if (defense.includes('反射')) {
            info.defense = 'reflex';
          } else if (defense.includes('意志')) {
            info.defense = 'will';
          }
        }
      }
      
      currentLineIndex++;
    }

    // 解析命中行
    if (currentLineIndex < lines.length && lines[currentLineIndex].startsWith('命中：')) {
      info.damage = lines[currentLineIndex].replace('命中：', '').trim();
      currentLineIndex++;
    }

    // 解析效果行
    if (currentLineIndex < lines.length && lines[currentLineIndex].startsWith('效果：')) {
      info.effect = lines[currentLineIndex].replace('效果：', '').trim();
      currentLineIndex++;
    }

    // 解析升级行（如"21级：2d4 + 感知调整值的伤害。"）
    if (currentLineIndex < lines.length && lines[currentLineIndex].match(/\d+级：/)) {
      // 可以在这里添加升级效果的处理
      currentLineIndex++;
    }

    return info;
  }

  /**
   * 创建PowerData对象
   */
  private static createPowerData(parsed: any): PowerData {
    // 构建完整的描述
    const fullDescription = this.buildFullDescription(parsed);

    return {
      name: parsed.name,
      type: "power",
      system: {
        description: {
          value: fullDescription,
          chat: "",
          unidentified: ""
        },
        descriptionGM: {
          value: "",
          chat: "",
          unidentified: ""
        },
        source: "",
        activation: {
          type: "",
          cost: 0,
          condition: ""
        },
        duration: {
          value: null,
          units: ""
        },
        target: parsed.target,
        range: {
          value: parsed.range,
          long: null,
          units: ""
        },
        uses: {
          value: 0,
          max: "0",
          per: ""
        },
        consume: {
          type: "",
          target: "",
          amount: null
        },
        macro: {
          type: "script",
          scope: "global",
          launchOrder: "off",
          command: "",
          author: "",
          autoanimationHook: ""
        },
        attack: {
          shareAttackRoll: false,
          isAttack: true,
          isBasic: true,
          isCharge: false,
          isOpp: false,
          canCharge: false,
          canOpp: false,
          ability: parsed.ability,
          abilityBonus: 0,
          def: parsed.defense,
          defBonus: 0,
          formula: "@wepAttack + @powerMod + @lvhalf"
        },
        hit: {
          shareDamageRoll: false,
          isDamage: true,
          isHealing: false,
          healSurge: "",
          baseQuantity: "1",
          baseDiceType: parsed.weaponType === 'implement' ? "d4" : "weapon",
          detail: parsed.damage,
          formula: "@powBase + @powerMod + @wepDamage",
          critFormula: "@powMax + @powerMod + @wepDamage + @wepCritBonus",
          healFormula: ""
        },
        miss: {
          detail: "",
          formula: ""
        },
        effect: {
          detail: parsed.effect
        },
        damage: { parts: [] },
        damageCrit: { parts: [] },
        damageImp: { parts: [] },
        damageCritImp: { parts: [] },
        damageType: this.inferDamageType(parsed),
        keyWords: parsed.keywords,
        level: parsed.level,
        powersource: parsed.powersource,
        secondPowersource: parsed.powersource,
        powersourceName: "",
        subName: parsed.subName,
        prepared: true,
        powerType: "class",
        powerSubtype: "attack",
        useType: parsed.useType,
        actionType: parsed.actionType,
        requirements: "",
        weaponType: parsed.weaponType,
        weaponUse: "default",
        rangeType: parsed.rangeType,
        rangeTextShort: "",
        rangeText: "",
        rangePower: "",
        area: 0,
        rechargeRoll: "",
        rechargeCondition: "",
        damageShare: false,
        postEffect: true,
        postSpecial: true,
        autoGenChatPowerCard: true,
        sustain: {
          actionType: "",
          detail: ""
        },
        trigger: "",
        requirement: "",
        special: "",
        specialAdd: { parts: [] },
        effectType: this.inferEffectType(parsed),
        keywordsCustom: "",
        tooltip: "从文本转换生成",
        type: parsed.useType,
        effectHTML: false,
        chatFlavor: ""
      },
      _id: this.generateId(),
      img: "icons/svg/combat.svg",
      effects: [],
      folder: null,
      sort: 0,
      ownership: { default: 0 },
      flags: {},
      _stats: {
        compendiumSource: null,
        duplicateSource: null,
        coreVersion: "12.331",
        systemId: "dnd4e",
        systemVersion: "0.6.9",
        createdTime: Date.now(),
        modifiedTime: Date.now(),
        lastModifiedBy: "text-converter"
      }
    };
  }

  /**
   * 构建完整的描述文本
   */
  private static buildFullDescription(parsed: any): string {
    const parts = [
      `<p>${parsed.name}</p>`,
      `<p>${parsed.subName}</p>`
    ];

    if (parsed.description) {
      parts.push(`<p>${parsed.description}</p>`);
    }

    if (parsed.keywords.length > 0) {
      const useTypeText = parsed.useType === 'atwill' ? '随意' : 
                         parsed.useType === 'encounter' ? '遭遇' : '每日';
      parts.push(`<p>${useTypeText}✦${parsed.keywords.join('，')}</p>`);
    }

    const actionText = parsed.actionType === 'standard' ? '标准动作' :
                      parsed.actionType === 'move' ? '移动动作' : '次要动作';
    const rangeText = parsed.rangeType === 'range' ? '远程' : '近战';
    parts.push(`<p>${actionText}✦${rangeText}${parsed.range > 1 ? parsed.range : ''}</p>`);

    parts.push(`<p>目标：\t${parsed.target}</p>`);
    
    const abilityText = this.getAbilityChineseName(parsed.ability);
    const defenseText = this.getDefenseChineseName(parsed.defense);
    parts.push(`<p>攻击：\t${abilityText} vs. ${defenseText}</p>`);

    if (parsed.damage) {
      parts.push(`<p>命中：\t${parsed.damage}</p>`);
    }

    if (parsed.effect) {
      parts.push(`<p>效果：\t${parsed.effect}</p>`);
    }

    return parts.join('');
  }

  /**
   * 推断伤害类型
   */
  private static inferDamageType(parsed: any) {
    const damageType = {
      damage: false,
      acid: false,
      cold: false,
      fire: false,
      force: false,
      lightning: false,
      necrotic: false,
      physical: true, // 默认为物理伤害
      poison: false,
      psychic: false,
      radiant: false,
      thunder: false
    };

    // 根据关键词和描述推断伤害类型
    const text = (parsed.damage + ' ' + parsed.keywords.join(' ')).toLowerCase();
    
    if (text.includes('原力') || text.includes('force')) {
      damageType.force = true;
      damageType.physical = false;
    }
    if (text.includes('火') || text.includes('fire')) {
      damageType.fire = true;
      damageType.physical = false;
    }
    if (text.includes('冰') || text.includes('cold')) {
      damageType.cold = true;
      damageType.physical = false;
    }
    if (text.includes('闪电') || text.includes('lightning')) {
      damageType.lightning = true;
      damageType.physical = false;
    }

    return damageType;
  }

  /**
   * 推断效果类型
   */
  private static inferEffectType(parsed: any) {
    return {
      transmutation: false,
      polymorph: false,
      teleportation: false,
      poison: false,
      runic: false,
      enchantment: false,
      invigorating: false,
      gaze: false,
      illusion: false,
      disease: false,
      stance: false,
      spirit: false,
      reliable: false,
      augmentable: false,
      fear: false,
      rage: false,
      rattling: false,
      aura: false,
      charm: false,
      mount: false,
      zone: false,
      fullDis: false,
      sleep: false,
      necro: false,
      nether: false,
      evocation: parsed.keywords.some((k: string) => k.includes('原力')),
      beast: false,
      beastForm: false,
      healing: false,
      channelDiv: false,
      shadow: false,
      elemental: false,
      summoning: false,
      conjuration: false
    };
  }

  /**
   * 获取能力值的中文名称
   */
  private static getAbilityChineseName(ability: string): string {
    const map: Record<string, string> = {
      'str': '力量',
      'dex': '敏捷',
      'con': '体质',
      'int': '智力',
      'wis': '感知',
      'cha': '魅力'
    };
    return map[ability] || ability;
  }

  /**
   * 获取防御的中文名称
   */
  private static getDefenseChineseName(defense: string): string {
    const map: Record<string, string> = {
      'ac': 'AC',
      'fortitude': '强韧',
      'reflex': '反射',
      'will': '意志'
    };
    return map[defense] || defense;
  }

  /**
   * 生成唯一ID
   */
  private static generateId(): string {
    return Math.random().toString(36).substr(2, 16);
  }
}

/**
 * Power对象的JSON打印器
 */
export class PowerJsonPrinter {
  
  /**
   * 将Power对象转换为格式化的JSON字符串
   */
  static printPowerJson(power: Power): string {
    const powerData = power.toJSON();
    return JSON.stringify(powerData, null, 2);
  }

  /**
   * 将Power对象保存为JSON文件（在浏览器环境中下载）
   */
  static downloadPowerJson(power: Power, filename?: string): void {
    const jsonString = this.printPowerJson(power);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `${power.name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * 打印Power对象的基本信息摘要
   */
  static printPowerSummary(power: Power): string {
    const summary = {
      name: power.name,
      level: power.level,
      useType: power.system.useType,
      actionType: power.actionType,
      range: power.range,
      weaponType: power.weaponType,
      ability: power.getPrimaryAbility(),
      defense: power.getTargetDefense(),
      keywords: power.getKeywords(),
      description: power.getHTMLDescription().replace(/<[^>]*>/g, '') // 移除HTML标签
    };
    
    return JSON.stringify(summary, null, 2);
  }

  /**
   * 比较两个Power对象的差异
   */
  static comparePowers(power1: Power, power2: Power): string {
    const data1 = power1.toJSON();
    const data2 = power2.toJSON();
    
    const differences: any = {};
    this.findDifferences(data1, data2, differences, '');
    
    return JSON.stringify(differences, null, 2);
  }

  /**
   * 递归查找对象差异
   */
  private static findDifferences(obj1: any, obj2: any, diff: any, path: string): void {
    for (const key in obj1) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (!(key in obj2)) {
        diff[currentPath] = { removed: obj1[key] };
      } else if (typeof obj1[key] === 'object' && obj1[key] !== null) {
        if (typeof obj2[key] !== 'object' || obj2[key] === null) {
          diff[currentPath] = { from: obj1[key], to: obj2[key] };
        } else {
          this.findDifferences(obj1[key], obj2[key], diff, currentPath);
        }
      } else if (obj1[key] !== obj2[key]) {
        diff[currentPath] = { from: obj1[key], to: obj2[key] };
      }
    }
    
    for (const key in obj2) {
      const currentPath = path ? `${path}.${key}` : key;
      if (!(key in obj1)) {
        diff[currentPath] = { added: obj2[key] };
      }
    }
  }
}
