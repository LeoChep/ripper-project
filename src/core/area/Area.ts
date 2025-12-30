import type { Effect } from "../effect/Effect";
import { UuidUtil } from "../utils/UuidUtil";
import { AreaSerializer } from "./AreaSerializer";
import type { AreaSerializeData } from "./AreaSerializeData";

export class Area{
    uid:string
    effects:Effect[]
    name:string=""
    des:string=""
    constructor(uid?:string) {

        this.uid=uid?uid:UuidUtil.generate();
        this.effects=[];
    }

    buildEffect(){
        for (const effect of this.effects) {
            effect.build();
        }
    }

    /**
     * 获取Area序列化器实例
     * @returns AreaSerializer实例
     */
    static getSerializer(): AreaSerializer {
        return AreaSerializer.getInstance();
    }

    /**
     * 序列化当前Area对象到JSON数据
     * @returns 序列化后的数据
     */
    serialize(): AreaSerializeData {
        return Area.getSerializer().serialize(this);
    }

    /**
     * 将当前Area对象序列化为JSON字符串
     * @returns JSON字符串
     */
    toJsonString(): string {
        return Area.getSerializer().toJsonString(this);
    }

    /**
     * 从序列化数据创建Area对象（静态方法）
     * @param data 序列化的数据
     * @param effectClassMap 效果类型到类构造函数的映射
     * @returns 反序列化后的Area对象
     */
    static deserialize(data: AreaSerializeData, effectClassMap?: Map<string, new (...args: any[]) => Effect>): Area {
        return Area.getSerializer().deserialize(data);
    }

    /**
     * 从JSON字符串创建Area对象（静态方法）
     * @param jsonString JSON字符串
     * @param effectClassMap 效果类型到类构造函数的映射
     * @returns 反序列化后的Area对象
     */
    static fromJsonString(jsonString: string, effectClassMap?: Map<string, new (...args: any[]) => Effect>): Area {
        return Area.getSerializer().fromJsonString(jsonString, effectClassMap);
    }

    /**
     * 克隆当前Area对象
     * @param effectClassMap 效果类型到类构造函数的映射
     * @returns 克隆后的Area对象
     */
    clone(effectClassMap?: Map<string, new (...args: any[]) => Effect>): Area {
        const serialized = this.serialize();
        return Area.deserialize(serialized, effectClassMap);
    }
   
    
}