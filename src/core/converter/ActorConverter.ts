/**
 * Actor转换器 - 用于在JSON和Actor类之间转换
 */

import { Actor } from '../class/Actor';
import { ActorPojo } from '../type/ActorPojo';

/**
 * Actor转换器类
 */
export class ActorConverter {
  
  /**
   * 从JSON数据创建Actor实例
   */
  static fromJSON(jsonData: any): Actor {
    // 确保数据结构完整
    const actorData: Partial<ActorPojo> = {
      name: jsonData.name || "未命名角色",
      type: jsonData.type || "Player Character",
      img: jsonData.img || "icons/svg/mystery-man.svg",
      system: jsonData.system || {},
      prototypeToken: jsonData.prototypeToken || {},
      items: jsonData.items || [],
      effects: jsonData.effects || [],
      folder: jsonData.folder || null,
      flags: jsonData.flags || {},
      _stats: jsonData._stats
    };

    return new Actor(actorData);
  }

  /**
   * 从wukin.json文件路径加载Actor
   */
  static async fromWukinFile(filePath: string): Promise<Actor> {
    try {
      const response = await fetch(filePath);
      const jsonData = await response.json();
      return this.fromJSON(jsonData);
    } catch (error) {
      console.error('加载wukin文件失败:', error);
      throw new Error(`无法加载角色文件: ${filePath}`);
    }
  }

  /**
   * 将Actor转换为JSON字符串
   */
  static toJSON(actor: Actor): string {
    return actor.toJSON();
  }

  /**
   * 将Actor数据转换为普通对象
   */
  static toPlainObject(actor: Actor): ActorPojo {
    return actor.getData();
  }

  /**
   * 创建默认的D&D 4E角色
   */
  static createDefaultCharacter(name: string = "新角色"): Actor {
    const defaultData: Partial<ActorPojo> = {
      name: name,
      type: "Player Character",
      img: "icons/svg/mystery-man.svg"
    };

    const actor = new Actor(defaultData);
    
    // 设置一些基础数值
    actor.setAbilityScore('str', 10);
    actor.setAbilityScore('con', 10);
    actor.setAbilityScore('dex', 10);
    actor.setAbilityScore('int', 10);
    actor.setAbilityScore('wis', 10);
    actor.setAbilityScore('cha', 10);
    
    actor.level = 1;
    actor.maxHP = 20; // 假设的基础HP
    actor.currentHP = 20;
    actor.race = "人类";
    actor.characterClass = "战士";

    return actor;
  }

  /**
   * 从wukin模板创建角色的工厂方法
   */
  static createFromWukinTemplate(): Actor {
    const wukinData = {
      name: "乌金",
      type: "Player Character",
      img: "icons/svg/mystery-man.svg",
      system: {
        biography: "",
        details: {
          size: "med",
          origin: "natural",
          type: "humanoid",
          race: "人类",
          class: "德鲁伊",
          level: 2,
          tier: 1,
          exp: 0,
          bloodied: 0,
          surgeValue: 0
        },
        abilities: {
          str: { value: 10, chat: "@name uses @label." },
          con: { value: 11, chat: "@name uses @label." },
          dex: { value: 14, chat: "@name uses @label.", mod: 2 },
          int: { value: 10, chat: "@name uses @label." },
          wis: { value: 20, chat: "@name uses @label.", mod: 5 },
          cha: { value: 8, chat: "@name uses @label.", mod: -1 }
        },
        attributes: {
          hp: {
            value: 10,
            min: 0,
            max: 10,
            starting: 0,
            perlevel: 0,
            feat: 0,
            item: 0,
            power: 0,
            race: 0,
            untyped: 0,
            misc: 0,
            autototal: false,
            temprest: false
          },
          temphp: {
            value: null,
            max: 10
          },
          init: {
            value: 0,
            ability: "dex",
            bonus: [],
            feat: 0,
            item: 0,
            power: 0,
            race: 0,
            untyped: 0,
            notes: ""
          }
        },
        actionpoints: {
          value: 1,
          encounteruse: false,
          effects: "",
          notes: "",
          custom: ""
        }
      },
      items: [],
      effects: []
    };

    return this.fromJSON(wukinData);
  }

  /**
   * 验证Actor数据的完整性
   */
  static validateActorData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || data.name.trim() === '') {
      errors.push('角色名称不能为空');
    }

    if (!data.system) {
      errors.push('缺少system数据');
    } else {
      if (!data.system.details) {
        errors.push('缺少details数据');
      } else {
        if (!data.system.details.level || data.system.details.level < 1) {
          errors.push('角色等级必须大于0');
        }
        if (!data.system.details.race || data.system.details.race.trim() === '') {
          errors.push('角色种族不能为空');
        }
        if (!data.system.details.class || data.system.details.class.trim() === '') {
          errors.push('角色职业不能为空');
        }
      }

      if (!data.system.abilities) {
        errors.push('缺少abilities数据');
      } else {
        const requiredAbilities = ['str', 'con', 'dex', 'int', 'wis', 'cha'];
        for (const ability of requiredAbilities) {
          if (!data.system.abilities[ability] || 
              typeof data.system.abilities[ability].value !== 'number') {
            errors.push(`缺少或无效的${ability}属性`);
          }
        }
      }

      if (!data.system.attributes || !data.system.attributes.hp) {
        errors.push('缺少HP数据');
      } else {
        if (data.system.attributes.hp.max <= 0) {
          errors.push('最大HP必须大于0');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * 修复不完整的Actor数据
   */
  static repairActorData(data: any): any {
    const repairedData = JSON.parse(JSON.stringify(data));

    // 确保基础字段存在
    if (!repairedData.name) repairedData.name = "未命名角色";
    if (!repairedData.type) repairedData.type = "Player Character";
    if (!repairedData.img) repairedData.img = "icons/svg/mystery-man.svg";
    if (!repairedData.items) repairedData.items = [];
    if (!repairedData.effects) repairedData.effects = [];
    if (!repairedData.flags) repairedData.flags = {};

    // 确保system结构完整
    if (!repairedData.system) repairedData.system = {};
    if (!repairedData.system.details) repairedData.system.details = {};
    if (!repairedData.system.abilities) repairedData.system.abilities = {};
    if (!repairedData.system.attributes) repairedData.system.attributes = {};

    // 修复details
    const details = repairedData.system.details;
    if (!details.level) details.level = 1;
    if (!details.race) details.race = "人类";
    if (!details.class) details.class = "战士";
    if (!details.size) details.size = "med";
    if (!details.type) details.type = "humanoid";

    // 修复abilities
    const abilities = ['str', 'con', 'dex', 'int', 'wis', 'cha'];
    for (const ability of abilities) {
      if (!repairedData.system.abilities[ability]) {
        repairedData.system.abilities[ability] = {
          value: 10,
          chat: "@name uses @label."
        };
      }
    }

    // 修复attributes
    if (!repairedData.system.attributes.hp) {
      repairedData.system.attributes.hp = {
        value: 20,
        min: 0,
        max: 20,
        starting: 0,
        perlevel: 0,
        feat: 0,
        item: 0,
        power: 0,
        race: 0,
        untyped: 0,
        misc: 0,
        autototal: false,
        temprest: false
      };
    }

    if (!repairedData.system.attributes.temphp) {
      repairedData.system.attributes.temphp = {
        value: null,
        max: 10
      };
    }

    if (!repairedData.system.attributes.init) {
      repairedData.system.attributes.init = {
        value: 0,
        ability: "dex",
        bonus: [],
        feat: 0,
        item: 0,
        power: 0,
        race: 0,
        untyped: 0,
        notes: ""
      };
    }

    return repairedData;
  }

  /**
   * 比较两个Actor的差异
   */
  static compareActors(actor1: Actor, actor2: Actor): any {
    const data1 = actor1.getData();
    const data2 = actor2.getData();
    
    const differences: any = {};

    // 比较基础属性
    if (data1.name !== data2.name) {
      differences.name = { from: data1.name, to: data2.name };
    }

    if (data1.system.details.level !== data2.system.details.level) {
      differences.level = { 
        from: data1.system.details.level, 
        to: data2.system.details.level 
      };
    }

    // 比较HP
    if (data1.system.attributes.hp.value !== data2.system.attributes.hp.value) {
      differences.currentHP = {
        from: data1.system.attributes.hp.value,
        to: data2.system.attributes.hp.value
      };
    }

    // 比较属性值
    const abilities = ['str', 'con', 'dex', 'int', 'wis', 'cha'] as const;
    for (const ability of abilities) {
      if (data1.system.abilities[ability].value !== data2.system.abilities[ability].value) {
        differences[`${ability}Score`] = {
          from: data1.system.abilities[ability].value,
          to: data2.system.abilities[ability].value
        };
      }
    }

    return differences;
  }
}
