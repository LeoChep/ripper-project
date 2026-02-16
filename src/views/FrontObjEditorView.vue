
<template>
  <div class="canvas-editor dark">
    <div class="toolbar">
      <input id="image-upload" type="file" accept="image/*" @change="handleImageUpload" style="display: none" />
      <input id="json-upload" type="file" accept="application/json" @change="handleJsonImport" style="display: none" />
      <button @click="clickImport">导入图片</button>
      <button @click="clickImportJson">导入对象JSON</button>
      <button @click="exportJson" :disabled="!objects.length">导出JSON</button>
      <span class="zoom-controls" v-if="imageLoaded">
        <button class="zoom-btn" @click="zoomOut">-</button>
        <span class="zoom-label">{{ Math.round(scale * 100) }}%</span>
        <button class="zoom-btn" @click="zoomIn">+</button>
        <button class="zoom-reset" @click="resetZoom">100%</button>
      </span>
      <span class="mouse-position" v-if="imageLoaded">
        鼠标位置: X: {{ mouseX }} , Y: {{ mouseY }}
      </span>
    </div>
    <div class="main-content">
      <div class="left-panel">
        <div class="property-box">
          <h3>对象属性编辑</h3>
          <div v-if="currentSelectBox">
            <div class="form-row">
              <label>前景物名称:</label>
              <input v-model="currentObject.name" placeholder="输入名称" />
            </div>
            <div class="form-row">
              <label>遮挡高度:</label>
              <input v-model.number="currentObject.occlusionHeight" type="number" placeholder="输入高度" />
            </div>
            <div class="form-row">
              <button @click="confirmObject">确认创建</button>
            </div>
          </div>
          <div v-else class="tip">请在画布上框选对象</div>
        </div>
      </div>
      <div class="canvas-center">
        <div class="canvas-container" ref="canvasContainer" @wheel="handleWheel">
          <canvas
            ref="canvasRef"
            :style="canvasStyle"
            @mousedown="startDraw"
            @mousemove="(e) => { drawing(e); updateMousePosition(e); }"
            @mouseup="endDraw"
            @click="setOcclusionHeight"
          ></canvas>
          <div v-if="!imageLoaded" class="empty-tip">请先导入图片</div>
        </div>
      </div>
      <div class="right-panel">
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
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
// 导入对象JSON
const clickImportJson = () => {
	document.getElementById('json-upload').click();
};

const handleJsonImport = (e) => {
	const file = e.target.files[0];
	if (!file) return;
	const reader = new FileReader();
	reader.onload = (event) => {
		try {
			const arr = JSON.parse(event.target.result);
			if (Array.isArray(arr)) {
				objects.value = arr.map(obj => ({
					name: obj.name || '',
					x: obj.x || 0,
					y: obj.y || 0,
					width: obj.width || 0,
					height: obj.height || 0,
					occlusionHeight: obj.occlusionHeight || 0
				}));
			}
		} catch (err) {
			alert('导入的JSON格式不正确');
		}
	};
	reader.readAsText(file);
};

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
const baseWidth = ref(0);
const baseHeight = ref(0);
const scale = ref(1);
const currentObject = ref({
	name: '',
	x: 0,
	y: 0,
	width: 0,
	height: 0,
	occlusionHeight: 0
});
const editIndex = ref(-1);
const mouseX = ref(0);
const mouseY = ref(0);
const minScale = 0.2;
const maxScale = 4;
const scaleStep = 0.1;

onMounted(() => {
	canvas.value = canvasRef.value;
	ctx.value = canvas.value.getContext('2d');
});

const canvasStyle = computed(() => {
	if (!baseWidth.value || !baseHeight.value) return {};
	return {
		width: `${baseWidth.value * scale.value}px`,
		height: `${baseHeight.value * scale.value}px`
	};
});

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const setScale = (nextScale) => {
	const rounded = Number(nextScale.toFixed(2));
	scale.value = clamp(rounded, minScale, maxScale);
};

const zoomIn = () => {
	setScale(scale.value + scaleStep);
};

const zoomOut = () => {
	setScale(scale.value - scaleStep);
};

const resetZoom = () => {
	setScale(1);
};

const handleWheel = (e) => {
	if (!imageLoaded.value || !e.ctrlKey) return;
	e.preventDefault();
	const direction = e.deltaY > 0 ? -1 : 1;
	setScale(scale.value + direction * scaleStep);
};

const getCanvasPoint = (e) => {
	const rect = canvas.value.getBoundingClientRect();
	return {
		x: (e.clientX - rect.left) / scale.value,
		y: (e.clientY - rect.top) / scale.value
	};
};

const updateMousePosition = (e) => {
	if (!imageLoaded.value) return;
	const point = getCanvasPoint(e);
	mouseX.value = Math.floor(point.x);
	mouseY.value = Math.floor(point.y);
};

const handleImageUpload = (e) => {
	const file = e.target.files[0];
	if (!file) return;

	const reader = new FileReader();
	reader.onload = (event) => {
		image.value = new Image();
		image.value.onload = () => {
			canvas.value.width = image.value.width;
			canvas.value.height = image.value.height;
			baseWidth.value = image.value.width;
			baseHeight.value = image.value.height;
			scale.value = 1;
			ctx.value.drawImage(image.value, 0, 0);
			imageLoaded.value = true;
			currentSelectBox.value = null;
			objects.value = [];
			mouseX.value = 0;
			mouseY.value = 0;
		};
		image.value.src = event.target.result;
	};
	reader.readAsDataURL(file);
};

const clickImport = () => {
	document.getElementById('image-upload').click();
};

const startDraw = (e) => {
    if (fMode.value) { return; }
	if (!imageLoaded.value) return;
	isDrawing.value = true;
	const point = getCanvasPoint(e);
	startX.value = point.x;
	startY.value = point.y;
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

const drawing = (e) => {
	if (!isDrawing.value || !imageLoaded.value) return;
	const point = getCanvasPoint(e);
	const currentX = point.x;
	const currentY = point.y;

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

const endDraw = () => {
    if (fMode.value) { return; }
	if (!isDrawing.value) return;
	isDrawing.value = false;
	if (currentSelectBox.value.width < 5 || currentSelectBox.value.height < 5) {
		currentSelectBox.value = null;
	}
};
const fMode = ref(false);
addEventListener('keydown', (e) => {
    if (e.key === 'F'|| e.key === 'f') {
        fMode.value = true;

    }
});
addEventListener('keyup', (e) => {
    if (e.key === 'F'|| e.key === 'f') {
        fMode.value = false;
    }
});
const setOcclusionHeight = (e) => {
	if (!currentSelectBox.value || !fMode.value) return;
	const point = getCanvasPoint(e);
	const box = currentSelectBox.value;
	const insideX = point.x >= box.x && point.x <= box.x + box.width;
	const insideY = point.y >= box.y && point.y <= box.y + box.height;
	if (!insideX || !insideY) return;
	const height = Math.round(box.y + box.height - point.y);
	currentObject.value.occlusionHeight = Math.max(0, height);
};

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

.canvas-editor.dark {
	width: 100vw;
	height: 100vh;
	background: #181a1b;
	color: #e0e0e0;
	display: flex;
	flex-direction: column;
	padding: 0;
	box-sizing: border-box;
}

.toolbar {
	padding: 18px 32px 0 32px;
	display: flex;
	align-items: center;
	gap: 18px;
	background: #232323;
	border-bottom: 1px solid #222;
}
.toolbar button {
	padding: 8px 18px;
	cursor: pointer;
	background: #222a2f;
	color: #e0e0e0;
	border: none;
	border-radius: 6px;
	font-weight: 500;
	transition: background 0.2s;
}
.toolbar button:hover {
	background: #2a3a4a;
}
.toolbar button:disabled {
	background: #444;
	cursor: not-allowed;
}
.zoom-controls {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	background: #232323;
	padding: 4px 8px;
	border-radius: 4px;
}
.zoom-btn,
.zoom-reset {
	padding: 4px 8px;
	cursor: pointer;
	background: #2a3a4a;
	color: #e0e0e0;
	border: none;
	border-radius: 4px;
}
.zoom-label {
	min-width: 52px;
	text-align: center;
	color: #b0b0b0;
	font-size: 13px;
}
.mouse-position {
	color: #b0b0b0;
	font-size: 14px;
	background: #232323;
	padding: 4px 8px;
	border-radius: 4px;
}
.main-content {
	display: flex;
	flex: 1;
	background: #181a1b;
	gap: 0;
}
.left-panel {
	width: 320px;
	background: #232323;
	border-right: 1px solid #222;
	display: flex;
	flex-direction: column;
	align-items: stretch;
	padding: 32px 18px 0 18px;
}
.property-box {
	background: #232323;
	border-radius: 8px;
	padding: 18px;
	box-shadow: 0 2px 8px #00000033;
}
.property-box h3 {
	margin-bottom: 18px;
	font-size: 18px;
	color: #e0e0e0;
}
.form-row {
	margin-bottom: 14px;
	display: flex;
	align-items: center;
	gap: 12px;
}
.form-row label {
	min-width: 80px;
	color: #b0b0b0;
}
.form-row input {
	flex: 1;
	padding: 6px 10px;
	border-radius: 4px;
	border: 1px solid #444;
	background: #181a1b;
	color: #e0e0e0;
}
.form-row button {
	padding: 6px 16px;
	background: #4caf50;
	color: #fff;
	border: none;
	border-radius: 4px;
}
.tip {
	color: #888;
	font-size: 14px;
	margin-top: 18px;
}
.canvas-center {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #181a1b;
}
.canvas-container {
	background: #232323;
	border-radius: 12px;
	box-shadow: 0 2px 12px #00000044;
	padding: 18px;
	position: relative;
	min-width: 600px;
	min-height: 400px;
	display: flex;
	align-items: center;
	justify-content: center;
}
.empty-tip {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	color: #888;
}
.right-panel {
	width: 340px;
	background: #232323;
	border-left: 1px solid #222;
	display: flex;
	flex-direction: column;
	align-items: stretch;
	padding: 32px 18px 0 18px;
}
.sidebar {
	background: #232323;
	border-radius: 8px;
	padding: 18px;
	box-shadow: 0 2px 8px #00000033;
}
.sidebar h3 {
	margin-bottom: 18px;
	font-size: 18px;
	color: #e0e0e0;
}
.object-item {
	padding: 12px;
	border-bottom: 1px solid #333;
	margin-bottom: 8px;
}
.object-info p {
	color: #b0b0b0;
	margin: 2px 0;
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
.object-actions button:last-child {
	background: #ff4444;
}
.empty-list {
	color: #888;
	text-align: center;
	margin-top: 20px;
}
</style>
