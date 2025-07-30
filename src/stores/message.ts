import { defineStore } from "pinia";

export const useMessageStore = defineStore("message", {
  state: () => ({
    message: "",
    bottomMessage: "",
  }),
  actions: {
    setMessage(message: string) {
      this.message = message;
    },
    setBottomMessage(message: string) {
      this.bottomMessage = message;
    },
    clearMessages() {
      this.message = "";
      this.bottomMessage = "";
    },
    clearTopMessage() {
      this.message = "";
    },
    clearBottomMessage() {
      this.bottomMessage = "";
    },
  },
});
