import { Door } from "./Door";
import { golbalSetting } from "../golbalSetting";

/**
 * Door 序列化数据接口
 */
export interface SerializedDoorData {
  id: number;
  linkedId: number;
  isOpen: boolean;
  x: number;
  y: number;
  wallData?: any; // 存储 wall 的序列化数据，而不是引用
}

/**
 * Door 序列化器类 - 专门用于存档系统
 */
export class DoorSerializer {
  private _data: SerializedDoorData;

  constructor(data?: Partial<SerializedDoorData>) {
    this._data = {
      id: data?.id ?? 0,
      linkedId: data?.linkedId ?? 0,
      isOpen: data?.isOpen ?? false,
      x: data?.x ?? 0,
      y: data?.y ?? 0,
      wallData: data?.wallData,
    };
  }

  // Getters
  get linkedId(): number {
    return this._data.linkedId;
  }
  get isOpen(): boolean {
    return this._data.isOpen;
  }
  get x(): number {
    return this._data.x;
  }
  get y(): number {
    return this._data.y;
  }
  get wallData(): any {
    return this._data.wallData;
  }

  // Setters
  set linkedId(value: number) {
    this._data.linkedId = value;
  }
  set isOpen(value: boolean) {
    this._data.isOpen = value;
  }
  set x(value: number) {
    this._data.x = value;
  }
  set y(value: number) {
    this._data.y = value;
  }
  set wallData(value: any) {
    this._data.wallData = value;
  }

  /**
   * 从 Door 对象序列化
   */
  static serialize(door: Door): DoorSerializer {
    return new DoorSerializer({
      id: door.id,
      linkedId: door.linkedId,
      isOpen: door.isOpen,
      x: door.x,
      y: door.y,
    });
  }

  /**
   * 反序列化为 Door 对象
   */
  deserialize(): Door {
    const door = new Door(this._data.id, this._data.x, this._data.y,this._data.linkedId);

    // 恢复门的状态
    door.isOpen = this._data.isOpen;




    console.log(
      "Door deserialized at:",
      door.x,
      door.y,
      "linkedId:",
      door.linkedId,
      "isOpen:",
      door.isOpen
    );

    return door;
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
  static fromJSONString(jsonString: string): DoorSerializer {
    const data = JSON.parse(jsonString) as SerializedDoorData;
    return new DoorSerializer(data);
  }

  /**
   * 转换为普通对象（用于存档）
   */
  toPlainObject(): SerializedDoorData {
    return { ...this._data };
  }

  /**
   * 从普通对象创建
   */
  static fromPlainObject(obj: SerializedDoorData): DoorSerializer {
    return new DoorSerializer(obj);
  }

  /**
   * 批量序列化 Door 数组
   */
  static serializeArray(doors: Door[]): DoorSerializer[] {
    return doors.map((door) => this.serialize(door));
  }

  /**
   * 批量反序列化到 Door 数组
   */
  static deserializeArray(serializedDoors: DoorSerializer[]): Door[] {
    console.log("Deserializing doors:", serializedDoors);
    return serializedDoors.map((serialized) => {
        console.log("Deserializing door:", serialized);
      return new DoorSerializer(serialized._data).deserialize();
    });
  }

  /**
   * 从门对象数组序列化（兼容 createDoorFromDoorObj 函数）
   */
  static serializeFromDoorObjects(doorObjects: any[]): DoorSerializer[] {
    return doorObjects.map((obj) => {
      const x = (obj.x1 + obj.x2) / 2;
      const y = (obj.y1 + obj.y2) / 2;
      return new DoorSerializer({
        linkedId: obj.id,
        isOpen: obj.useable === false ? true : false,
        x: x,
        y: y,
      });
    });
  }

  /**
   * 克隆序列化器
   */
  clone(): DoorSerializer {
    return new DoorSerializer({
      ...this._data,
      wallData: this._data.wallData ? { ...this._data.wallData } : undefined,
    });
  }

  /**
   * 验证数据完整性
   */
  validate(): boolean {
    return (
      typeof this._data.linkedId === "number" &&
      typeof this._data.isOpen === "boolean" &&
      typeof this._data.x === "number" &&
      typeof this._data.y === "number"
    );
  }

  /**
   * 获取用于调试的字符串表示
   */
  toString(): string {
    return `DoorSerializer(linkedId: ${this._data.linkedId}, position: (${this._data.x}, ${this._data.y}), isOpen: ${this._data.isOpen})`;
  }

  /**
   * 比较两个门是否相同（基于 linkedId 和位置）
   */
  equals(other: DoorSerializer): boolean {
    return (
      this._data.linkedId === other._data.linkedId &&
      this._data.x === other._data.x &&
      this._data.y === other._data.y
    );
  }

  /**
   * 更新门的状态
   */
  updateState(isOpen: boolean): void {
    this._data.isOpen = isOpen;
  }

  /**
   * 更新门的位置
   */
  updatePosition(x: number, y: number): void {
    this._data.x = x;
    this._data.y = y;
  }
}
