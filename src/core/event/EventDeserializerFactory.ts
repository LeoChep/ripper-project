import {
  EndTurnRemoveBuffEvent,
  EndTurnRemoveBuffEventSerializer,
} from "./EndTurnRemoveBuffEvent";

export class EventDeserializerFactory {
  static getDeserializer(eventName: string) {
    switch (eventName) {
      case EndTurnRemoveBuffEvent.name:
        return EndTurnRemoveBuffEventSerializer.getInstance();
      // 在这里添加其他事件类型的反序列化器
      default:
        console.warn(`No deserializer found for event type: ${eventName}`);
        return null;
    }
  }
}
