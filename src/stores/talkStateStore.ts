import { defineStore } from "pinia";
import { ref } from "vue";

export interface DialogOption {
  text: string;
  value: any;
}

export const useTalkStateStore = defineStore("talkSteteStore", () => {
  const talkState = ref({
    input: "",
    content: "",
    endFlag: false,
    inputingTimer: null as any,
    onCg: false,
    isOnChoice: false,
  });
  const end = ref((res: any) => {});
  
  // 选项相关状态
  const options = ref<DialogOption[]>([]);
  const selectedOption = ref<number>(-1); // 当前高亮的选项索引
  const onSelectOption = ref<(value: any) => void>(() => {});

  const CGstart = () => {
    talkState.value.onCg = true;
  };
  const CGEnd = () => {
    talkState.value.onCg = false;
  };
  
  // 显示选项
  const showOptions = (opts: DialogOption[], callback: (value: any) => void) => {
    options.value = opts;
    selectedOption.value = 0; // 默认选中第一个
    onSelectOption.value = callback;
  };
  
  // 清除选项
  const clearOptions = () => {
    options.value = [];
    selectedOption.value = -1;
    onSelectOption.value = () => {};
  };
  
  // 选择选项
  const selectOption = (index: number) => {
    if (index >= 0 && index < options.value.length) {
      const selected = options.value[index];
      onSelectOption.value(selected.value);
      clearOptions();
    }
  };
  
  return { 
    talkState, 
    end, 
    CGstart, 
    CGEnd,
    options,
    selectedOption,
    showOptions,
    clearOptions,
    selectOption
  };
});
