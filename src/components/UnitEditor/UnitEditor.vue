<template>
  <div class="unit-editor">
    <div class="editor-header">
      <h2 class="editor-title">角色编辑器</h2>
    </div>

    <div class="editor-content">
      <!-- 头像上传区域 -->
      <div class="editor-section avatar-section">
        <div class="section-title">头像</div>
        <div class="avatar-container">
          <div class="avatar-preview" :class="{ 'has-avatar': avatarUrl }">
            <img v-if="avatarUrl" :src="avatarUrl" alt="角色头像" class="avatar-image" />
            <div v-else class="avatar-placeholder">
              <span class="placeholder-icon">👤</span>
              <span class="placeholder-text">暂无头像</span>
            </div>
          </div>
          <div class="avatar-actions">
            <input
              ref="avatarInput"
              type="file"
              accept="image/*"
              @change="handleAvatarUpload"
              class="hidden-input"
            />
            <button @click="triggerFileInput" class="editor-btn upload-btn">
              上传头像
            </button>
            <button
              v-if="avatarUrl"
              @click="removeAvatar"
              class="editor-btn remove-btn"
            >
              移除
            </button>
          </div>
        </div>
      </div>

      <!-- 身体数据 -->
      <div class="editor-section body-section">
        <div class="section-title">身体数据</div>
        <div class="body-inputs">
          <div class="input-group">
            <label class="input-label">身高</label>
            <div class="input-with-unit">
              <input
                v-model.number="height"
                type="number"
                step="1"
                min="0"
                class="editor-input"
                placeholder="请输入身高"
              />
              <span class="unit-label">cm</span>
            </div>
          </div>
          <div class="input-group">
            <label class="input-label">体重</label>
            <div class="input-with-unit">
              <input
                v-model.number="weight"
                type="number"
                step="0.1"
                min="0"
                class="editor-input"
                placeholder="请输入体重"
              />
              <span class="unit-label">kg</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 外貌描述 -->
      <div class="editor-section appearance-section">
        <div class="section-title">外貌描述</div>
        <textarea
          v-model="appearance"
          class="appearance-textarea"
          placeholder="请输入角色的外貌描述，例如：发色、瞳色、面容特征、体态等..."
          rows="5"
        ></textarea>
        <div class="char-count">
          {{ appearance.length }} / 500
        </div>
      </div>

      <!-- 生成模型按钮 -->
      <div class="editor-section generate-section">
        <button
          @click="generateModel"
          :disabled="!canGenerate"
          class="generate-btn"
          :class="{ 'generating': isGenerating }"
        >
          <span v-if="!isGenerating" class="btn-icon">🎨</span>
          <span v-else class="btn-icon spinning">⚙️</span>
          {{ isGenerating ? '生成中...' : '生成模型' }}
        </button>
        <div class="generate-hint">
          生成模型功能即将推出，敬请期待！
        </div>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="editor-footer">
      <button @click="resetData" class="footer-btn reset-btn">重置</button>
      <button @click="saveData" class="footer-btn save-btn">保存</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

// 定义组件事件
const emit = defineEmits<{
  save: [data: UnitEditorData];
  reset: [];
}>();

// 数据接口
export interface UnitEditorData {
  avatarUrl?: string;
  height?: number;
  weight?: number;
  appearance: string;
}

// Props
const props = defineProps<{
  initialData?: Partial<UnitEditorData>;
}>();

// 响应式数据
const avatarUrl = ref<string>('');
const height = ref<number | undefined>(props.initialData?.height);
const weight = ref<number | undefined>(props.initialData?.weight);
const appearance = ref<string>(props.initialData?.appearance || '');
const avatarInput = ref<HTMLInputElement | null>(null);
const isGenerating = ref<boolean>(false);

// 计算属性：是否可以生成模型
const canGenerate = computed(() => {
  return height.value && weight.value && appearance.value.trim().length > 0;
});

// 触发文件选择
const triggerFileInput = () => {
  avatarInput.value?.click();
};

// 处理头像上传
const handleAvatarUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file) {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    // 验证文件大小（限制5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过5MB');
      return;
    }

    // 创建预览URL
    const reader = new FileReader();
    reader.onload = (e) => {
      avatarUrl.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

// 移除头像
const removeAvatar = () => {
  avatarUrl.value = '';
  if (avatarInput.value) {
    avatarInput.value.value = '';
  }
};

// 生成模型
const generateModel = () => {
  if (!canGenerate.value) return;

  isGenerating.value = true;

  // 模拟生成过程（不实现实际功能）
  setTimeout(() => {
    isGenerating.value = false;
    alert('模型生成功能即将推出！');
  }, 2000);
};

// 重置数据
const resetData = () => {
  height.value = props.initialData?.height;
  weight.value = props.initialData?.weight;
  appearance.value = props.initialData?.appearance || '';
  avatarUrl.value = '';
  emit('reset');
};

// 保存数据
const saveData = () => {
  const data: UnitEditorData = {
    appearance: appearance.value.trim(),
  };

  if (avatarUrl.value) {
    data.avatarUrl = avatarUrl.value;
  }

  if (height.value) {
    data.height = height.value;
  }

  if (weight.value) {
    data.weight = weight.value;
  }

  emit('save', data);
};

// 监听外貌描述长度
watch(appearance, (newValue) => {
  if (newValue.length > 500) {
    appearance.value = newValue.slice(0, 500);
  }
});
</script>

<style scoped>
.unit-editor {
  background: linear-gradient(135deg, rgba(61, 36, 21, 0.95), rgba(44, 24, 16, 0.95));
  border: 2px solid rgba(139, 69, 19, 0.8);
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 215, 0, 0.1);
  display: flex;
  flex-direction: column;
  max-width: 600px;
  margin: 0 auto;
}

.editor-header {
  padding: 20px;
  border-bottom: 1px solid rgba(139, 69, 19, 0.5);
  text-align: center;
}

.editor-title {
  font-size: 24px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  margin: 0;
}

.editor-content {
  padding: 20px;
  flex: 1;
}

.editor-section {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(139, 69, 19, 0.5);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(139, 69, 19, 0.5);
}

/* 头像区域 */
.avatar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.avatar-preview {
  width: 150px;
  height: 150px;
  border-radius: 8px;
  border: 2px dashed rgba(139, 69, 19, 0.8);
  overflow: hidden;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.avatar-preview.has-avatar {
  border-style: solid;
  border-color: #ffd700;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: rgba(230, 211, 183, 0.6);
}

.placeholder-icon {
  font-size: 48px;
}

.placeholder-text {
  font-size: 14px;
}

.avatar-actions {
  display: flex;
  gap: 12px;
}

.hidden-input {
  display: none;
}

/* 身体数据 */
.body-inputs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-label {
  font-size: 14px;
  color: #daa520;
  font-weight: bold;
}

.input-with-unit {
  display: flex;
  align-items: center;
  gap: 8px;
}

.editor-input {
  flex: 1;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(139, 69, 19, 0.8);
  border-radius: 6px;
  padding: 10px 12px;
  color: #e6d3b7;
  font-size: 14px;
  transition: all 0.3s ease;
}

.editor-input:focus {
  outline: none;
  border-color: #ffd700;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
}

.editor-input::placeholder {
  color: rgba(230, 211, 183, 0.4);
}

.unit-label {
  color: #daa520;
  font-size: 14px;
  min-width: 30px;
}

/* 外貌描述 */
.appearance-textarea {
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(139, 69, 19, 0.8);
  border-radius: 6px;
  padding: 12px;
  color: #e6d3b7;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  transition: all 0.3s ease;
  font-family: inherit;
}

.appearance-textarea:focus {
  outline: none;
  border-color: #ffd700;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
}

.appearance-textarea::placeholder {
  color: rgba(230, 211, 183, 0.4);
}

.char-count {
  text-align: right;
  font-size: 12px;
  color: rgba(230, 211, 183, 0.6);
  margin-top: 8px;
}

/* 生成模型 */
.generate-section {
  text-align: center;
}

.generate-btn {
  background: linear-gradient(135deg, #ffd700, #daa520);
  border: 2px solid #b8860b;
  border-radius: 8px;
  padding: 12px 32px;
  font-size: 16px;
  font-weight: bold;
  color: #3d2415;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.generate-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #ffed4a, #ffd700);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
}

.generate-btn:active:not(:disabled) {
  transform: translateY(0);
}

.generate-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(0.5);
}

.generate-btn.generating {
  pointer-events: none;
}

.btn-icon {
  font-size: 18px;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.generate-hint {
  margin-top: 12px;
  font-size: 12px;
  color: rgba(230, 211, 183, 0.6);
}

/* 底部操作栏 */
.editor-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(139, 69, 19, 0.5);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.footer-btn {
  border-radius: 6px;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid;
}

.reset-btn {
  background: rgba(0, 0, 0, 0.3);
  border-color: rgba(139, 69, 19, 0.8);
  color: #e6d3b7;
}

.reset-btn:hover {
  background: rgba(139, 69, 19, 0.3);
  border-color: #daa520;
}

.save-btn {
  background: linear-gradient(135deg, #228b22, #32cd32);
  border-color: #006400;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.save-btn:hover {
  background: linear-gradient(135deg, #32cd32, #3cb371);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
}

.save-btn:active {
  transform: translateY(0);
}

.editor-btn {
  background: rgba(139, 69, 19, 0.6);
  border: 1px solid rgba(139, 69, 19, 0.8);
  border-radius: 6px;
  padding: 8px 16px;
  color: #ffd700;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.editor-btn:hover {
  background: rgba(139, 69, 19, 0.8);
  border-color: #daa520;
}

.remove-btn {
  background: rgba(178, 34, 34, 0.6);
  border-color: rgba(178, 34, 34, 0.8);
  color: #fff;
}

.remove-btn:hover {
  background: rgba(178, 34, 34, 0.8);
  border-color: #ff4500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .body-inputs {
    grid-template-columns: 1fr;
  }

  .avatar-actions {
    flex-direction: column;
    width: 100%;
  }

  .editor-btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .unit-editor {
    border-radius: 8px;
  }

  .editor-title {
    font-size: 20px;
  }

  .avatar-preview {
    width: 120px;
    height: 120px;
  }
}
</style>
