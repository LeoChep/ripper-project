import { Area } from "./Area";
import type { Effect } from "../effect/Effect";

/**
 * Area序列化功能使用示例和测试
 */

// 示例：创建一个Area并添加一些effects
function createSampleArea(): Area {
    const area = new Area();
    
    // 这里可以添加一些示例effects
    // const effect1 = new SomeEffect();
    // const effect2 = new AnotherEffect();
    // area.effects.push(effect1, effect2);
    
    return area;
}

// 示例：序列化Area
function serializeAreaExample() {
    const area = createSampleArea();
    
    // 方法1：序列化为数据对象
    const serializedData = area.serialize();
    console.log('序列化数据:', serializedData);
    
    // 方法2：序列化为JSON字符串
    const jsonString = area.toJsonString();
    console.log('JSON字符串:', jsonString);
    
    return { serializedData, jsonString };
}

// 示例：反序列化Area
function deserializeAreaExample() {
    const { serializedData, jsonString } = serializeAreaExample();
    
    // 创建效果类型映射（实际使用时需要根据项目中的具体Effect子类来配置）
    const effectClassMap = new Map<string, new (...args: any[]) => Effect>();
    // effectClassMap.set('SomeEffectType', SomeEffectClass);
    // effectClassMap.set('AnotherEffectType', AnotherEffectClass);
    
    // 方法1：从数据对象反序列化
    const areaFromData = Area.deserialize(serializedData, effectClassMap);
    console.log('从数据反序列化的Area:', areaFromData);
    
    // 方法2：从JSON字符串反序列化
    const areaFromJson = Area.fromJsonString(jsonString, effectClassMap);
    console.log('从JSON反序列化的Area:', areaFromJson);
    
    // 方法3：克隆Area对象
    const originalArea = createSampleArea();
    const clonedArea = originalArea.clone(effectClassMap);
    console.log('克隆的Area:', clonedArea);
    
    return { areaFromData, areaFromJson, clonedArea };
}

// 示例：验证序列化和反序列化的正确性
function validateSerializationExample() {
    const originalArea = createSampleArea();
    const effectClassMap = new Map<string, new (...args: any[]) => Effect>();
    
    // 序列化然后反序列化
    const serialized = originalArea.serialize();
    const deserialized = Area.deserialize(serialized, effectClassMap);
    
    // 验证关键属性是否一致
    const isValid = originalArea.uid === deserialized.uid && 
                   originalArea.effects.length === deserialized.effects.length;
    
    console.log('序列化验证结果:', isValid);
    console.log('原始Area UID:', originalArea.uid);
    console.log('反序列化Area UID:', deserialized.uid);
    
    return isValid;
}

export {
    createSampleArea,
    serializeAreaExample,
    deserializeAreaExample,
    validateSerializationExample
};
