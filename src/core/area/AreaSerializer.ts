import { Area } from "./Area";
import type { AreaSerializeData } from "./AreaSerializeData";
import { EffectSerializer } from "../effect/EffectSerializer";
import type { Effect } from "../effect/Effect";
import { EffectSerializerSheet } from "../effect/EffectSerializerSheet";

export class AreaSerializer {
  private static instance: AreaSerializer;
  private effectSerializer: EffectSerializer;

  private constructor() {
    this.effectSerializer = EffectSerializer.getInstance();
  }

  static getInstance(): AreaSerializer {
    if (!this.instance) {
      this.instance = new AreaSerializer();
    }
    return this.instance;
  }

  /**
   * 序列化Area对象到JSON数据
   * @param area 要序列化的Area对象
   * @returns 序列化后的数据
   */
  serialize(area: Area): AreaSerializeData {
    return {
      uid: area.uid,
      effects: area.effects.map(effect => effect.getSerializer().serialize(effect))
    };
  }

  /**
   * 从JSON数据反序列化Area对象
   * @param data 序列化的数据
   * @param effectClassMap 效果类型到类构造函数的映射，用于正确反序列化Effect对象
   * @returns 反序列化后的Area对象
   */
  deserialize(data: AreaSerializeData): Area {
    const area = new Area(data.uid);
    
    // 反序列化effects数组
    const effectSheet = EffectSerializerSheet.getInstance();
    if (data.effects && data.effects.length > 0) {
      for (const effectData of data.effects) {
        console.log('反序列化效果数据:', effectData,effectData.effectName,effectSheet)
        const serializer = effectSheet.getSerializer(effectData.effectName);
        console.log('找到的序列化器:', serializer)
        const effect = serializer?.deserialize(effectData);
        if (effect) {
          area.effects.push(effect);
        }
      }
    }

    return area;
  }

  /**
   * 将Area对象序列化为JSON字符串
   * @param area 要序列化的Area对象
   * @returns JSON字符串
   */
  toJsonString(area: Area): string {
    const data = this.serialize(area);
    return JSON.stringify(data, null, 2);
  }

  /**
   * 从JSON字符串反序列化Area对象
   * @param jsonString JSON字符串
   * @param effectClassMap 效果类型到类构造函数的映射
   * @returns 反序列化后的Area对象
   */
  fromJsonString(jsonString: string, effectClassMap?: Map<string, new (...args: any[]) => Effect>): Area {
    const data = JSON.parse(jsonString) as AreaSerializeData;
    return this.deserialize(data);
  }
}
