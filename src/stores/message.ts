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
    messageDuration: 0, // 消息持续时间（毫秒），0表示永久显示
    messageTimerId: null as number | null, // 定时器ID
  }),
  actions: {
    setMessage(message: string, duration: number = 0) {
      // 清除之前的定时器
      if (this.messageTimerId !== null) {
        clearTimeout(this.messageTimerId);
        this.messageTimerId = null;
      }
      
      this.message = message;
      this.messageDuration = duration;
      
      // 如果设置了持续时间且大于0，则在指定时间后自动清除消息
      if (duration > 0) {
        this.messageTimerId = window.setTimeout(() => {
          this.message = "";
          this.messageDuration = 0;
          this.messageTimerId = null;
        }, duration);
      }
    },
    setBottomMessage(message: string, duration: number = 0) {
      this.bottomMessage = message;
      
      // 如果设置了持续时间且大于0，则在指定时间后自动清除消息
      if (duration > 0) {
        setTimeout(() => {
          this.bottomMessage = "";
        }, duration);
      }
    },
    clearMessages() {
      // 清除定时器
      if (this.messageTimerId !== null) {
        clearTimeout(this.messageTimerId);
        this.messageTimerId = null;
      }
      
      this.message = "";
      this.bottomMessage = "";
      this.messageDuration = 0;
    },
    clearTopMessage() {
      // 清除定时器
      if (this.messageTimerId !== null) {
        clearTimeout(this.messageTimerId);
        this.messageTimerId = null;
      }
      
      this.message = "";
      this.messageDuration = 0;
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
