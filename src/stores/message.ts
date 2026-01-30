import { defineStore } from "pinia";

export interface DialogOption {
  label: string;
  value: string | number;
}

export interface ConfirmDialog {
  type: 'confirm';
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export interface SelectDialog {
  type: 'select';
  message: string;
  options: DialogOption[];
  onSelect?: (value: string | number) => void;
  onCancel?: () => void;
  
}

export type DialogConfig = ConfirmDialog | SelectDialog | null;

export const useMessageStore = defineStore("message", {
  state: () => ({
    message: "",
    bottomMessage: "",
    dialogConfig: null as DialogConfig,
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
    // 显示确认对话框
    showConfirmDialog(config: Omit<ConfirmDialog, 'type'>) {

      this.dialogConfig = {
        type: 'confirm',
        confirmText: '确认',
        cancelText: '取消',
        ...config,
      };
    },
    // 显示选择对话框
    showSelectDialog(config: Omit<SelectDialog, 'type'>) {
      this.dialogConfig = {
        type: 'select',
        ...config,
      };
    },
    // 关闭对话框
    closeDialog() {
      this.dialogConfig = null;
    },
  },
});
