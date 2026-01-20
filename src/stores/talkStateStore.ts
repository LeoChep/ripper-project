import { defineStore } from "pinia";
import { ref } from "vue";

export const useTalkStateStore = defineStore("talkSteteStore", () => {
  const talkState = ref({
    input: "",
    content: "",
    endFlag: false,
    inputingTimer: null as any,
    onCg: false,
  });
  const end = ref((res: any) => {});

  const CGstart = () => {
    talkState.value.onCg = true;
  };
  const CGEnd = () => {
    talkState.value.onCg = false;
  };
  
  return { talkState, end, CGstart, CGEnd };
});
