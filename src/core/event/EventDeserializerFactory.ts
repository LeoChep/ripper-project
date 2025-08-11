import { EventSerializerSheet } from "./EventSerializerSheet";

export class EventDeserializerFactory {
  static getDeserializer(eventName: string) {
   return  EventSerializerSheet.getInstance().getSerializer(eventName);
  }
}
