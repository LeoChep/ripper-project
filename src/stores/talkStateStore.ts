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
  const count = ref(0);
  const enterEnd = () => {
    count.value++;
    console.log("count", count.value);
    if (!talkState.value.endFlag) {
      window.clearInterval(talkState.value.inputingTimer);
      talkState.value.input = talkState.value.content;
      console.log(talkState.value);
      talkState.value.endFlag = true;
    } else {
      end.value(true);
      (talkState.value.endFlag = false),
        (talkState.value.inputingTimer = null as any);
      talkState.value.input = "";
      talkState.value.content = "";
      end.value = () => {};
    }
  };
  const speak = (content: string) => {
    return new Promise((resolve) => {
      talkState.value.input = "";
      talkState.value.endFlag = false;
      talkState.value.content = content;
      end.value = resolve;
      let timer = setInterval(() => {
        const input = talkState.value.input;
        let endIndex = input.length + 1;
        if (endIndex > content.length) {
          endIndex = content.length;
          window.clearInterval(timer);
          talkState.value.endFlag = true;
        }
        talkState.value.input = content.substring(0, endIndex);
      }, 50);
      talkState.value.inputingTimer = timer;
    });
  };
  const CGstart = () => {
    talkState.value.onCg = true;
  };
  const CGEnd = () => {
    talkState.value.onCg = false;
  };
  return { talkState, speak, enterEnd,CGstart,CGEnd };
});
