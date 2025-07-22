import { PowerFactory, PowerManager, AttackPower } from './index';
import type { PowerData } from './PowerInterface';
import type { Unit } from '../units/Unit';

/**
 * 示例：如何使用Power系统
 */

// 从JSON文件创建Vicious Offensive技能
export async function createViciousOffensivePower(): Promise<AttackPower> {
  // 这里可以直接使用JSON数据，或者从文件加载
  const viciousOffensiveData: PowerData = {
    "name": "恶毒攻击 Vicious Offensive DSCS",
    "type": "power",
    "system": {
      "description": {
        "value": "<p>恶毒攻击 Vicious Offensive DSCS</p><p>战士攻击 1</p><p>你以如此大的力量猛击你的对手，以至于附近的敌人不得不注意到你。</p><p>随意✦武术，武器</p><p>标准动作✦近战武器</p><p>目标：\t一个生物</p><p>攻击：\t力量 vs. AC</p><p>命中：\t1[W] + 力量调整值的伤害，并且你标记一个邻近你的敌人直到你下一回合结束。</p><p>21级：2[W] + 力量调整值的伤害</p>",
        "chat": "",
        "unidentified": ""
      },
      "descriptionGM": {
        "value": "",
        "chat": "",
        "unidentified": ""
      },
      "source": "",
      "activation": {
        "type": "",
        "cost": 0,
        "condition": ""
      },
      "duration": {
        "value": null,
        "units": ""
      },
      "target": "One Creature",
      "range": {
        "value": 1,
        "long": null,
        "units": ""
      },
      "uses": {
        "value": 0,
        "max": "0",
        "per": ""
      },
      "consume": {
        "type": "",
        "target": "",
        "amount": null
      },
      "macro": {
        "type": "script",
        "scope": "global",
        "launchOrder": "off",
        "command": "",
        "author": "",
        "autoanimationHook": ""
      },
      "attack": {
        "shareAttackRoll": false,
        "isAttack": true,
        "isBasic": true,
        "isCharge": false,
        "isOpp": false,
        "canCharge": false,
        "canOpp": false,
        "ability": "str",
        "abilityBonus": 0,
        "def": "ac",
        "defBonus": 0,
        "formula": "@wepAttack + @powerMod + @lvhalf"
      },
      "hit": {
        "shareDamageRoll": false,
        "isDamage": true,
        "isHealing": false,
        "healSurge": "",
        "baseQuantity": "1",
        "baseDiceType": "weapon",
        "detail": "1[W] + Strength modifier damage.",
        "formula": "@powBase + @powerMod + @wepDamage",
        "critFormula": "@powMax + @powerMod + @wepDamage + @wepCritBonus",
        "healFormula": ""
      },
      "miss": {
        "detail": "",
        "formula": ""
      },
      "effect": {
        "detail": ""
      },
      "damage": {
        "parts": []
      },
      "damageCrit": {
        "parts": []
      },
      "damageImp": {
        "parts": []
      },
      "damageCritImp": {
        "parts": []
      },
      "damageType": {
        "damage": false,
        "acid": false,
        "cold": false,
        "fire": false,
        "force": false,
        "lightning": false,
        "necrotic": false,
        "physical": true,
        "poison": false,
        "psychic": false,
        "radiant": false,
        "thunder": false
      },
      "keyWords": [
        "武术",
        "武器"
      ],
      "level": "1",
      "powersource": "martial",
      "secondPowersource": "martial",
      "powersourceName": "",
      "subName": "战士攻击 1",
      "prepared": true,
      "powerType": "class",
      "powerSubtype": "attack",
      "useType": "atwill",
      "actionType": "standard",
      "requirements": "",
      "weaponType": "melee",
      "weaponUse": "default",
      "rangeType": "weapon",
      "rangeTextShort": "",
      "rangeText": "",
      "rangePower": "",
      "area": 0,
      "rechargeRoll": "",
      "rechargeCondition": "",
      "damageShare": false,
      "postEffect": true,
      "postSpecial": true,
      "autoGenChatPowerCard": true,
      "sustain": {
        "actionType": "",
        "detail": ""
      },
      "trigger": "",
      "requirement": "",
      "special": "",
      "specialAdd": {
        "parts": []
      },
      "effectType": {
        "transmutation": false,
        "polymorph": false,
        "teleportation": false,
        "poison": false,
        "runic": false,
        "enchantment": false,
        "invigorating": false,
        "gaze": false,
        "illusion": false,
        "disease": false,
        "stance": false,
        "spirit": false,
        "reliable": false,
        "augmentable": false,
        "fear": false,
        "rage": false,
        "rattling": false,
        "aura": false,
        "charm": false,
        "mount": false,
        "zone": false,
        "fullDis": false,
        "sleep": false,
        "necro": false,
        "nether": false,
        "evocation": false,
        "beast": false,
        "beastForm": false,
        "healing": false,
        "channelDiv": false,
        "shadow": false,
        "elemental": false,
        "summoning": false,
        "conjuration": false
      },
      "keywordsCustom": "",
      "tooltip": "新建项目",
      "type": "atwill",
      "effectHTML": false,
      "chatFlavor": ""
    },
    "_id": "Pn4RTpYMLpYtJaY3",
    "img": "icons/svg/combat.svg",
    "effects": [],
    "folder": null,
    "sort": 0,
    "ownership": {
      "default": 0,
      "louvTvO122tfQ4Uo": 3
    },
    "flags": {},
    "_stats": {
      "compendiumSource": null,
      "duplicateSource": null,
      "coreVersion": "12.331",
      "systemId": "dnd4e",
      "systemVersion": "0.6.9",
      "createdTime": 1753110454983,
      "modifiedTime": 1753110551684,
      "lastModifiedBy": "louvTvO122tfQ4Uo"
    }
  };

  const power = PowerFactory.createPower(viciousOffensiveData);
  return power as AttackPower;
}

/**
 * 示例：为单位添加技能管理器
 */
export function setupUnitPowers(unit: Unit): PowerManager {
  const powerManager = new PowerManager(unit);
  
  // 可以在这里添加单位的默认技能
  // powerManager.addPower(viciousOffensive);
  
  return powerManager;
}

/**
 * 示例：使用技能进行攻击
 */
export async function usePowerToAttack(
  power: AttackPower, 
  caster: Unit, 
  targetX: number, 
  targetY: number, 
  map: import('../MapClass').TiledMap
): Promise<boolean> {
  // 检查是否可以使用技能
  if (!power.canUse(caster)) {
    console.warn(`${caster.name} 无法使用技能 ${power.name}`);
    return false;
  }

  // 检查是否可以攻击目标位置
  const positions = power.getAttackablePositions(caster, map);
  const canAttack = positions.some(pos => pos.x === targetX && pos.y === targetY);
  
  if (!canAttack) {
    console.warn(`目标位置 (${targetX}, ${targetY}) 超出了技能 ${power.name} 的攻击范围`);
    return false;
  }

  try {
    // 执行攻击
    await power.executeAttack(caster, targetX, targetY, map);
    console.log(`${caster.name} 使用 ${power.name} 攻击了 (${targetX}, ${targetY})`);
    return true;
  } catch (error) {
    console.error(`技能 ${power.name} 执行失败:`, error);
    return false;
  }
}

/**
 * 从原有的JSON文件加载Power
 */
export async function loadViciousOffensiveFromFile(): Promise<AttackPower> {
  try {
    // 注意：在实际使用中，需要确保文件路径正确
    const response = await fetch('/src/assets/powers/Vicious Offensive.json');
    const data: PowerData = await response.json();
    const power = PowerFactory.createPower(data);
    return power as AttackPower;
  } catch (error) {
    console.error('加载Vicious Offensive技能失败:', error);
    throw error;
  }
}
