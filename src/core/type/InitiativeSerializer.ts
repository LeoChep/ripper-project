import { InitiativeClass } from "./InitiativeClass";
import type { Unit } from "../units/Unit";


/**
 * InitiativeClass 序列化数据接口
 */
export interface SerializedInitiativeData {
  initativeValue: number;
  ownerUid?: string; // 只存储 Unit 的 uid，避免循环引用
  standerActionNumber: number;
  minorActionNumber: number;
  moveActionNumber: number;
  reactionNumber: number;
  ready: boolean;
  roundNumber: number;
}

/**
 * InitiativeClass 序列化器类 - 专门用于存档系统
 */
export class InitiativeSerializer {
  private _data: SerializedInitiativeData;

  constructor(data?: Partial<SerializedInitiativeData>) {
    this._data = {
      initativeValue: data?.initativeValue ?? 0,
      ownerUid: data?.ownerUid,
      standerActionNumber: data?.standerActionNumber ?? 0,
      minorActionNumber: data?.minorActionNumber ?? 0,
      moveActionNumber: data?.moveActionNumber ?? 0,
      reactionNumber: data?.reactionNumber ?? 0,
      ready: data?.ready ?? true,
      roundNumber: data?.roundNumber ?? 0,
    };
  }

  // Getters
  get initativeValue(): number {
    return this._data.initativeValue;
  }
  get ownerUid(): string | undefined {
    return this._data.ownerUid;
  }
  get standerActionNumber(): number {
    return this._data.standerActionNumber;
  }
  get minorActionNumber(): number {
    return this._data.minorActionNumber;
  }
  get moveActionNumber(): number {
    return this._data.moveActionNumber;
  }
  get reactionNumber(): number {
    return this._data.reactionNumber;
  }
  get ready(): boolean {
    return this._data.ready;
  }

  // Setters
  set initativeValue(value: number) {
    this._data.initativeValue = value;
  }
  set ownerUid(value: string | undefined) {
    this._data.ownerUid = value;
  }
  set standerActionNumber(value: number) {
    this._data.standerActionNumber = value;
  }
  set minorActionNumber(value: number) {
    this._data.minorActionNumber = value;
  }
  set moveActionNumber(value: number) {
    this._data.moveActionNumber = value;
  }
  set reactionNumber(value: number) {
    this._data.reactionNumber = value;
  }
  set ready(value: boolean) {
    this._data.ready = value;
  }

  /**
   * 从 InitiativeClass 对象序列化
   */
  static serialize(initiative: InitiativeClass): InitiativeSerializer {
    return new InitiativeSerializer({
      initativeValue: initiative.initativeValue,
      ownerUid: initiative.owner?.id.toString(), // 只存储 uid，避免循环引用
      standerActionNumber: initiative.standerActionNumber,
      minorActionNumber: initiative.minorActionNumber,
      moveActionNumber: initiative.moveActionNumber,
      reactionNumber: initiative.reactionNumber,
      roundNumber: initiative.roundNumber,
      ready: initiative.ready,
    });
  }

  /**
   * 反序列化为 InitiativeClass 对象
   */
  deserialize(unitResolver?: (uid: string) => Unit | null): InitiativeClass {
    const initiative = new InitiativeClass(this._data.initativeValue);

    // 恢复所有属性
    initiative.standerActionNumber = this._data.standerActionNumber;
    initiative.minorActionNumber = this._data.minorActionNumber
    initiative.moveActionNumber = this._data.moveActionNumber;
    initiative.reactionNumber = this._data.reactionNumber;
    initiative.ready = this._data.ready;
    initiative.roundNumber = this._data.roundNumber;
    // 通过 uid 解析 Unit 对象
    if (this._data.ownerUid && unitResolver) {
      initiative.owner = unitResolver(this._data.ownerUid);
      if (initiative.owner) initiative.owner.initiative = initiative;
    }

    return initiative;
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
  static fromJSONString(jsonString: string): InitiativeSerializer {
    const data = JSON.parse(jsonString) as SerializedInitiativeData;
    return new InitiativeSerializer(data);
  }

  /**
   * 转换为普通对象（用于存档）
   */
  toPlainObject(): SerializedInitiativeData {
    return { ...this._data };
  }

  /**
   * 从普通对象创建
   */
  static fromPlainObject(obj: SerializedInitiativeData): InitiativeSerializer {
    return new InitiativeSerializer(obj);
  }

  /**
   * 批量序列化 InitiativeClass 数组
   */
  static serializeArray(
    initiatives: InitiativeClass[]
  ): InitiativeSerializer[] {
    return initiatives.map((initiative) => this.serialize(initiative));
  }

  /**
   * 批量反序列化 - 主要方法，接受普通对象数组
   */
  static deserializeArray(
    serializedData: InitiativeSerializer[],
    unitResolver?: (uid: string) => Unit | null
  ): InitiativeClass[] {
    console.log("InitiativeSerializer.deserializeArray", serializedData);
    return serializedData.map((data) => {
      const serializer = new InitiativeSerializer(data._data);
      return serializer.deserialize(unitResolver);
    });
  }

  /**
   * 便捷方法：序列化并转换为普通对象数组（用于存档）
   */
  static serializeToPlainArray(
    initiatives: InitiativeClass[]
  ): SerializedInitiativeData[] {
    return this.serializeArray(initiatives).map((s) => s.toPlainObject());
  }

  /**
   * 克隆序列化器
   */
  clone(): InitiativeSerializer {
    return new InitiativeSerializer({ ...this._data });
  }

  /**
   * 验证数据完整性
   */
  validate(): boolean {
    return (
      typeof this._data.initativeValue === "number" &&
      typeof this._data.standerActionNumber === "number" &&
      typeof this._data.minorActionNumber === "number" &&
      typeof this._data.moveActionNumber === "number" &&
      typeof this._data.reactionNumber === "number" &&
      typeof this._data.ready === "boolean" &&
      this._data.initativeValue >= 0 &&
      this._data.standerActionNumber >= 0 &&
      this._data.minorActionNumber >= 0 &&
      this._data.moveActionNumber >= 0 &&
      this._data.reactionNumber >= 0
    );
  }

  /**
   * 重置所有行动次数
   */
  resetActions(): void {
    this._data.standerActionNumber = 0;
    this._data.minorActionNumber = 0;
    this._data.moveActionNumber = 0;
    this._data.reactionNumber = 0;
    this._data.ready = true;
  }

  /**
   * 消耗指定类型的行动次数
   */
  consumeAction(
    actionType: "stander" | "minor" | "move" | "reaction",
    amount: number = 1
  ): boolean {
    switch (actionType) {
      case "stander":
        this._data.standerActionNumber += amount;
        break;
      case "minor":
        this._data.minorActionNumber += amount;
        break;
      case "move":
        this._data.moveActionNumber += amount;
        break;
      case "reaction":
        this._data.reactionNumber += amount;
        break;
      default:
        return false;
    }
    return true;
  }

  /**
   * 检查是否有可用的行动次数
   */
  hasAvailableAction(
    actionType: "stander" | "minor" | "move" | "reaction",
    limit: number = 1
  ): boolean {
    switch (actionType) {
      case "stander":
        return this._data.standerActionNumber < limit;
      case "minor":
        return this._data.minorActionNumber < limit;
      case "move":
        return this._data.moveActionNumber < limit;
      case "reaction":
        return this._data.reactionNumber < limit;
      default:
        return false;
    }
  }

  /**
   * 获取用于调试的字符串表示
   */
  toString(): string {
    return (
      `InitiativeSerializer(value: ${this._data.initativeValue}, ready: ${this._data.ready}, ` +
      `actions: ${this._data.standerActionNumber}/${this._data.minorActionNumber}/${this._data.moveActionNumber}/${this._data.reactionNumber})`
    );
  }

  /**
   * 比较两个主动权值
   */
  compareTo(other: InitiativeSerializer): number {
    return other._data.initativeValue - this._data.initativeValue; // 降序排列
  }

  /**
   * 检查是否已用完所有行动
   */
  isExhausted(limits: {
    stander: number;
    minor: number;
    move: number;
    reaction: number;
  }): boolean {
    return (
      this._data.standerActionNumber >= limits.stander &&
      this._data.minorActionNumber >= limits.minor &&
      this._data.moveActionNumber >= limits.move &&
      this._data.reactionNumber >= limits.reaction
    );
  }

  /**
   * 获取行动使用情况摘要
   */
  getActionSummary(): { [key: string]: number } {
    return {
      stander: this._data.standerActionNumber,
      minor: this._data.minorActionNumber,
      move: this._data.moveActionNumber,
      reaction: this._data.reactionNumber,
    };
  }
}
