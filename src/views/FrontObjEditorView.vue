<template>
	<div class="canvas-editor">
		<div class="toolbar">
		<input
		 id="image-upload"
		 type="file"
		 accept="image/*"
		 @change="handleImageUpload"
		 style="display: none"
		/>
		<input
		 id="json-upload"
		 type="file"
		 accept="application/json"
		 @change="handleJsonImport"
		 style="display: none"
		/>
		<button @click="clickImport">
		 导入图片
		</button>
		<button @click="clickImportJson">
		 导入对象JSON
		</button>
			<button @click="exportJson" :disabled="!objects.length">
				导出JSON
			</button>
			<span class="zoom-controls" v-if="imageLoaded">
				<button class="zoom-btn" @click="zoomOut">-</button>
				<span class="zoom-label">{{ Math.round(scale * 100) }}%</span>
				<button class="zoom-btn" @click="zoomIn">+</button>
				<button class="zoom-reset" @click="resetZoom">100%</button>
			</span>
			<span class="mouse-position" v-if="imageLoaded">
				鼠标位置: X: {{ mouseX }} , Y: {{ mouseY }}
			</span>
			<span v-if="currentSelectBox">
				前景物名称:
				<input
					v-model="currentObject.name"
					placeholder="输入名称"
					style="width: 140px; margin: 0 8px"
				/>
				遮挡高度:
				<input
					v-model.number="currentObject.occlusionHeight"
					type="number"
					placeholder="输入高度"
					style="width: 90px; margin: 0 8px"
				/>
				<button @click="confirmObject">确认创建</button>
			</span>
		</div>

		<div class="main-content">
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
						<button
							@click="deleteObject(index)"
							style="background: #ff4444; color: white"
						>
							删除
						</button>
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

.zoom-controls {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	background: #f5f5f5;
	padding: 4px 8px;
	border-radius: 4px;
}

.zoom-btn,
.zoom-reset {
	padding: 4px 8px;
	cursor: pointer;
	background: #4caf50;
	color: white;
	border: none;
	border-radius: 4px;
}

.zoom-label {
	min-width: 52px;
	text-align: center;
	color: #555;
	font-size: 13px;
}

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
