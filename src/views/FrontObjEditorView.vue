
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
              <label>锚点(相对):</label>
              <div class="anchor-controls">
                <input v-model.number="currentObject.anchor.x" type="number" placeholder="相对X" style="width: 70px;" />
                <input v-model.number="currentObject.anchor.y" type="number" placeholder="相对Y" style="width: 70px;" />
                <button
                  @click="setAnchorMode"
                  :class="{ active: isSettingAnchor }"
                  class="anchor-mode-btn"
                >
                  {{ isSettingAnchor ? '点击设置锚点' : '在图像上设置' }}
                </button>
              </div>
            </div>
            <div class="form-row" style="flex-direction: column; align-items: flex-start;">
              <label style="margin-bottom: 8px;">占据空间多边形 (相对坐标):</label>
              <div class="edit-mode-toggle">
                <button
                  @click="setEditMode('object')"
                  :class="{ active: polygonEditMode === 'object' }"
                  class="mode-btn"
                >
                  对象编辑
                </button>
                <button
                  @click="setEditMode('polygon')"
                  :class="{ active: polygonEditMode === 'polygon' }"
                  class="mode-btn"
                >
                  多边形绘制
                </button>
              </div>
              <div class="polygon-instructions" v-if="polygonEditMode === 'polygon'">
                <p>• 点击画布添加多边形顶点</p>
                <p>• 右键点击完成当前多边形</p>
                <p>• 至少需要3个点</p>
                <p>• <strong>坐标为相对位置</strong>：(0,0)为对象左上角</p>
                <p>• 移动对象时多边形会跟随移动</p>
              </div>
              <div class="polygon-instructions" v-if="isSettingAnchor">
                <p>• 点击画布设置锚点位置</p>
                <p>• 锚点用青色十字标记</p>
                <p>• 设置完成后自动退出</p>
                <p>• <strong>坐标为相对位置</strong>：(0,0)为对象左上角</p>
              </div>
              <div class="blockslot-editor">
                <div v-if="currentObject.blockSlot && currentObject.blockSlot.length > 0" class="polygon-list">
                  <div v-for="(polygon, pIndex) in currentObject.blockSlot" :key="pIndex" class="polygon-item">
                    <div class="polygon-header">
                      <span>多边形 {{ pIndex + 1 }}</span>
                      <div class="polygon-actions">
                        <button @click="selectPolygon(pIndex)" class="select-btn" :class="{ active: selectedPolygonIndex === pIndex }">选中</button>
                        <button @click="removePolygon(pIndex)" class="remove-btn">删除</button>
                      </div>
                    </div>
                    <div v-for="(point, ptIndex) in polygon" :key="ptIndex" class="point-row">
                      <span>点{{ ptIndex + 1 }}:</span>
                      <input v-model.number="point.x" type="number" placeholder="相对X" />
                      <input v-model.number="point.y" type="number" placeholder="相对Y" />
                      <button @click="removePoint(pIndex, ptIndex)" class="remove-btn">×</button>
                    </div>
                  </div>
                </div>
                <div v-else class="empty-blockslot">暂无占据空间多边形</div>
              </div>
            </div>
            <div class="form-row">
              <button @click="confirmObject">{{ editIndex > -1 ? '确认修改' : '确认创建' }}</button>
              <button @click="cancelEdit" class="cancel-btn" v-if="editIndex > -1 || currentSelectBox">取消</button>
            </div>
            <div class="tip" v-if="editIndex > -1">
              拖拽框内移动 • 拖拽绿点调整大小
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
          <div class="object-list-container">
            <div v-if="!objects.length" class="empty-list">暂无对象</div>
            <div class="object-item" v-for="(obj, index) in objects" :key="index">
              <div class="object-info">
                <p>名称: {{ obj.name || '未命名' }}</p>
                <p>位置: {{ obj.x }},{{ obj.y }} 大小: {{ obj.width }}x{{ obj.height }}</p>
                <p>遮挡高度: {{ obj.occlusionHeight || 0 }}</p>
                <p>锚点(相对): ({{ obj.anchor?.x || 0 }}, {{ obj.anchor?.y || 0 }})</p>
                <p>占据空间: {{ obj.blockSlot?.length || 0 }} 个多边形</p>
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
					occlusionHeight: obj.occlusionHeight || 0,
					blockSlot: obj.blockSlot || [],
					anchor: obj.anchor || { x: 0, y: 0 }
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
	occlusionHeight: 0,
	blockSlot: [], // 多边形数组，描述前景物在地面空间的占据空间
	anchor: { x: 0, y: 0 } // 锚点位置
});
const editIndex = ref(-1);
const mouseX = ref(0);
const mouseY = ref(0);
const minScale = 0.2;
const maxScale = 4;
const scaleStep = 0.1;

// 编辑模式：'create' | 'move' | 'resize-tl' | 'resize-t' | 'resize-tr' | 'resize-r' | 'resize-br' | 'resize-b' | 'resize-bl' | 'resize-l' | null
const editMode = ref(null);
const handleSize = 8; // 手柄大小

// 多边形编辑模式
const polygonEditMode = ref('object'); // 'object' | 'polygon'
const selectedPolygonIndex = ref(-1);
const currentPolygonPoints = ref([]); // 当前正在绘制的多边形的点
const isDrawingPolygon = ref(false);

// 锚点设置模式
const isSettingAnchor = ref(false);

onMounted(() => {
	canvas.value = canvasRef.value;
	ctx.value = canvas.value.getContext('2d');

	// 添加鼠标移动监听器来更新光标样式
	canvas.value.addEventListener('mousemove', (e) => {
		if (!imageLoaded.value || !currentSelectBox.value || isDrawing.value) {
			canvas.value.style.cursor = 'default';
			return;
		}
		const point = getCanvasPoint(e);
		const handle = getHandleAtPosition(point.x, point.y, currentSelectBox.value);
		canvas.value.style.cursor = getCursorStyle(handle);
	});

	// 添加右键菜单监听器来结束多边形绘制
	canvas.value.addEventListener('contextmenu', (e) => {
		e.preventDefault();
		if (polygonEditMode.value === 'polygon' && isDrawingPolygon.value) {
			finishPolygon();
		}
	});

	// 添加键盘监听器来支持ESC键取消多边形绘制
	window.addEventListener('keydown', (e) => {
		if (e.key === 'Escape' && isDrawingPolygon.value) {
			// 取消多边形绘制
			currentPolygonPoints.value = [];
			isDrawingPolygon.value = false;
			redrawCanvas();
		}
	});
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

// 检测点是否在选择框的手柄上
const getHandleAtPosition = (x, y, box) => {
	if (!box) return null;
	const tolerance = handleSize;

	// 检查四个角
	if (Math.abs(x - box.x) <= tolerance && Math.abs(y - box.y) <= tolerance) {
		return 'resize-tl'; // 左上
	}
	if (Math.abs(x - (box.x + box.width)) <= tolerance && Math.abs(y - box.y) <= tolerance) {
		return 'resize-tr'; // 右上
	}
	if (Math.abs(x - box.x) <= tolerance && Math.abs(y - (box.y + box.height)) <= tolerance) {
		return 'resize-bl'; // 左下
	}
	if (Math.abs(x - (box.x + box.width)) <= tolerance && Math.abs(y - (box.y + box.height)) <= tolerance) {
		return 'resize-br'; // 右下
	}

	// 检查四条边
	if (Math.abs(x - box.x) <= tolerance && y > box.y && y < box.y + box.height) {
		return 'resize-l'; // 左
	}
	if (Math.abs(x - (box.x + box.width)) <= tolerance && y > box.y && y < box.y + box.height) {
		return 'resize-r'; // 右
	}
	if (Math.abs(y - box.y) <= tolerance && x > box.x && x < box.x + box.width) {
		return 'resize-t'; // 上
	}
	if (Math.abs(y - (box.y + box.height)) <= tolerance && x > box.x && x < box.x + box.width) {
		return 'resize-b'; // 下
	}

	// 检查是否在框内部
	if (x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height) {
		return 'move';
	}

	return null;
};

// 获取鼠标指针样式
const getCursorStyle = (mode) => {
	const cursorMap = {
		'move': 'move',
		'resize-tl': 'nw-resize',
		'resize-tr': 'ne-resize',
		'resize-bl': 'sw-resize',
		'resize-br': 'se-resize',
		'resize-t': 'n-resize',
		'resize-b': 's-resize',
		'resize-l': 'w-resize',
		'resize-r': 'e-resize'
	};
	return cursorMap[mode] || 'default';
};

const updateMousePosition = (e) => {
	if (!imageLoaded.value) return;

	// 在特殊模式下不更新鼠标位置显示，避免冲突
	if (isSettingAnchor.value || (polygonEditMode.value === 'polygon' && isDrawingPolygon.value)) {
		return;
	}

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
	if (!imageLoaded.value) return;

	// 如果是锚点设置模式
	if (isSettingAnchor.value && currentSelectBox.value) {
		const point = getCanvasPoint(e);
		setAnchorPosition(point.x, point.y);
		return;
	}

	// 如果是多边形绘制模式
	if (polygonEditMode.value === 'polygon' && currentSelectBox.value) {
		const point = getCanvasPoint(e);
		addPolygonPoint(point.x, point.y);
		return;
	}

	// 原有的对象框选逻辑
    if (fMode.value) { return; }
	const point = getCanvasPoint(e);
	const x = point.x;
	const y = point.y;

	// 检查是否点击了现有选择框的手柄或内部
	if (currentSelectBox.value) {
		const handle = getHandleAtPosition(x, y, currentSelectBox.value);
		if (handle) {
			editMode.value = handle;
			isDrawing.value = true;
			startX.value = x;
			startY.value = y;
			// 保存初始状态
			currentObject.value = { ...currentObject.value };
			return;
		}
	}

	// 如果没有点击到选择框，则创建新的选择框
	isDrawing.value = true;
	editMode.value = 'create';
	startX.value = x;
	startY.value = y;
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
		occlusionHeight: 0,
		blockSlot: [],
		anchor: { x: 0, y: 0 } // 锚点初始为相对坐标(0,0)，即对象框左上角
	};
	editIndex.value = -1;
};

const drawing = (e) => {
	// 在锚点设置模式下，显示锚点预览
	if (isSettingAnchor.value && imageLoaded.value) {
		const point = getCanvasPoint(e);
		redrawCanvas();

		// 计算相对坐标用于显示
		let relativeX = point.x;
		let relativeY = point.y;
		if (currentSelectBox.value) {
			relativeX = point.x - currentSelectBox.value.x;
			relativeY = point.y - currentSelectBox.value.y;
		}

		// 绘制锚点预览
		ctx.value.fillStyle = 'rgba(0, 255, 255, 0.5)';
		ctx.value.strokeStyle = '#00ffff';
		ctx.value.lineWidth = 2;

		const anchorSize = 8;
		ctx.value.beginPath();
		ctx.value.moveTo(point.x - anchorSize, point.y);
		ctx.value.lineTo(point.x + anchorSize, point.y);
		ctx.value.moveTo(point.x, point.y - anchorSize);
		ctx.value.lineTo(point.x, point.y + anchorSize);
		ctx.value.stroke();

		ctx.value.beginPath();
		ctx.value.arc(point.x, point.y, 6, 0, Math.PI * 2);
		ctx.value.fill();
		ctx.value.stroke();

		// 显示坐标提示（显示相对坐标）
		ctx.value.fillStyle = '#00ffff';
		ctx.value.font = '12px Arial';
		ctx.value.fillText(`锚点相对位置: (${Math.round(relativeX)}, ${Math.round(relativeY)})`, point.x + 10, point.y - 10);
		return;
	}

	// 在多边形绘制模式下，显示实时预览
	if (polygonEditMode.value === 'polygon' && isDrawingPolygon.value && imageLoaded.value) {
		const point = getCanvasPoint(e);
		redrawCanvas();

		// 绘制从最后一个点到当前鼠标位置的预览线
		if (currentPolygonPoints.value.length > 0 && currentSelectBox.value) {
			const lastPoint = currentPolygonPoints.value[currentPolygonPoints.value.length - 1];
			// 将相对坐标转换为绝对坐标
			const lastAbsPoint = {
				x: lastPoint.x + currentSelectBox.value.x,
				y: lastPoint.y + currentSelectBox.value.y
			};
			ctx.value.strokeStyle = '#ffff00';
			ctx.value.lineWidth = 2;
			ctx.value.setLineDash([5, 5]);
			ctx.value.beginPath();
			ctx.value.moveTo(lastAbsPoint.x, lastAbsPoint.y);
			ctx.value.lineTo(point.x, point.y);
			ctx.value.stroke();
			ctx.value.setLineDash([]);
		}
		return;
	}

	if (!isDrawing.value || !imageLoaded.value) return;
	const point = getCanvasPoint(e);
	const currentX = point.x;
	const currentY = point.y;
	const dx = currentX - startX.value;
	const dy = currentY - startY.value;

	ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height);
	ctx.value.drawImage(image.value, 0, 0);

	// 根据编辑模式执行不同的操作
	if (editMode.value === 'create') {
		// 创建新框模式
		const x = Math.min(startX.value, currentX);
		const y = Math.min(startY.value, currentY);
		const width = Math.abs(currentX - startX.value);
		const height = Math.abs(currentY - startY.value);

		currentSelectBox.value = { x, y, width, height };
		currentObject.value.x = x;
		currentObject.value.y = y;
		currentObject.value.width = width;
		currentObject.value.height = height;
	} else if (editMode.value === 'move') {
		// 移动模式
		const newX = currentObject.value.x + dx;
		const newY = currentObject.value.y + dy;

		currentSelectBox.value.x = newX;
		currentSelectBox.value.y = newY;
		currentObject.value.x = newX;
		currentObject.value.y = newY;

		startX.value = currentX;
		startY.value = currentY;
	} else if (editMode.value && editMode.value.startsWith('resize-')) {
		// 调整大小模式
		const direction = editMode.value.replace('resize-', '');
		const obj = currentObject.value;
		const box = currentSelectBox.value;

		// 根据方向调整不同的边
		if (direction.includes('l')) {
			// 调整左边
			const newWidth = obj.width - dx;
			if (newWidth > 5) {
				obj.x = obj.x + dx;
				obj.width = newWidth;
			}
		}
		if (direction.includes('r')) {
			// 调整右边
			const newWidth = dx + obj.width;
			if (newWidth > 5) {
				obj.width = newWidth;
			}
		}
		if (direction.includes('t')) {
			// 调整上边
			const newHeight = obj.height - dy;
			if (newHeight > 5) {
				obj.y = obj.y + dy;
				obj.height = newHeight;
			}
		}
		if (direction.includes('b')) {
			// 调整下边
			const newHeight = dy + obj.height;
			if (newHeight > 5) {
				obj.height = newHeight;
			}
		}

		box.x = obj.x;
		box.y = obj.y;
		box.width = obj.width;
		box.height = obj.height;

		startX.value = currentX;
		startY.value = currentY;
	}

	// 绘制选择框和手柄
	drawSelectionBox();
};

const endDraw = () => {
	// 在特殊模式下，不执行原有的逻辑
	if (polygonEditMode.value === 'polygon' || isSettingAnchor.value) return;

    if (fMode.value) { return; }
	if (!isDrawing.value) return;
	isDrawing.value = false;

	// 如果是创建模式且框太小，则取消
	if (editMode.value === 'create' && currentSelectBox.value.width < 5 && currentSelectBox.value.height < 5) {
		currentSelectBox.value = null;
		currentObject.value = {
			name: '',
			x: 0,
			y: 0,
			width: 0,
			height: 0,
			occlusionHeight: 0,
			blockSlot: [],
			anchor: { x: 0, y: 0 }
		};
		editIndex.value = -1;
	}

	editMode.value = null;
};

// 绘制选择框和手柄
const drawSelectionBox = () => {
	if (!currentSelectBox.value) return;

	const box = currentSelectBox.value;

	// 绘制选择框
	ctx.value.strokeStyle = '#ff0000';
	ctx.value.lineWidth = 2;
	ctx.value.strokeRect(box.x, box.y, box.width, box.height);

	// 绘制调整手柄
	ctx.value.fillStyle = '#00ff00';
	const handleRadius = handleSize;

	// 四个角
	ctx.value.beginPath();
	ctx.value.arc(box.x, box.y, handleRadius, 0, Math.PI * 2); // 左上
	ctx.value.fill();

	ctx.value.beginPath();
	ctx.value.arc(box.x + box.width, box.y, handleRadius, 0, Math.PI * 2); // 右上
	ctx.value.fill();

	ctx.value.beginPath();
	ctx.value.arc(box.x, box.y + box.height, handleRadius, 0, Math.PI * 2); // 左下
	ctx.value.fill();

	ctx.value.beginPath();
	ctx.value.arc(box.x + box.width, box.y + box.height, handleRadius, 0, Math.PI * 2); // 右下
	ctx.value.fill();

	// 四条边的中点
	ctx.value.beginPath();
	ctx.value.arc(box.x + box.width / 2, box.y, handleRadius, 0, Math.PI * 2); // 上
	ctx.value.fill();

	ctx.value.beginPath();
	ctx.value.arc(box.x + box.width / 2, box.y + box.height, handleRadius, 0, Math.PI * 2); // 下
	ctx.value.fill();

	ctx.value.beginPath();
	ctx.value.arc(box.x, box.y + box.height / 2, handleRadius, 0, Math.PI * 2); // 左
	ctx.value.fill();

	ctx.value.beginPath();
	ctx.value.arc(box.x + box.width, box.y + box.height / 2, handleRadius, 0, Math.PI * 2); // 右
	ctx.value.fill();

	// 绘制锚点
	if (currentObject.value.anchor && currentSelectBox.value) {
		// 将相对坐标转换为绝对坐标
		const anchor = {
			x: currentObject.value.anchor.x + currentSelectBox.value.x,
			y: currentObject.value.anchor.y + currentSelectBox.value.y
		};
		ctx.value.fillStyle = '#00ffff'; // 青色锚点
		ctx.value.strokeStyle = '#008888';
		ctx.value.lineWidth = 2;

		// 绘制锚点（十字形）
		const anchorSize = 8;
		ctx.value.beginPath();
		ctx.value.moveTo(anchor.x - anchorSize, anchor.y);
		ctx.value.lineTo(anchor.x + anchorSize, anchor.y);
		ctx.value.moveTo(anchor.x, anchor.y - anchorSize);
		ctx.value.lineTo(anchor.x, anchor.y + anchorSize);
		ctx.value.stroke();

		// 绘制锚点圆圈
		ctx.value.beginPath();
		ctx.value.arc(anchor.x, anchor.y, 6, 0, Math.PI * 2);
		ctx.value.fill();
		ctx.value.stroke();

		// 锚点标签
		ctx.value.fillStyle = '#00ffff';
		ctx.value.font = 'bold 12px Arial';
		ctx.value.fillText('锚点', anchor.x + 10, anchor.y - 10);
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
	// 在多边形绘制模式下，不设置遮挡高度
	if (polygonEditMode.value === 'polygon') return;
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

	// 如果正在绘制多边形，先完成它
	if (isDrawingPolygon.value) {
		finishPolygon();
	}

	if (editIndex.value > -1) {
		objects.value[editIndex.value] = { ...currentObject.value };
		editIndex.value = -1;
	} else {
		objects.value.push({ ...currentObject.value });
	}

	// 清除选择框和重置状态
	currentSelectBox.value = null;
	currentObject.value = {
		name: '',
		x: 0,
		y: 0,
		width: 0,
		height: 0,
		occlusionHeight: 0,
		blockSlot: [],
		anchor: { x: 0, y: 0 }
	};
	editMode.value = null;
	selectedPolygonIndex.value = -1;
	currentPolygonPoints.value = [];
	isDrawingPolygon.value = false;
	polygonEditMode.value = 'object';
	isSettingAnchor.value = false;

	// 重绘
	ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height);
	ctx.value.drawImage(image.value, 0, 0);
};

const editObject = (index) => {
	const obj = objects.value[index];
	currentObject.value = { ...obj };
	editIndex.value = index;
	currentSelectBox.value = {
		x: obj.x,
		y: obj.y,
		width: obj.width,
		height: obj.height
	};
	// 重置多边形绘制和锚点设置状态
	selectedPolygonIndex.value = -1;
	currentPolygonPoints.value = [];
	isDrawingPolygon.value = false;
	polygonEditMode.value = 'object';
	isSettingAnchor.value = false;

	// 重绘以显示手柄、多边形和锚点
	redrawCanvas();
};

const deleteObject = (index) => {
	objects.value.splice(index, 1);
	if (index === editIndex.value) {
		editIndex.value = -1;
		currentSelectBox.value = null;
		editMode.value = null;
		currentObject.value = {
			name: '',
			x: 0,
			y: 0,
			width: 0,
			height: 0,
			occlusionHeight: 0,
			blockSlot: [],
			anchor: { x: 0, y: 0 }
		};
		// 重绘
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

const cancelEdit = () => {
	if (editIndex.value > -1) {
		// 如果正在编辑对象，恢复原始值
		const obj = objects.value[editIndex.value];
		currentObject.value = { ...obj };
		currentSelectBox.value = {
			x: obj.x,
			y: obj.y,
			width: obj.width,
			height: obj.height
		};
	} else {
		// 如果是新创建的框，清除它
		currentSelectBox.value = null;
		currentObject.value = {
			name: '',
			x: 0,
			y: 0,
			width: 0,
			height: 0,
			occlusionHeight: 0,
			blockSlot: [],
			anchor: { x: 0, y: 0 }
		};
	}
	editMode.value = null;
	// 重绘
	ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height);
	ctx.value.drawImage(image.value, 0, 0);
	if (currentSelectBox.value) {
		drawSelectionBox();
	}
};

// BlockSlot 多边形管理函数
const addPolygon = () => {
	if (!currentObject.value.blockSlot) {
		currentObject.value.blockSlot = [];
	}
	// 添加一个默认的三角形多边形
	currentObject.value.blockSlot.push([
		{ x: currentObject.value.x, y: currentObject.value.y },
		{ x: currentObject.value.x + 20, y: currentObject.value.y },
		{ x: currentObject.value.x + 10, y: currentObject.value.y + 20 }
	]);
};

const removePolygon = (index) => {
	if (currentObject.value.blockSlot && currentObject.value.blockSlot.length > index) {
		currentObject.value.blockSlot.splice(index, 1);
		if (selectedPolygonIndex.value === index) {
			selectedPolygonIndex.value = -1;
		}
	}
};

// 选择多边形
const selectPolygon = (index) => {
	selectedPolygonIndex.value = index;
};

// 设置编辑模式
const setEditMode = (mode) => {
	polygonEditMode.value = mode;
	if (mode === 'object') {
		// 切换回对象编辑模式时，结束多边形绘制和锚点设置
		if (isDrawingPolygon.value) {
			finishPolygon();
		}
		isSettingAnchor.value = false;
	}
};

// 设置锚点模式
const setAnchorMode = () => {
	if (!currentSelectBox.value) {
		alert('请先框选一个对象');
		return;
	}
	isSettingAnchor.value = !isSettingAnchor.value;
	// 如果开启锚点设置模式，关闭多边形绘制模式
	if (isSettingAnchor.value) {
		polygonEditMode.value = 'object';
		if (isDrawingPolygon.value) {
			finishPolygon();
		}
	}
	// 重绘画布以显示锚点设置提示
	redrawCanvas();
};

// 设置锚点位置
const setAnchorPosition = (x, y) => {
	if (!currentObject.value.anchor) {
		currentObject.value.anchor = { x: 0, y: 0 };
	}
	// 计算相对于对象框的锚点位置
	if (currentSelectBox.value) {
		currentObject.value.anchor.x = Math.round(x - currentSelectBox.value.x);
		currentObject.value.anchor.y = Math.round(y - currentSelectBox.value.y);
	} else {
		currentObject.value.anchor.x = Math.round(x);
		currentObject.value.anchor.y = Math.round(y);
	}

	// 设置完锚点后自动关闭锚点设置模式
	isSettingAnchor.value = false;

	// 重绘画布
	redrawCanvas();
};

// 添加多边形点
const addPolygonPoint = (x, y) => {
	// 计算相对于对象框的坐标
	let relativeX, relativeY;
	if (currentSelectBox.value) {
		relativeX = x - currentSelectBox.value.x;
		relativeY = y - currentSelectBox.value.y;
	} else {
		relativeX = x;
		relativeY = y;
	}

	if (!isDrawingPolygon.value) {
		// 开始新的多边形
		isDrawingPolygon.value = true;
		currentPolygonPoints.value = [{ x: relativeX, y: relativeY }];
	} else {
		// 添加点到当前多边形
		currentPolygonPoints.value.push({ x: relativeX, y: relativeY });
	}
	// 重绘以显示新的点和线
	redrawCanvas();
};

// 完成多边形绘制
const finishPolygon = () => {
	if (currentPolygonPoints.value.length < 3) {
		alert('多边形至少需要3个点');
		return;
	}

	if (!currentObject.value.blockSlot) {
		currentObject.value.blockSlot = [];
	}

	// 添加完成的多边形
	currentObject.value.blockSlot.push([...currentPolygonPoints.value]);

	// 重置绘制状态
	currentPolygonPoints.value = [];
	isDrawingPolygon.value = false;
	selectedPolygonIndex.value = currentObject.value.blockSlot.length - 1;

	// 重绘画布
	redrawCanvas();
};

// 重绘画布
const redrawCanvas = () => {
	ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height);
	ctx.value.drawImage(image.value, 0, 0);

	// 绘制选择框
	if (currentSelectBox.value) {
		drawSelectionBox();
	}

	// 绘制多边形
	if (currentSelectBox.value && currentObject.value.blockSlot) {
		drawPolygons();
	}

	// 绘制当前正在绘制的多边形
	if (isDrawingPolygon.value && currentPolygonPoints.value.length > 0) {
		drawCurrentPolygon();
	}
};

// 绘制所有多边形
const drawPolygons = () => {
	if (!currentSelectBox.value) return;

	const offsetX = currentSelectBox.value.x;
	const offsetY = currentSelectBox.value.y;

	currentObject.value.blockSlot.forEach((polygon, index) => {
		const isSelected = index === selectedPolygonIndex.value;

		// 设置样式
		ctx.value.strokeStyle = isSelected ? '#00ff00' : '#ff00ff';
		ctx.value.lineWidth = isSelected ? 3 : 2;
		ctx.value.fillStyle = isSelected ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 255, 0.1)';

		// 将相对坐标转换为绝对坐标并绘制多边形
		ctx.value.beginPath();
		const firstPoint = { x: polygon[0].x + offsetX, y: polygon[0].y + offsetY };
		ctx.value.moveTo(firstPoint.x, firstPoint.y);
		for (let i = 1; i < polygon.length; i++) {
			const absPoint = { x: polygon[i].x + offsetX, y: polygon[i].y + offsetY };
			ctx.value.lineTo(absPoint.x, absPoint.y);
		}
		ctx.value.closePath();
		ctx.value.fill();
		ctx.value.stroke();

		// 绘制顶点
		polygon.forEach((point, i) => {
			const absPoint = { x: point.x + offsetX, y: point.y + offsetY };
			ctx.value.fillStyle = isSelected ? '#00ff00' : '#ff00ff';
			ctx.value.beginPath();
			ctx.value.arc(absPoint.x, absPoint.y, 4, 0, Math.PI * 2);
			ctx.value.fill();

			// 顶点编号
			ctx.value.fillStyle = '#ffffff';
			ctx.value.font = '10px Arial';
			ctx.value.fillText(i + 1, absPoint.x + 6, absPoint.y - 6);
		});
	});
};

// 绘制当前正在绘制的多边形
const drawCurrentPolygon = () => {
	const points = currentPolygonPoints.value;
	if (!currentSelectBox.value) return;

	const offsetX = currentSelectBox.value.x;
	const offsetY = currentSelectBox.value.y;

	// 设置样式
	ctx.value.strokeStyle = '#ffff00';
	ctx.value.lineWidth = 2;
	ctx.value.fillStyle = 'rgba(255, 255, 0, 0.1)';

	// 绘制已有的线段（将相对坐标转换为绝对坐标）
	if (points.length > 1) {
		ctx.value.beginPath();
		const firstPoint = { x: points[0].x + offsetX, y: points[0].y + offsetY };
		ctx.value.moveTo(firstPoint.x, firstPoint.y);
		for (let i = 1; i < points.length; i++) {
			const absPoint = { x: points[i].x + offsetX, y: points[i].y + offsetY };
			ctx.value.lineTo(absPoint.x, absPoint.y);
		}
		ctx.value.stroke();
	}

	// 绘制顶点（将相对坐标转换为绝对坐标）
	points.forEach((point, i) => {
		const absPoint = { x: point.x + offsetX, y: point.y + offsetY };
		ctx.value.fillStyle = '#ffff00';
		ctx.value.beginPath();
		ctx.value.arc(absPoint.x, absPoint.y, 4, 0, Math.PI * 2);
		ctx.value.fill();

		// 顶点编号
		ctx.value.fillStyle = '#ffffff';
		ctx.value.font = '10px Arial';
		ctx.value.fillText(i + 1, absPoint.x + 6, absPoint.y - 6);
	});
};

const addPoint = (polygonIndex) => {
	if (currentObject.value.blockSlot && currentObject.value.blockSlot[polygonIndex]) {
		const polygon = currentObject.value.blockSlot[polygonIndex];
		// 添加一个新的点，位置基于最后一个点
		const lastPoint = polygon[polygon.length - 1] || { x: currentObject.value.x, y: currentObject.value.y };
		polygon.push({ x: lastPoint.x + 10, y: lastPoint.y + 10 });
	}
};

const removePoint = (polygonIndex, pointIndex) => {
	if (currentObject.value.blockSlot && currentObject.value.blockSlot[polygonIndex]) {
		const polygon = currentObject.value.blockSlot[polygonIndex];
		if (polygon.length > 3) { // 至少保留3个点以形成多边形
			polygon.splice(pointIndex, 1);
		} else {
			alert('多边形至少需要3个点');
		}
	}
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
.form-row .cancel-btn {
	background: #666;
}
.form-row .cancel-btn:hover {
	background: #777;
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
.object-list-container {
	max-height: calc(100vh - 220px);
	overflow-y: auto;
	padding-right: 8px;
}
/* 自定义滚动条样式 */
.object-list-container::-webkit-scrollbar {
	width: 8px;
}
.object-list-container::-webkit-scrollbar-track {
	background: #333;
	border-radius: 4px;
}
.object-list-container::-webkit-scrollbar-thumb {
	background: #555;
	border-radius: 4px;
}
.object-list-container::-webkit-scrollbar-thumb:hover {
	background: #666;
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
/* BlockSlot 编辑器样式 */
.blockslot-editor {
	width: 100%;
	background: #181a1b;
	border-radius: 4px;
	padding: 10px;
	border: 1px solid #333;
}
.polygon-list {
	max-height: 200px;
	overflow-y: auto;
}
.polygon-item {
	background: #2a2a2a;
	border-radius: 4px;
	padding: 8px;
	margin-bottom: 8px;
	border: 1px solid #444;
}
.polygon-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 8px;
	font-size: 13px;
	color: #b0b0b0;
	font-weight: 500;
}
.polygon-header button {
	background: #ff4444;
}
.point-row {
	display: flex;
	align-items: center;
	gap: 6px;
	margin-bottom: 4px;
}
.point-row span {
	color: #888;
	font-size: 12px;
	min-width: 50px;
}
.point-row input {
	background: #181a1b;
	border: 1px solid #444;
	color: #e0e0e0;
	border-radius: 3px;
	padding: 3px 6px;
	font-size: 12px;
	width: 60px;
}
.remove-btn {
	background: #ff4444 !important;
	color: white !important;
	border: none;
	border-radius: 3px;
	cursor: pointer;
	padding: 2px 6px;
	font-size: 12px;
}
.remove-btn:hover {
	background: #ff6666 !important;
}
.add-point-btn {
	background: #4caf50;
	color: white;
	border: none;
	border-radius: 3px;
	cursor: pointer;
	padding: 3px 8px;
	font-size: 12px;
	margin-top: 4px;
}
.add-point-btn:hover {
	background: #5cb860;
}
.add-polygon-btn {
	background: #2a3a4a;
	color: #e0e0e0;
	border: none;
	border-radius: 3px;
	cursor: pointer;
	padding: 4px 12px;
	font-size: 13px;
	margin-top: 8px;
	width: 100%;
}
.add-polygon-btn:hover {
	background: #3a4a5a;
}
.empty-blockslot {
	text-align: center;
	padding: 16px;
	border: 1px dashed #444;
	border-radius: 4px;
	color: #888;
}
/* 自定义滚动条 */
.polygon-list::-webkit-scrollbar {
	width: 6px;
}
.polygon-list::-webkit-scrollbar-track {
	background: #333;
	border-radius: 3px;
}
.polygon-list::-webkit-scrollbar-thumb {
	background: #555;
	border-radius: 3px;
}
.polygon-list::-webkit-scrollbar-thumb:hover {
	background: #666;
}
/* 多边形编辑模式切换按钮 */
.edit-mode-toggle {
	display: flex;
	gap: 8px;
	margin-bottom: 12px;
	width: 100%;
}
.mode-btn {
	flex: 1;
	padding: 6px 12px;
	background: #2a3a4a;
	color: #e0e0e0;
	border: 1px solid #444;
	border-radius: 4px;
	cursor: pointer;
	font-size: 13px;
	transition: all 0.2s;
}
.mode-btn:hover {
	background: #3a4a5a;
}
.mode-btn.active {
	background: #4caf50;
	border-color: #4caf50;
	color: white;
	font-weight: 500;
}
/* 多边形绘制说明 */
.polygon-instructions {
	background: #1a1a1a;
	border-radius: 4px;
	padding: 8px 12px;
	margin-bottom: 12px;
	border-left: 3px solid #4caf50;
}
.polygon-instructions p {
	margin: 4px 0;
	font-size: 12px;
	color: #b0b0b0;
	line-height: 1.4;
}
.polygon-instructions p {
	margin: 4px 0;
	font-size: 12px;
	color: #b0b0b0;
	line-height: 1.4;
}
/* 多边形操作按钮 */
.polygon-actions {
	display: flex;
	gap: 6px;
}
.select-btn {
	background: #2a3a4a !important;
	color: #e0e0e0 !important;
	border: none;
	border-radius: 3px;
	cursor: pointer;
	padding: 2px 6px;
	font-size: 12px;
}
.select-btn:hover {
	background: #3a4a5a !important;
}
.select-btn.active {
	background: #4caf50 !important;
	color: white !important;
}
/* 锚点控制样式 */
.anchor-controls {
	display: flex;
	align-items: center;
	gap: 8px;
	flex: 1;
}
.anchor-mode-btn {
	background: #2a3a4a;
	color: #e0e0e0;
	border: 1px solid #444;
	border-radius: 4px;
	cursor: pointer;
	padding: 4px 8px;
	font-size: 12px;
	white-space: nowrap;
	transition: all 0.2s;
}
.anchor-mode-btn:hover {
	background: #3a4a5a;
}
.anchor-mode-btn.active {
	background: #00aaaa;
	border-color: #00aaaa;
	color: white;
	font-weight: 500;
	animation: pulse 1.5s infinite;
}
@keyframes pulse {
	0%, 100% {
		opacity: 1;
	}
	50% {
		opacity: 0.7;
	}
}
</style>
