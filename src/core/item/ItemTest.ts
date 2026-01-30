import { Item } from "./Item";
import { ItemType, ItemRarity } from "./ItemInterface";
import { ItemSerializer } from "./ItemSerializer";

/**
 * 道具系统测试
 */
export function testItemSystem() {
  console.log("=== 开始测试道具系统 ===\n");

  // 测试1: 创建道具
  console.log("测试1: 创建道具");
  const sword = new Item({
    name: "铁剑",
    description: "一把普通的铁制长剑",
    type: ItemType.WEAPON,
    rarity: ItemRarity.COMMON,
    maxStack: 1,
    weight: 3.5,
    value: 50,
    canEquip: true,
    properties: {
      damage: "1d8",
      attackBonus: 1
    }
  });
  console.log("创建武器:", sword.name, sword.uid);
  console.assert(sword.name === "铁剑", "武器名称不正确");
  console.assert(sword.type === ItemType.WEAPON, "武器类型不正确");
  console.log("✓ 创建道具测试通过\n");

  // 测试2: 堆叠系统
  console.log("测试2: 道具堆叠");
  const potion1 = new Item({
    name: "生命药水",
    description: "恢复50点生命值",
    type: ItemType.CONSUMABLE,
    maxStack: 99,
    stackCount: 30,
    weight: 0.5,
    value: 25,
    canUse: true,
  });

  const potion2 = new Item({
    name: "生命药水",
    description: "恢复50点生命值",
    type: ItemType.CONSUMABLE,
    maxStack: 99,
    stackCount: 40,
    weight: 0.5,
    value: 25,
    canUse: true,
  });

  console.log("药水1堆叠:", potion1.stackCount);
  console.log("药水2堆叠:", potion2.stackCount);
  
  const canStack = potion1.canStackWith(potion2);
  console.log("是否可堆叠:", canStack);
  console.assert(canStack === true, "相同道具应该可以堆叠");

  // 添加堆叠
  const addSuccess = potion1.addStack(10);
  console.log("添加10个堆叠后:", potion1.stackCount);
  console.assert(potion1.stackCount === 40, "堆叠数量不正确");
  console.assert(addSuccess === true, "应该成功添加堆叠");
  console.log("✓ 堆叠系统测试通过\n");

  // 测试3: 道具克隆
  console.log("测试3: 道具克隆");
  const clonedSword = sword.clone();
  console.log("原始剑UID:", sword.uid);
  console.log("克隆剑UID:", clonedSword.uid);
  console.assert(sword.uid !== clonedSword.uid, "克隆道具应该有不同的UID");
  console.assert(sword.name === clonedSword.name, "克隆道具应该有相同的名称");
  console.log("✓ 道具克隆测试通过\n");

  // 测试4: 序列化和反序列化
  console.log("测试4: 序列化和反序列化");
  const serializer = ItemSerializer.serialize(sword);
  console.log("序列化器UID:", serializer.uid);
  console.log("序列化器名称:", serializer.name);
  
  const jsonString = serializer.toJSONString();
  console.log("JSON字符串长度:", jsonString.length);
  
  const deserializedSerializer = ItemSerializer.fromJSONString(jsonString);
  const deserializedSword = deserializedSerializer.deserialize();
  console.log("反序列化剑名称:", deserializedSword.name);
  console.assert(deserializedSword.name === sword.name, "反序列化后名称应该相同");
  console.assert(deserializedSword.uid === sword.uid, "反序列化后UID应该相同");
  console.log("✓ 序列化测试通过\n");

  // 测试5: 批量序列化
  console.log("测试5: 批量序列化");
  const items = [sword, potion1, clonedSword];
  const serializers = ItemSerializer.serializeArray(items);
  console.log("序列化道具数量:", serializers.length);
  console.assert(serializers.length === 3, "序列化数量应该是3");
  
  const deserializedItems = ItemSerializer.deserializeArray(serializers);
  console.log("反序列化道具数量:", deserializedItems.length);
  console.assert(deserializedItems.length === 3, "反序列化数量应该是3");
  console.assert(deserializedItems[0].name === sword.name, "第一个道具名称应该匹配");
  console.log("✓ 批量序列化测试通过\n");

  // 测试6: 道具重量和价值
  console.log("测试6: 道具重量和价值");
  const totalWeight = sword.getTotalWeight();
  const totalValue = sword.getTotalValue();
  console.log("剑总重量:", totalWeight);
  console.log("剑总价值:", totalValue);
  console.assert(totalWeight === sword.weight * sword.stackCount, "总重量计算不正确");
  console.assert(totalValue === sword.value * sword.stackCount, "总价值计算不正确");
  
  const potionTotalWeight = potion1.getTotalWeight();
  const potionTotalValue = potion1.getTotalValue();
  console.log("药水总重量:", potionTotalWeight);
  console.log("药水总价值:", potionTotalValue);
  console.assert(potionTotalWeight === potion1.weight * potion1.stackCount, "药水总重量计算不正确");
  console.log("✓ 重量和价值测试通过\n");

  // 测试7: 验证功能
  console.log("测试7: 验证功能");
  const validSerializer = ItemSerializer.serialize(sword);
  const isValid = validSerializer.validate();
  console.log("序列化器有效性:", isValid);
  console.assert(isValid === true, "有效的序列化器应该通过验证");
  
  // 创建无效的序列化器
  const invalidSerializer = new ItemSerializer({
    uid: "",
    name: "",
    description: "",
    type: ItemType.MISC,
    stackCount: 0,
  });
  const isInvalid = invalidSerializer.validate();
  console.log("无效序列化器验证:", isInvalid);
  console.assert(isInvalid === false, "无效的序列化器应该失败验证");
  console.log("✓ 验证功能测试通过\n");

  // 测试8: 移除堆叠
  console.log("测试8: 移除堆叠");
  const initialCount = potion1.stackCount;
  const removeSuccess = potion1.removeStack(5);
  console.log("移除前数量:", initialCount);
  console.log("移除5个后数量:", potion1.stackCount);
  console.assert(removeSuccess === true, "应该成功移除堆叠");
  console.assert(potion1.stackCount === initialCount - 5, "移除后数量不正确");
  
  // 尝试移除过多
  const removeTooMany = potion1.removeStack(1000);
  console.log("尝试移除过多:", removeTooMany);
  console.assert(removeTooMany === false, "移除过多应该失败");
  console.log("✓ 移除堆叠测试通过\n");

  console.log("=== 道具系统所有测试通过！ ===");
}

// 运行测试（仅在开发环境）
if (import.meta.env.DEV) {
  // testItemSystem();
}
