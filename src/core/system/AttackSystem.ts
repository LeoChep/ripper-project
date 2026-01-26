import { Weapon } from "./../units/Weapon";
import type { Creature, CreatureAttack } from "@/core/units/Creature";
import { segmentsIntersect } from "../utils/MathUtil";
import type { TiledMap } from "../MapClass";
import type { RLayers } from "../type/RLayersInterface";
import type { Unit } from "../units/Unit";
import * as PIXI from "pixi.js";
import { playerSelectAttackMovement } from "../action/UnitAttack";
import { generateWays } from "../utils/PathfinderUtil";
import { diceRoll } from "../DiceTryer";
import { tileSize } from "../envSetting";
import { golbalSetting } from "../golbalSetting";
import { AbilityValueSystem } from "./AbilitiyValueSystem";
import { evaluate } from "maths.ts";
import { ModifierSystem } from "./ModifierSystem";
import { BattleEvenetSystem } from "./BattleEventSystem";

// 创建攻击的参数接口
export interface CreateAttackParams {
  attackFormula: string;
  damageFormula: string;
  keyWords: string[];
  unit: Unit;
  weapon?: Weapon;
  implement?: any; // 添加法器支持
}
export const checkPassiable = (unit: Unit, x: number, y: number) => {
  const size = unit?.creature ? unit.creature.size : "middle";
  const unitx = Math.floor(unit.x / tileSize);
  const unity = Math.floor(unit.y / tileSize);
  return checkPassiableBySize(size, unitx, unity, x, y);
};

export async function checkHit(
  unit: Unit,
  target: any,
  attack: CreatureAttack,
  against: string = "AC"
) {
  // 检查攻击是否命中
  await BattleEvenetSystem.getInstance().handleEvent(
    "attackEvent",
    unit,
    target,
    attack
  );
  let attackBonus = attack.attackBonus || 0; // 攻击加值
  const targetAC = target.creature?.ac || 10; // 目标护甲等级，默认10
  const modifierBonus = ModifierSystem.getInstance().getValueStack(unit, "attack-bonus").finalValue;
  attackBonus += modifierBonus;
  let targetDef = 0;
  if (against === "AC") {
    targetDef = targetAC;
  } else if (against === "Ref") {
    targetDef = target.creature?.reflex || 10; // 默认10
  } else if (against === "Fort") {
    targetDef = target.creature?.fortitude || 10; // 默认10
  } else if (against === "Will") {
    targetDef = target.creature?.will || 10; // 默认10
  } else {
    console.warn(`未知防御类型: ${against}`);
  }

  let rollFormula = "1d20";
  if (attackBonus > 0) rollFormula = `1d20+${attackBonus}`;
  else if (attackBonus < 0) rollFormula = `1d20${attackBonus}`;
  const roll = parseInt(await diceRoll(rollFormula));
  console.log(`攻击掷骰: ${roll} vs  ${against} ${targetDef}`);
  const result = {
    attackValue: roll,
    targetDef: targetDef,
    against: against,
    targetAC: targetAC,
    hit: roll >= targetDef,
  };
  return result;
}

export async function getDamage(
  unit: Unit,
  target: any,
  attack: CreatureAttack
) {
  // 检查攻击是否命中
  BattleEvenetSystem.getInstance().handleEvent(
    "damageBeforeRollEvent",
    unit,
    target,
    attack
  );
  const roll = parseInt(await diceRoll(attack.damage));
  return roll;
}

export const checkPassiableBySize = (
  size: string,
  unitx: number,
  unity: number,
  x: number,
  y: number
) => {
  let passiable = true;
  // console.log('checkPassiableBySize')
  const mapPassiable = golbalSetting.map;
  if (mapPassiable) {
    const edges = mapPassiable.edges;
    const rangeArrA: { x: number; y: number }[] = [];
    let range = 1; // 默认范围为0，可根据需要调整
    if (size === "big") {
      range = 2;
    }

    for (let dx = 0; dx < range; dx++) {
      for (let dy = 0; dy < range; dy++) {
        rangeArrA.push({
          x: unitx * tileSize + dx * tileSize + 32,
          y: unity * tileSize + dy * tileSize + 32,
        });
      }
    }
    // console.log("rangeArrA", rangeArrA.length);
    // 检查是否穿过边
    if (edges) {
      // console.log(edges)
      // 检查是否有对象在指定位置
      // 遍历对象组中的所有对象
      edges.forEach((edge) => {
        if (edge.useable === false) {
          return; // 如果边不可用，则跳过
        }
       

        // 构建范围数组

        const pointsB = [{ x: x * tileSize + 32, y: y * tileSize + 32 }];
        // 检查所有中点的连线
        let intersectCount = 0;
        for (let i = 0; i < rangeArrA.length; i++) {
          if (
            segmentsIntersect(
              rangeArrA[i].x,
              rangeArrA[i].y,
              pointsB[0].x,
              pointsB[0].y,
              edge.x1,
              edge.y1,
              edge.x2,
              edge.y2
            )
          ) {
            intersectCount++;
          }
        }

        if (intersectCount >= rangeArrA.length) {
          passiable = false;
          return;
        }
      });
    }
  }

  return passiable;
};

export const createAttack = (params: CreateAttackParams) => {
  const { attackFormula, damageFormula, keyWords, unit, weapon, implement } =
    params;

  // 解析攻击公式
  const abValue = getAttackBonus(
    attackFormula,
    keyWords,
    unit,
    weapon,
    implement
  );
  const damageText = getDamageFormula(
    damageFormula,
    keyWords,
    unit,
    weapon,
    implement
  );
  const attack = {} as CreatureAttack;

  // 设置攻击属性，优先使用武器，其次使用法器
  if (weapon) {
    attack.range = weapon.range;
    attack.name = weapon.name;
    attack.type = weapon.type;
  } else if (implement) {
    attack.range = 0; // 法器通常没有射程，或根据法术设定
    attack.name = implement.name;
    attack.type = implement.type;
  } else {
    attack.range = 0;
    attack.name = "未知攻击";
    attack.type = "未知";
  }

  attack.attackBonus = abValue;
  attack.damage = damageText;
  return attack;
};
const getDamageFormula = (
  damageFormula: string,
  keyWords: string[],
  unit: Unit,
  weapon: Weapon | undefined,
  implement: any
) => {
  // 解析伤害公式
  if (weapon) {
    damageFormula = damageFormula.replace(
      new RegExp(`\\[W\\]`, "g"),
      weapon.damage
    );
    if (weapon.bonus) {
      damageFormula += "+" + weapon.bonus;
    }
    const weaponDamageBonus = ModifierSystem.getInstance().getValueStack(
      unit,
      "weaponDamageBonus"
    ).finalValue;
    if (weaponDamageBonus) {
      damageFormula += "+" + weaponDamageBonus;
    }
  }

  const attributes = getAttributes(damageFormula);
  //提取出公式中的属性，通过AbilityValueSystem等系统获取属性值
  attributes.forEach((key) => {
    const attributeModifer =
      AbilityValueSystem.getInstance().getAbilityModifier(unit, key);
    //将原公式内所有对应属性值替换
    damageFormula = damageFormula.replace(
      new RegExp(`\\[${key}\\]`, "g"),
      attributeModifer.toString()
    );
  });

  return damageFormula;
};
const getAttackBonus = (
  attackFormula: string,
  keyWords: string[],
  unit: Unit,
  weapon?: Weapon,
  implement?: any
) => {
  const attackAttributes = getAttributes(attackFormula);
  //提取出公式中的属性，通过AbilityValueSystem等系统获取属性值
  attackAttributes.forEach((key) => {
    const attributeModifer =
      AbilityValueSystem.getInstance().getAbilityModifier(unit, key);
    //将原公式内所有对应属性值替换
    attackFormula = attackFormula.replace(
      new RegExp(`\\[${key}\\]`, "g"),
      attributeModifer.toString()
    );
  });
  const levelModifier = AbilityValueSystem.getInstance().getLevelModifier(unit);
  attackFormula += "+" + levelModifier;
  if (weapon) {
    if (weapon.bonus) {
      attackFormula += "+" + weapon.bonus;
    }
    if (weapon.proficiency) {
      attackFormula += "+" + weapon.proficiency;
    }

    const weaponAttackBonus = ModifierSystem.getInstance().getValueStack(
      unit,
      "weaponAttackBonus"
    ).finalValue;
    if (weaponAttackBonus) {
      attackFormula += "+" + weaponAttackBonus;
    }
  }

  const value = evaluate(attackFormula);
  return value.numberValue;
};

//编写一个解析器，提取公式中[INT]等属性
const getAttributes = (formula: string) => {
  const regex = /\[(\w+)\]/g;
  const attributes: string[] = [];
  let match;
  while ((match = regex.exec(formula)) !== null) {
    attributes.push(match[1]);
  }
  return attributes;
};
