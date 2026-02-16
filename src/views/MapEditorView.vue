<template>
  <div class="canvas-editor">
    <!-- 顶部操作区 -->
    <div class="toolbar">
      <input
        type="file"
        accept="image/*"
        @change="handleImageUpload"
        id="image-upload"
        style="display: none"
      />
      <button @click="clickImport">
        导入图片
      </button>
      <button @click="exportJson" :disabled="!objects.length">
        导出JSON
      </button>
      <!-- 新增：鼠标位置显示 -->
      <span class="mouse-position" v-if="imageLoaded">
        鼠标位置: X: {{ mouseX }} , Y: {{ mouseY }}
      </span>
      <span v-if="currentSelectBox">
        前景物名称:
        <input
          v-model="currentObject.name"
          placeholder="输入名称"
          style="width: 120px; margin: 0 8px"
        />
        遮挡高度:
        <input
          v-model.number="currentObject.occlusionHeight"
          type="number"
          placeholder="输入高度"
          style="width: 80px; margin: 0 8px"
        />
        <button @click="confirmObject">确认创建</button>
      </span>
    </div>

    <div class="main-content">
      <!-- Canvas 区域 -->
      <div class="canvas-container" ref="canvasContainer">
        <canvas 
          ref="canvasRef" 
          @mousedown="startDraw" 
          @mousemove="(e) => { drawing(e); updateMousePosition(e); }" 
          @mouseup="endDraw"

        ></canvas>
        <div v-if="!imageLoaded" class="empty-tip">请先导入图片</div>
      </div>

      <!-- 侧边栏：对象列表 -->
      <div class="sidebar">
        <h3>前景物对象列表</h3>
        <div v-if="!objects.length" class="empty-list">暂无对象</div>
        <div class="object-item" v-for="(obj, index) in objects" :key="index">
          <div class="object-info">
            <p>名称: {{ obj.name || '未命名' }}</p>
            <p>位置: {{ obj.x }},{{ obj.y }} 大小: {{ obj.width }}x{{ obj.height }}</p>
            <p>遮挡高度: {{ obj.occlusionHeight || 0 }}</p>
          </div>
          <div class="object-actions">
            <button @click="editObject(index)">编辑</button>
            <button @click="deleteObject(index)" style="background: #ff4444; color: white">删除</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// 响应式数据定义
const canvasRef = ref(null);
const canvasContainer = ref(null);
const canvas = ref(null);
const ctx = ref(null);
const image = ref(null);
const imageLoaded = ref(false);
const isDrawing = ref(false);
const startX = ref(0);
const startY = ref(0);
const currentSelectBox = ref(null);
const objects = ref([]);
const currentObject = ref({
  name: '',
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  occlusionHeight: 0
});
const editIndex = ref(-1);
// 新增：鼠标位置响应式变量
const mouseX = ref(0);
const mouseY = ref(0);

// 生命周期：初始化Canvas
onMounted(() => {
  canvas.value = canvasRef.value;
  ctx.value = canvas.value.getContext('2d');
});

// 新增：更新鼠标位置方法
const updateMousePosition = (e) => {
  if (!imageLoaded.value) return;
  const rect = canvas.value.getBoundingClientRect();
  // 计算鼠标在Canvas内的相对坐标（取整，更易读）
  mouseX.value = Math.floor(e.clientX - rect.left);
  mouseY.value = Math.floor(e.clientY - rect.top);
};

const clickImport = () => {
  document.getElementById('image-upload').click();
};
// 处理图片上传
const handleImageUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    image.value = new Image();
    image.value.onload = () => {
      canvas.value.width = image.value.width;
      canvas.value.height = image.value.height;
      ctx.value.drawImage(image.value, 0, 0);
      imageLoaded.value = true;
      currentSelectBox.value = null;
      objects.value = [];
      // 重置鼠标位置
      mouseX.value = 0;
      mouseY.value = 0;
    };
    image.value.src = event.target.result;
  };
  reader.readAsDataURL(file);
};

// 开始绘制框选框
const startDraw = (e) => {
  if (!imageLoaded.value) return;
  isDrawing.value = true;
  const rect = canvas.value.getBoundingClientRect();
  startX.value = e.clientX - rect.left;
  startY.value = e.clientY - rect.top;
  currentSelectBox.value = {
    x: startX.value,
    y: startY.value,
    width: 0,
    height: 0
  };
  currentObject.value = {
    name: '',
    x: startX.value,
    y: startY.value,
    width: 0,
    height: 0,
    occlusionHeight: 0
  };
  editIndex.value = -1;
};

// 绘制中
const drawing = (e) => {
  if (!isDrawing.value || !imageLoaded.value) return;
  const rect = canvas.value.getBoundingClientRect();
  const currentX = e.clientX - rect.left;
  const currentY = e.clientY - rect.top;

  ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height);
  ctx.value.drawImage(image.value, 0, 0);

  const x = Math.min(startX.value, currentX);
  const y = Math.min(startY.value, currentY);
  const width = Math.abs(currentX - startX.value);
  const height = Math.abs(currentY - startY.value);

  currentSelectBox.value = { x, y, width, height };
  currentObject.value.x = x;
  currentObject.value.y = y;
  currentObject.value.width = width;
  currentObject.value.height = height;

  ctx.value.strokeStyle = '#ff0000';
  ctx.value.lineWidth = 2;
  ctx.value.strokeRect(x, y, width, height);
};

// 结束绘制
const endDraw = () => {
  if (!isDrawing.value) return;
  isDrawing.value = false;
  if (currentSelectBox.value.width < 5 || currentSelectBox.value.height < 5) {
    currentSelectBox.value = null;
    return;
  }
};

// 确认创建/编辑对象
const confirmObject = () => {
  if (!currentSelectBox.value) return;
  if (editIndex.value > -1) {
    objects.value[editIndex.value] = { ...currentObject.value };
    editIndex.value = -1;
  } else {
    objects.value.push({ ...currentObject.value });
  }
  currentSelectBox.value = null;
  currentObject.value = {
    name: '',
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    occlusionHeight: 0
  };
  ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height);
  ctx.value.drawImage(image.value, 0, 0);
};

// 编辑对象
const editObject = (index) => {
  const obj = objects.value[index];
  currentObject.value = { ...obj };
  editIndex.value = index;
  ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height);
  ctx.value.drawImage(image.value, 0, 0);
  ctx.value.strokeStyle = '#ff0000';
  ctx.value.lineWidth = 2;
  ctx.value.strokeRect(obj.x, obj.y, obj.width, obj.height);
  currentSelectBox.value = {
    x: obj.x,
    y: obj.y,
    width: obj.width,
    height: obj.height
  };
};

// 删除对象
const deleteObject = (index) => {
  objects.value.splice(index, 1);
  if (index === editIndex.value) {
    editIndex.value = -1;
    currentSelectBox.value = null;
    currentObject.value = {
      name: '',
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      occlusionHeight: 0
    };
    ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height);
    ctx.value.drawImage(image.value, 0, 0);
  }
};

// 导出JSON
const exportJson = () => {
  const jsonStr = JSON.stringify(objects.value, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '前景物对象数据.json';
  a.click();
  URL.revokeObjectURL(url);
};
</script>

<style scoped>
.canvas-editor {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 16px;
  box-sizing: border-box;
}

.toolbar {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.toolbar button {
  padding: 8px 16px;
  cursor: pointer;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
}

.toolbar button:disabled {
  background: #cccccc;
  cursor: not-allowed;
}

/* 新增：鼠标位置样式 */
.mouse-position {
  color: #666;
  font-size: 14px;
  background: #f5f5f5;
  padding: 4px 8px;
  border-radius: 4px;
}

.main-content {
  display: flex;
  flex: 1;
  gap: 16px;
}

.canvas-container {
  flex: 1;
  border: 1px solid #ddd;
  position: relative;
  overflow: auto;
}

.empty-tip {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #999;
}

.sidebar {
  width: 300px;
  border: 1px solid #ddd;
  padding: 16px;
  overflow-y: auto;
}

.object-item {
  padding: 12px;
  border-bottom: 1px solid #eee;
  margin-bottom: 8px;
}

.object-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}

.object-actions button {
  padding: 4px 8px;
  cursor: pointer;
  border: none;
  border-radius: 4px;
  background: #4caf50;
  color: white;
}

.empty-list {
  color: #999;
  text-align: center;
  margin-top: 20px;
}
</style>
