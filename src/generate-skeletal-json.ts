import { ActorConverter } from './core/converter/ActorConverter';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 创建一个基础的骷髅士兵数据
const skeletalData = {
  name: "骷髅士兵",
  level: 7,
  abilities: {
    str: 18,
    con: 16,
    dex: 19,
    int: 3,
    wis: 14,
    cha: 3
  },
  hp: 1,
  ac: 23,
  fort: 20,
  ref: 20,
  will: 18,
  speed: 5,
  initiative: 9,
  skills: {
    perception: 5
  },
  resistances: {
    necrotic: 10
  },
  immunities: ['disease', 'poison'],
  traits: ['杂兵'],
  equipment: ['鳞甲', '重盾', '长剑', '标枪x3'],
  description: "LV7 杂兵 护卫，具有标记能力的不死生物战士"
};

try {
  // 创建一个基本的Actor数据结构
  const basicActorData = {
    "name": "骷髅士兵",
    "type": "npc", 
    "img": "",
    "system": {
      "details": {
        "level": 7,
        "race": "骷髅",
        "class": "士兵"
      },
      "abilities": {
        "str": { "value": 18, "mod": 7 },
        "con": { "value": 16, "mod": 6 },
        "dex": { "value": 19, "mod": 7 },
        "int": { "value": 3, "mod": -1 },
        "wis": { "value": 14, "mod": 5 },
        "cha": { "value": 3, "mod": -1 }
      },
      "attributes": {
        "hp": { "value": 1, "max": 1 }
      }
    },
    "items": [],
    "effects": []
  };
  
  // 使用ActorConverter创建完整的Actor
  const actor = ActorConverter.fromJSON(basicActorData);
  
  // 导出为JSON
  const jsonData = actor.toJSON();
  
  // 保存到文件
  const filePath = path.join(__dirname, 'assets', 'skeleton', 'Skeletal-Legionary.json');
  fs.writeFileSync(filePath, jsonData, 'utf8');
  
  console.log('✓ 骷髅士兵JSON文件已生成:', filePath);
  console.log('角色名称:', actor.name);
  console.log('等级:', actor.level);
  console.log('当前HP:', actor.currentHP);
  
} catch (error) {
  console.error('❌ 生成失败:', error);
}
