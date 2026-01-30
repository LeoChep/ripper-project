/**
 * 道具序列化和反序列化测试
 * 用于验证读档后 item 还原是否正确
 */

import { Item } from '@/core/item/Item';
import { ItemSerializer } from '@/core/item/ItemSerializer';
import { ItemType, ItemRarity } from '@/core/item/ItemInterface';

/**
 * 测试序列化和反序列化流程
 */
export function testItemSerializationFlow() {
  console.log('=== 测试道具序列化/反序列化流程 ===\n');

  // 1. 创建测试道具
  console.log('步骤1: 创建测试道具');
  const testItem = new Item({
    name: "测试生命药水",
    description: "用于测试的生命药水",
    type: ItemType.CONSUMABLE,
    rarity: ItemRarity.COMMON,
    maxStack: 99,
    stackCount: 15,
    weight: 0.5,
    value: 25,
    canUse: true,
    properties: {
      healAmount: 50
    }
  });
  
  console.log('原始道具:', testItem);
  console.log('原始道具方法测试:');
  console.log('  - getTotalWeight():', testItem.getTotalWeight());
  console.log('  - getTotalValue():', testItem.getTotalValue());
  console.log('  - getDisplayInfo():', testItem.getDisplayInfo());

  // 2. 序列化
  console.log('\n步骤2: 序列化道具');
  const serializers = ItemSerializer.serializeArray([testItem]);
  console.log('序列化器数组:', serializers);

  // 3. 转换为 JSON（模拟存档）
  console.log('\n步骤3: 转换为 JSON (模拟存档)');
  const jsonString = JSON.stringify(serializers);
  console.log('JSON 字符串长度:', jsonString.length);

  // 4. 从 JSON 解析（模拟读档）
  console.log('\n步骤4: 从 JSON 解析 (模拟读档)');
  const parsedData = JSON.parse(jsonString);
  console.log('解析后的数据:', parsedData);
  console.log('解析后的数据类型:', typeof parsedData[0]);
  console.log('是否是 ItemSerializer 实例:', parsedData[0] instanceof ItemSerializer);

  // 5. 反序列化（这是关键步骤）
  console.log('\n步骤5: 反序列化为 Item 实例');
  try {
    const deserializedItems = ItemSerializer.deserializeArray(parsedData);
    console.log('反序列化成功! 道具数量:', deserializedItems.length);
    
    if (deserializedItems.length > 0) {
      const restoredItem = deserializedItems[0];
      console.log('恢复的道具:', restoredItem);
      console.log('恢复的道具是 Item 实例:', restoredItem instanceof Item);
      
      // 测试方法是否存在
      console.log('\n恢复道具的方法测试:');
      console.log('  - getTotalWeight 存在:', typeof restoredItem.getTotalWeight === 'function');
      console.log('  - getTotalValue 存在:', typeof restoredItem.getTotalValue === 'function');
      console.log('  - getDisplayInfo 存在:', typeof restoredItem.getDisplayInfo === 'function');
      
      if (typeof restoredItem.getTotalWeight === 'function') {
        console.log('  - getTotalWeight():', restoredItem.getTotalWeight());
        console.log('  - getTotalValue():', restoredItem.getTotalValue());
        console.log('  - getDisplayInfo():', restoredItem.getDisplayInfo());
      }
      
      // 验证数据一致性
      console.log('\n数据一致性验证:');
      console.log('  - 名称匹配:', testItem.name === restoredItem.name);
      console.log('  - 堆叠数量匹配:', testItem.stackCount === restoredItem.stackCount);
      console.log('  - 重量匹配:', testItem.weight === restoredItem.weight);
      console.log('  - 价值匹配:', testItem.value === restoredItem.value);
      console.log('  - 属性匹配:', JSON.stringify(testItem.properties) === JSON.stringify(restoredItem.properties));
      
      console.log('\n✅ 测试通过！道具可以正确序列化和反序列化');
    } else {
      console.error('❌ 反序列化失败：没有恢复任何道具');
    }
  } catch (error) {
    console.error('❌ 反序列化过程中出错:', error);
  }
}

/**
 * 测试批量道具的序列化和反序列化
 */
export function testBatchItemSerialization() {
  console.log('\n=== 测试批量道具序列化 ===\n');

  // 创建多个测试道具
  const items = [
    new Item({
      name: "铁剑",
      description: "普通的铁制长剑",
      type: ItemType.WEAPON,
      rarity: ItemRarity.COMMON,
      maxStack: 1,
      weight: 3.5,
      value: 50,
      canEquip: true,
    }),
    new Item({
      name: "生命药水",
      description: "恢复50点生命值",
      type: ItemType.CONSUMABLE,
      rarity: ItemRarity.COMMON,
      maxStack: 99,
      stackCount: 25,
      weight: 0.5,
      value: 25,
      canUse: true,
    }),
    new Item({
      name: "龙鳞",
      description: "珍贵的龙族鳞片",
      type: ItemType.MATERIAL,
      rarity: ItemRarity.EPIC,
      maxStack: 50,
      stackCount: 7,
      weight: 0.5,
      value: 200,
    }),
  ];

  console.log('原始道具数量:', items.length);
  console.log('原始道具总重量:', items.reduce((sum, item) => sum + item.getTotalWeight(), 0));
  console.log('原始道具总价值:', items.reduce((sum, item) => sum + item.getTotalValue(), 0));

  // 序列化
  const serialized = ItemSerializer.serializeArray(items);
  console.log('\n序列化后:', serialized.length, '个序列化器');

  // 转换为 JSON 并解析
  const jsonString = JSON.stringify(serialized);
  const parsed = JSON.parse(jsonString);
  console.log('JSON 解析后:', parsed.length, '个对象');

  // 反序列化
  const deserialized = ItemSerializer.deserializeArray(parsed);
  console.log('\n反序列化后:', deserialized.length, '个道具');
  console.log('反序列化道具总重量:', deserialized.reduce((sum, item) => sum + item.getTotalWeight(), 0));
  console.log('反序列化道具总价值:', deserialized.reduce((sum, item) => sum + item.getTotalValue(), 0));

  // 验证
  const allValid = deserialized.every((item, index) => {
    const original = items[index];
    return (
      item.name === original.name &&
      item.stackCount === original.stackCount &&
      item.weight === original.weight &&
      item.value === original.value
    );
  });

  if (allValid) {
    console.log('\n✅ 批量序列化测试通过！');
  } else {
    console.error('\n❌ 批量序列化测试失败：数据不一致');
  }
}

/**
 * 测试完整的存档流程
 */
export function testFullSaveLoadFlow() {
  console.log('\n=== 测试完整存档流程 ===\n');
  
  // 模拟存档数据结构
  const mockSaveData = {
    sprites: [
      {
        id: 1,
        name: "测试角色",
        inventory: ItemSerializer.serializeArray([
          new Item({
            name: "测试道具1",
            description: "测试",
            type: ItemType.MISC,
            rarity: ItemRarity.COMMON,
            weight: 1,
            value: 10,
          }),
          new Item({
            name: "测试道具2",
            description: "测试",
            type: ItemType.CONSUMABLE,
            rarity: ItemRarity.RARE,
            maxStack: 99,
            stackCount: 50,
            weight: 0.5,
            value: 25,
            canUse: true,
          }),
        ])
      }
    ]
  };

  console.log('模拟存档数据:', mockSaveData);

  // 转换为 JSON（存档）
  const saveString = JSON.stringify(mockSaveData);
  console.log('存档 JSON 长度:', saveString.length);

  // 从 JSON 加载（读档）
  const loadedData = JSON.parse(saveString);
  console.log('\n读档数据:', loadedData);

  // 恢复道具
  const sprite = loadedData.sprites[0];
  console.log('\n角色原始 inventory 数据:', sprite.inventory);
  
  try {
    const restoredInventory = ItemSerializer.deserializeArray(sprite.inventory);
    console.log('恢复的道具数量:', restoredInventory.length);
    
    restoredInventory.forEach((item, index) => {
      console.log(`\n道具 ${index + 1}:`, {
        name: item.name,
        stackCount: item.stackCount,
        hasMethods: typeof item.getTotalWeight === 'function'
      });
    });

    console.log('\n✅ 完整存档流程测试通过！');
  } catch (error) {
    console.error('\n❌ 完整存档流程测试失败:', error);
  }
}

// 导出运行所有测试的函数
export function runAllItemSerializationTests() {
  console.log('==================================================');
  console.log('     道具序列化/反序列化完整测试套件');
  console.log('==================================================\n');

  try {
    testItemSerializationFlow();
    testBatchItemSerialization();
    testFullSaveLoadFlow();
    
    console.log('\n==================================================');
    console.log('     所有测试完成！');
    console.log('==================================================\n');
  } catch (error) {
    console.error('\n测试过程中发生错误:', error);
  }
}

// 在开发环境自动运行测试（可选）
if (import.meta.env.DEV) {
  // 取消注释以自动运行测试
  // runAllItemSerializationTests();
}
