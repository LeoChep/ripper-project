import type { Modifier } from "../modifier/Modifier";
import { BuffSystem } from "../system/BuffSystem";
import type { Unit } from "../units/Unit";
import { Buff } from "./Buff";
import { BuffInterface } from "./BuffInterface";

/**
 * Buff 序列化数据接口
 */
export interface SerializedBuffData {
  uid: string;
  name: string;
  description: string;
  icon: string;
  iconType: string;
  type: string;
  duration: number;
  isPositive: boolean;
  ownerUid?: string; // 只存储 Unit 的 uid，避免循环引用
  giverUid?: string; // 只存储 Unit 的 uid，避免循环引用
  source: string;
  modifiers: any[]; // 根据 Modifier 的结构调整
}

/**
 * Buff 序列化器类 - 专门用于存档系统
 */
export class BuffSerializer {
  private _data: SerializedBuffData;

  constructor(data?: Partial<SerializedBuffData>) {
    this._data = {
      uid: data?.uid ?? "",
      name: data?.name ?? "",
      description: data?.description ?? "",
      icon: data?.icon ?? "",
      iconType: data?.iconType ?? "svg",
      type: data?.type ?? "",
      duration: data?.duration ?? 0,
      isPositive: data?.isPositive ?? false,
      ownerUid: data?.ownerUid,
      giverUid: data?.giverUid,
      source: data?.source ?? "",
      modifiers: data?.modifiers ?? [],
    };
  }
  get iconType(): string {
    return this._data.iconType;
  }
  set iconType(value: string) {
    this._data.iconType = value;
  }
  // Getters
  get uid(): string {
    return this._data.uid;
  }
  get name(): string {
    return this._data.name;
  }
  get description(): string {
    return this._data.description;
  }
  get icon(): string {
    return this._data.icon;
  }
  get type(): string {
    return this._data.type;
  }
  get duration(): number {
    return this._data.duration;
  }
  get isPositive(): boolean {
    return this._data.isPositive;
  }
  get ownerUid(): string | undefined {
    return this._data.ownerUid;
  }
  get giverUid(): string | undefined {
    return this._data.giverUid;
  }
  get source(): string {
    return this._data.source;
  }
  get modifiers(): any[] {
    return this._data.modifiers;
  }

  // Setters
  set uid(value: string) {
    this._data.uid = value;
  }
  set name(value: string) {
    this._data.name = value;
  }
  set description(value: string) {
    this._data.description = value;
  }
  set icon(value: string) {
    this._data.icon = value;
  }
  set type(value: string) {
    this._data.type = value;
  }
  set duration(value: number) {
    this._data.duration = value;
  }
  set isPositive(value: boolean) {
    this._data.isPositive = value;
  }
  set ownerUid(value: string | undefined) {
    this._data.ownerUid = value;
  }
  set giverUid(value: string | undefined) {
    this._data.giverUid = value;
  }
  set source(value: string) {
    this._data.source = value;
  }
  set modifiers(value: any[]) {
    this._data.modifiers = value;
  }

  /**
   * 从 BuffInterface 对象序列化
   */
  static serialize(buff: BuffInterface): BuffSerializer {
    return new BuffSerializer({
      uid: buff.uid,
      name: buff.name,
      description: buff.description,
      icon: buff.icon,
      iconType: buff.iconType,
      type: buff.type,
      duration: buff.duration,
      isPositive: buff.isPositive,
      ownerUid: buff.owner?.id.toString(), // 只存储 uid，避免循环引用
      giverUid: buff.giver?.id.toString(), // 只存储 uid，避免循环引用
      source: buff.source,
      modifiers: buff.modifiers.map((mod) => this.serializeModifier(mod)),
    });
  }

  /**
   * 序列化 Modifier（根据你的 Modifier 结构调整）
   */
  private static serializeModifier(modifier: Modifier): any {
    // 这里需要根据你的 Modifier 类的实际结构来实现
    // 假设 Modifier 有基本的属性需要序列化
    return {
      // 根据 Modifier 的实际属性进行序列化
      ...modifier,
    };
  }

  /**
   * 反序列化为 BuffInterface（需要提供具体的 BuffInterface 实现类）
   */
  deserialize<T extends BuffInterface>(
    BuffClass: new () => T,
    unitResolver?: (uid: string) => Unit | null
  ): T {
    console.log("Deserializing buff:", this._data.name);
    const buff = new BuffClass();

    buff.uid = this._data.uid;
    buff.name = this._data.name;
    buff.description = this._data.description;
    buff.icon = this._data.icon;
    buff.type = this._data.type;
    buff.iconType = this._data.iconType ?? "svg";
    buff.duration = this._data.duration;
    buff.isPositive = this._data.isPositive;
    buff.source = this._data.source;

    // 通过 uid 解析 Unit 对象
    if (this._data.ownerUid && unitResolver) {
      buff.owner = unitResolver(this._data.ownerUid);
    }
    if (this._data.giverUid && unitResolver) {
      buff.giver = unitResolver(this._data.giverUid);
    }

    // 反序列化 modifiers
    buff.modifiers = this._data.modifiers.map((modData) =>
      BuffSerializer.deserializeModifier(modData)
    );

    return buff;
  }

  /**
   * 反序列化 Modifier（根据你的 Modifier 结构调整）
   */
  private static deserializeModifier(data: any): Modifier {
    // 这里需要根据你的 Modifier 类的实际结构来实现
    // 可能需要创建具体的 Modifier 实例
    return data as Modifier;
  }

  /**
   * 转换为 JSON 字符串
   */
  toJSONString(): string {
    return JSON.stringify(this._data);
  }

  /**
   * 从 JSON 字符串创建
   */
  static fromJSONString(jsonString: string): BuffSerializer {
    const data = JSON.parse(jsonString) as SerializedBuffData;
    return new BuffSerializer(data);
  }

  /**
   * 转换为普通对象（用于存档）
   */
  toPlainObject(): SerializedBuffData {
    return { ...this._data };
  }

  /**
   * 从普通对象创建
   */
  static fromPlainObject(obj: SerializedBuffData): BuffSerializer {
    return new BuffSerializer(obj);
  }

  /**
   * 批量序列化 BuffInterface 数组
   */
  static serializeArray(buffs: BuffInterface[]): any[] {
    const buffSerialize = buffs.map((buff) => this.serialize(buff));
    console.log("Serializing buffs:", buffSerialize);
    return buffSerialize;
  }

  /**
   * 批量反序列化到 BuffInterface 数组
   */
  static async deserializeArray<T extends BuffInterface>(
    serializedBuffs: BuffSerializer[],
    BuffClass?: new () => T,
    unitResolver?: (uid: string) => Unit | null
  ): Promise<T[]> {
    const buffs: T[] = [];
    const buffDeserializePromises: any[] = [];
    console.log("Deserializing buffs:", serializedBuffs);
    for (const serialized of serializedBuffs) {
      const buffDeserializePromise = new Promise<void>(async (resolve) => {
        console.log("Deserializing buff:", serialized);
        const serializedInstance = new BuffSerializer(serialized._data);

        if (BuffClass) {
          buffs.push(serializedInstance.deserialize(BuffClass, unitResolver));
        } else {
          const buffClass = await BuffSerializer.getBuffClass(
            serialized._data.name,
            serialized._data.type
          );

          buffs.push(serializedInstance.deserialize(buffClass, unitResolver));
        }
        resolve();
      });
      buffDeserializePromises.push(buffDeserializePromise);
    }
    await Promise.all(buffDeserializePromises);
    return buffs;
  }
  static async getBuffClass(buffName: string, type?: string) {
    // 根据 traitName 返回对应的 Trait 类

    // const module = await import(`./${buffName}`);
    // return module[buffName];
    const module = await import(`./Buff`);
    return module["Buff"] as any;
    // return Buff
  }

  /**
   * 克隆序列化器
   */
  clone(): BuffSerializer {
    return new BuffSerializer(this._data);
  }

  /**
   * 验证数据完整性
   */
  validate(): boolean {
    return !!(this._data.uid && this._data.name && this._data.type);
  }

  /**
   * 获取用于调试的字符串表示
   */
  toString(): string {
    return `BuffSerializer(${this._data.uid}: ${this._data.name})`;
  }
}
