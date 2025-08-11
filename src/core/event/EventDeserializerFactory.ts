import { CombatChallengeGiveEvent, CombatChallengeGiveSerializer } from "../trait/fighter/CombatChallenge/CombatChallengeGiveEvent";
import { CombatChallengeUseEvent, CombatChallengeUseSerializer } from "../trait/fighter/CombatChallenge/CombatChallengeUseEvent";
import {
  EndTurnRemoveBuffEvent,
  EndTurnRemoveBuffEventSerializer,
} from "./EndTurnRemoveBuffEvent";

export class EventDeserializerFactory {
  static getDeserializer(eventName: string) {
    switch (eventName) {
      case EndTurnRemoveBuffEvent.name:
        return EndTurnRemoveBuffEventSerializer.getInstance();
      case CombatChallengeGiveEvent.name:
        return CombatChallengeGiveSerializer.getInstance();
      case CombatChallengeUseEvent.name:
        return CombatChallengeUseSerializer.getInstance();
      // 在这里添加其他事件类型的反序列化器
      default:
        console.warn(`No deserializer found for event type: ${eventName}`);
        return null;
    }
  }
}
