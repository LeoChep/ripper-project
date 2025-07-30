import { useMessageStore } from "@/stores/message";
import type { Store } from "pinia";

export class MessageTipSystem {
  static instance: MessageTipSystem | null = null;
  store;
  constructor() {
    const store = useMessageStore();
    this.store = store;
  }

  static getInstance() {
    if (!MessageTipSystem.instance) {
      MessageTipSystem.instance = new MessageTipSystem();
    }

    return MessageTipSystem.instance;
  }

  setMessage(message: string): void {
    this.store.setMessage(message);
  }

  clearMessage(): void {
    this.store.clearMessages();
  }
  setBottomMessage(message: string): void {
    this.store.setBottomMessage(message);
  } 
  clearBottomMessage(): void {
    this.store.clearBottomMessage();
  }
}
