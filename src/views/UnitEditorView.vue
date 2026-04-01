<script setup lang="ts">
import { ref } from 'vue';
import { UnitEditor, type UnitEditorData } from '@/components/UnitEditor';

// 存储编辑器数据
const editorData = ref<Partial<UnitEditorData>>({
  height: 175,
  weight: 70,
  appearance: ''
});

// 处理保存
const handleSave = (data: UnitEditorData) => {
  console.log('保存角色数据:', data);
  editorData.value = data;

  // 保存到 localStorage
  localStorage.setItem('unitEditorData', JSON.stringify(data));

  alert('角色数据已保存！');
};

// 处理重置
const handleReset = () => {
  editorData.value = {
    height: 175,
    weight: 70,
    appearance: ''
  };
  console.log('已重置角色数据');
};
</script>

<template>
  <div class="unit-editor-view">
    <div class="view-container">
      <h1 class="view-title">角色创建</h1>
      <UnitEditor
        :initial-data="editorData"
        @save="handleSave"
        @reset="handleReset"
      />
    </div>
  </div>
</template>

<style scoped>
.unit-editor-view {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #2c1810 0%, #1a0f0a 100%);
  overflow-y: auto;
  padding: 20px;
}

.view-container {
  width: 100%;
  max-width: 700px;
}

.view-title {
  text-align: center;
  font-size: 36px;
  font-weight: bold;
  color: #ffd700;
  text-shadow:
    0 0 20px rgba(255, 215, 0, 0.5),
    2px 2px 4px rgba(0, 0, 0, 0.8);
  margin-bottom: 24px;
  font-family: 'STKaiti', 'KaiTi', 'Microsoft YaHei', serif;
  letter-spacing: 8px;
}
</style>
