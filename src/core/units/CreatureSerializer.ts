import type { Creature, CreatureOptions } from "./Creature";
import type { Trait } from "../trait/Trait";
import type { Power } from "../power/Power";
import type { Weapon } from "./Weapon";
import { BuffSerializer } from "../buff/BuffSerializer";

export class CreatureSerializer {
  /**
   * 将 Creature 实例序列化为 POJO
   */
  static serializeCreature(creature: Creature): CreatureOptions {
    return {
      name: creature.name,
      level: creature.level,
      role: creature.role,
      xp: creature.xp,
      size: creature.size,
      type: creature.type,
      hp: creature.hp,
      maxHp: creature.maxHp,
      bloodied: creature.bloodied,
      ac: creature.ac,
      fortitude: creature.fortitude,
      reflex: creature.reflex,
      will: creature.will,
      speed: creature.speed,
      fly: creature.fly,
      initiative: creature.initiative,
      senses: creature.senses,
      immunities: [...creature.immunities], // 创建副本
      resistances: creature.resistances.map((r) => ({ ...r })), // 深拷贝
      alignment: creature.alignment,
      languages: [...creature.languages], // 创建副本
      skills: creature.skills.map((s) => ({ ...s })), // 深拷贝
      abilities: {
        STR: { ...creature.abilities.STR },
        DEX: { ...creature.abilities.DEX },
        CON: { ...creature.abilities.CON },
        INT: { ...creature.abilities.INT },
        WIS: { ...creature.abilities.WIS },
        CHA: { ...creature.abilities.CHA },
      },
      equipment: [...creature.equipment], // 创建副本
      attacks: creature.attacks.map((a) => ({ ...a })), // 深拷贝
      traits: creature.traits
        ? this.serializeTraits(creature.traits)
        : undefined,
      feats: creature.feats ? this.serializeTraits(creature.feats) : undefined,
      notes: [...creature.notes], // 创建副本
      powers: creature.powers
        ? this.serializePowers(creature.powers)
        : undefined,
      weapons: creature.weapons
        ? this.serializeWeapons(creature.weapons)
        : undefined,
      buffs: creature.buffs ? BuffSerializer.serializeArray(creature.buffs) : [],
    };
  }

  /**
   * 序列化 Trait 数组
   */
  private static serializeTraits(traits: Trait[]): any[] {
    return traits.map((trait) => ({
      name: trait.name,
      displayName: trait.displayName,
      description: trait.description,
      icon: trait.icon,
      type: trait.type,
      // 添加其他 Trait 属性
    }));
  }

  /**
   * 序列化 Power 数组
   */
  private static serializePowers(powers: Power[]): any[] {
    return powers.map((power) => {
      power.keyWords = power.keyWords || [];
      return {
        name: power.name,
        displayName: power.displayName,
        description: power.description,
        keyWords: [...power.keyWords],
        level: power.level,
        powersource: power.powersource,
        secondPowersource: power.secondPowersource,
        subName: power.subName,
        prepared: power.prepared,
        powerType: power.powerType,
        powerSubtype: power.powerSubtype,
        useType: power.useType,
        actionType: power.actionType,
        requirements: power.requirements,
        weaponType: power.weaponType,
        weaponUse: power.weaponUse,
        rangeType: power.rangeType,
        rangeTextShort: power.rangeTextShort,
        rangeText: power.rangeText,
        rangePower: power.rangePower,
        area: power.area,
        rechargeRoll: power.rechargeRoll,
        rechargeCondition: power.rechargeCondition,
        damageShare: power.damageShare,
        postEffect: power.postEffect,
        postSpecial: power.postSpecial,
        autoGenChatPowerCard: power.autoGenChatPowerCard,
        target: power.target,
        trigger: power.trigger,
        requirement: power.requirement,
        hookTime: power.hookTime,
        cooldown: power.cooldown,
      };
    });
  }

  /**
   * 序列化 Weapon 数组
   */
  private static serializeWeapons(weapons: Weapon[]): any[] {
    return weapons.map((weapon) => ({
      name: weapon.name,
      type: weapon.type,
      damage: weapon.damage,
      bonus: weapon.bonus,
      range: weapon.range,
      proficiency: weapon.proficiency,
      properties: weapon.properties ? [...weapon.properties] : undefined,
      weight: weapon.weight,
      cost: weapon.cost,
      description: weapon.description,
    }));
  }

  /**
   * 批量序列化 Creature 数组
   */
  static serializeCreatures(creatures: Creature[]): CreatureOptions[] {
    return creatures.map((creature) => this.serializeCreature(creature));
  }

  /**
   * 将序列化后的 POJO 转换为 JSON 字符串
   */
  static toJSON(creature: Creature): string {
    const pojo = this.serializeCreature(creature);
    return JSON.stringify(pojo, null, 2);
  }

  /**
   * 从 JSON 字符串反序列化为 CreatureOptions
   */
  static fromJSON(json: string): CreatureOptions {
    return JSON.parse(json) as CreatureOptions;
  }

  /**
   * 创建简化版本的 POJO（只包含核心属性）
   */
  static serializeCreatureSimple(creature: Creature): Partial<CreatureOptions> {
    return {
      name: creature.name,
      level: creature.level,
      hp: creature.hp,
      maxHp: creature.maxHp,
      ac: creature.ac,
      abilities: {
        STR: { ...creature.abilities.STR },
        DEX: { ...creature.abilities.DEX },
        CON: { ...creature.abilities.CON },
        INT: { ...creature.abilities.INT },
        WIS: { ...creature.abilities.WIS },
        CHA: { ...creature.abilities.CHA },
      },
    };
  }
}
