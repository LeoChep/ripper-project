import { Item } from "./Item";
import type { ItemOptions } from "./ItemInterface";
import { ItemType, ItemRarity } from "./ItemInterface";

/**
 * 道具序列化数据接口
 */
export interface SerializedItemData {
  uid: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;
  icon?: string;
  maxStack: number;
  stackCount: number;
  weight: number;
  value: number;
  canUse: boolean;
  canEquip: boolean;
  properties?: Record<string, any>;
}

/**
 * 道具序列化器类 - 专门用于存档系统
 */
export class ItemSerializer {
  private _data: SerializedItemData;

  constructor(data?: Partial<SerializedItemData>) {
    this._data = {
      uid: data?.uid ?? "",
      name: data?.name ?? "",
      description: data?.description ?? "",
      type: data?.type ?? ItemType.MISC,
      rarity: data?.rarity ?? ItemRarity.COMMON,
      icon: data?.icon,
      maxStack: data?.maxStack ?? 1,
      stackCount: data?.stackCount ?? 1,
      weight: data?.weight ?? 0,
      value: data?.value ?? 0,
      canUse: data?.canUse ?? false,
      canEquip: data?.canEquip ?? false,
      properties: data?.properties,
    };
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
  get type(): ItemType {
    return this._data.type;
  }
  get rarity(): ItemRarity {
    return this._data.rarity;
  }
  get icon(): string | undefined {
    return this._data.icon;
  }
  get maxStack(): number {
    return this._data.maxStack;
  }
  get stackCount(): number {
    return this._data.stackCount;
  }
  get weight(): number {
    return this._data.weight;
  }
  get value(): number {
    return this._data.value;
  }
  get canUse(): boolean {
    return this._data.canUse;
  }
  get canEquip(): boolean {
    return this._data.canEquip;
  }
  get properties(): Record<string, any> | undefined {
    return this._data.properties;
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
  set type(value: ItemType) {
    this._data.type = value;
  }
  set rarity(value: ItemRarity) {
    this._data.rarity = value;
  }
  set icon(value: string | undefined) {
    this._data.icon = value;
  }
  set maxStack(value: number) {
    this._data.maxStack = value;
  }
  set stackCount(value: number) {
    this._data.stackCount = value;
  }
  set weight(value: number) {
    this._data.weight = value;
  }
  set value(value: number) {
    this._data.value = value;
  }
  set canUse(value: boolean) {
    this._data.canUse = value;
  }
  set canEquip(value: boolean) {
    this._data.canEquip = value;
  }
  set properties(value: Record<string, any> | undefined) {
    this._data.properties = value;
  }

  /**
   * 从 Item 对象序列化
   */
  static serialize(item: Item): ItemSerializer {
    console.log('ItemSerializer.serialize', item);
    return new ItemSerializer({
      uid: item.uid,
      name: item.name,
      description: item.description,
      type: item.type,
      rarity: item.rarity,
      icon: item.icon,
      maxStack: item.maxStack,
      stackCount: item.stackCount,
      weight: item.weight,
      value: item.value,
      canUse: item.canUse,
      canEquip: item.canEquip,
      properties: item.properties ? { ...item.properties } : undefined,
    });
  }

  /**
   * 反序列化为 Item 对象
   */
  deserialize(): Item {
    return new Item({
      uid: this._data.uid,
      name: this._data.name,
      description: this._data.description,
      type: this._data.type,
      rarity: this._data.rarity,
      icon: this._data.icon,
      maxStack: this._data.maxStack,
      stackCount: this._data.stackCount,
      weight: this._data.weight,
      value: this._data.value,
      canUse: this._data.canUse,
      canEquip: this._data.canEquip,
      properties: this._data.properties ? { ...this._data.properties } : undefined,
    });
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
  static fromJSONString(jsonString: string): ItemSerializer {
    const data = JSON.parse(jsonString) as SerializedItemData;
    return new ItemSerializer(data);
  }

  /**
   * 转换为普通对象（用于存档）
   */
  toPlainObject(): SerializedItemData {
    return { ...this._data };
  }

  /**
   * 从普通对象创建
   */
  static fromPlainObject(obj: SerializedItemData): ItemSerializer {
    console.log('ItemSerializer.fromPlainObject', obj);
    return new ItemSerializer(obj);
  }

  /**
   * 批量序列化 Item 数组
   */
  static serializeArray(items: Item[]): ItemSerializer[] {
    return items.map((item) => this.serialize(item));
  }

  /**
   * 批量反序列化到 Item 数组
   */
  static deserializeArray(serializedItems: any[]): Item[] {
    if (!serializedItems || !Array.isArray(serializedItems)) {
      console.warn('deserializeArray: 输入不是有效数组', serializedItems);
      return [];
    }
    
    return serializedItems.map((serializer) => {
      try {
        if (serializer instanceof ItemSerializer) {
          return serializer.deserialize();
        } else if (serializer && typeof serializer === 'object') {
          // 如果是普通对象（从 JSON 解析），先创建序列化器
          return ItemSerializer.fromPlainObject(serializer._data as SerializedItemData).deserialize();
        } else {
          console.error('deserializeArray: 无效的序列化器数据', serializer);
          return null;
        }
      } catch (error) {
        console.error('deserializeArray: 反序列化失败', error, serializer);
        return null;
      }
    }).filter((item): item is Item => item !== null);
  }

  /**
   * 克隆序列化器
   */
  clone(): ItemSerializer {
    return new ItemSerializer({
      ...this._data,
      properties: this._data.properties ? { ...this._data.properties } : undefined,
    });
  }

  /**
   * 验证数据完整性
   */
  validate(): boolean {
    return (
      typeof this._data.uid === "string" &&
      this._data.uid.length > 0 &&
      typeof this._data.name === "string" &&
      this._data.name.length > 0 &&
      typeof this._data.type === "string" &&
      typeof this._data.stackCount === "number" &&
      this._data.stackCount > 0 &&
      typeof this._data.maxStack === "number" &&
      this._data.maxStack > 0 &&
      this._data.stackCount <= this._data.maxStack
    );
  }

  /**
   * 获取用于调试的字符串表示
   */
  toString(): string {
    return `ItemSerializer(uid: ${this._data.uid}, name: ${this._data.name}, type: ${this._data.type}, stack: ${this._data.stackCount}/${this._data.maxStack})`;
  }

  /**
   * 比较两个道具是否相同（基于 uid）
   */
  equals(other: ItemSerializer): boolean {
    return this._data.uid === other._data.uid;
  }
}
