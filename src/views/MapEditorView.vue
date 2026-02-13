<template>
    <div class="map-editor">
        <!-- 顶部工具栏 -->
        <div class="toolbar">
            <div class="toolbar-section">
                <button @click="newMap" class="btn btn-success" title="新建地图（清除自动保存）">新建地图</button>
                <button @click="loadMapImage" class="btn btn-primary">加载地图图片</button>
                <input ref="fileInput" type="file" accept="image/*" style="display: none" @change="handleFileSelect" />
                <button @click="importTMJ" class="btn btn-primary">导入地图(TMJ)</button>
                <input ref="tmjFileInput" type="file" accept=".tmj,.json" style="display: none"
                    @change="handleTMJImport" />
                <button @click="toggleGrid" class="btn">{{ showGrid ? '隐藏网格' : '显示网格' }}</button>
                <button @click="clearCanvas" class="btn btn-warning">清空画布</button>
                <span class="toolbar-separator">|</span>
                <button @click="undo" :disabled="currentHistoryIndex <= 0" class="btn" title="撤回 (Ctrl+Z)">
                    ↶ 撤回
                </button>
                <button @click="redo" :disabled="currentHistoryIndex >= historyStack.length - 1" class="btn"
                    title="重做 (Ctrl+Y)">
                    ↷ 重做
                </button>
            </div>

            <div class="toolbar-section">
                <span class="toolbar-label">编辑模式：</span>
                <button @click="setMode('unit')" :class="['btn', currentMode === 'unit' ? 'btn-active' : '']">
                    放置单位
                </button>
                <button @click="setMode('wall')" :class="['btn', currentMode === 'wall' ? 'btn-active' : '']">
                    绘制墙体
                </button>
                <button @click="setMode('door')" :class="['btn', currentMode === 'door' ? 'btn-active' : '']">
                    绘制门
                </button>
                <button @click="setMode('select')" :class="['btn', currentMode === 'select' ? 'btn-active' : '']">
                    选择/删除
                </button>
            </div>

            <div class="toolbar-section">
                <button @click="exportMapData" class="btn btn-success">导出地图(TMJ)</button>
                <input v-model="mapName" placeholder="地图名称" class="input-text" />
            </div>

            <div class="toolbar-section zoom-controls">
                <span class="toolbar-label">缩放:</span>
                <button @click="zoomOut" class="btn btn-sm">-</button>
                <span class="zoom-display">{{ zoomPercent }}%</span>
                <button @click="zoomIn" class="btn btn-sm">+</button>
                <button @click="resetZoom" class="btn btn-sm">重置</button>
            </div>
        </div>

        <!-- 左侧单位选择面板 -->
        <div class="sidebar" v-if="currentMode === 'unit'">
            <h3>选择单位类型</h3>
            <div v-for="unitType in unitTypes" :key="unitType" @click="selectUnitType(unitType)"
                :class="['unit-item', selectedUnitType === unitType ? 'selected' : '']">
                {{ unitType }}
            </div>
            <div class="unit-properties">
                <h4>单位属性</h4>
                <label>
                    名称: <input v-model="unitName" type="text" class="input-text" placeholder="单位名称" />
                </label>
                <label>
                    阵营: <input v-model="unitParty" type="text" class="input-text"
                        placeholder="如: player, enemy, neutral" />
                </label>
                <label>
                    方向:
                    <select v-model="unitDirection" class="input-text">
                        <option :value="0">上</option>
                        <option :value="1">右</option>
                        <option :value="2">下</option>
                        <option :value="3">左</option>
                    </select>
                </label>
                <label>
                    <input v-model="unitFriendly" type="checkbox" />
                    友好
                </label>
                <label>
                    选择组:
                    <input v-model="unitSelectionGroup" type="text" class="input-text" placeholder="如: bossWave" />
                </label>
                <label>
                    <input v-model="unitIsSceneHidden" type="checkbox" />
                    隐藏在场景 (isSceneHidden)
                </label>
            </div>
        </div>

        <!-- 选中单位属性编辑面板 -->
        <div class="sidebar" v-if="currentMode === 'select' && selectedObject && selectedObject.type === 'unit'">
            <h3>编辑单位属性</h3>
            <div class="unit-properties">
                <label>
                    名称: <input v-model="editingUnitName" type="text" class="input-text" placeholder="单位名称" />
                </label>
                <label>
                    阵营: <input v-model="editingUnitParty" type="text" class="input-text"
                        placeholder="如: player, enemy, neutral" />
                </label>
                <label>
                    方向:
                    <select v-model="editingUnitDirection" class="input-text">
                        <option :value="0">上</option>
                        <option :value="1">右</option>
                        <option :value="2">下</option>
                        <option :value="3">左</option>
                    </select>
                </label>
                <label>
                    <input v-model="editingUnitFriendly" type="checkbox" />
                    友好
                </label>
                <label>
                    选择组:
                    <input v-model="editingUnitSelectionGroup" type="text" class="input-text" placeholder="如: bossWave" />
                </label>
                <label>
                    <input v-model="editingUnitHidden" type="checkbox" />
                    隐藏在场景 (isSceneHidden)
                </label>
                <button @click="applyUnitPropertyChanges" class="btn btn-primary"
                    style="margin-top: 10px; width: 100%;">应用更改</button>
            </div>
        </div>

        <!-- 选中墙体/门属性编辑面板 -->
        <div class="sidebar" v-if="currentMode === 'select' && selectedObject && (selectedObject.type === 'wall' || selectedObject.type === 'door')">
            <h3>编辑{{ selectedObject.type === 'wall' ? '墙体' : '门' }}属性</h3>
            
            <div class="unit-properties">
                <label>
                    <input type="checkbox" v-model="editingOnlyVisition" />
                    仅视野阻挡 (onlyVisition)
                </label>
                <p style="font-size: 11px; color: #888; margin: 5px 0 15px 20px;">
                    勾选后只阻挡视野，不阻挡移动
                </p>
                
                <label>
                    <input type="checkbox" v-model="editingOnlyBlock" />
                    仅移动阻挡 (onlyBlock)
                </label>
                <p style="font-size: 11px; color: #888; margin: 5px 0 15px 20px;">
                    勾选后只阻挡移动，不阻挡视野
                </p>
                
                <button @click="applyWallDoorPropertyChanges" class="btn btn-primary" style="margin-top: 15px; width: 100%;">
                    应用更改
                </button>
            </div>
        </div>

        <!-- 绘制模式提示 -->
        <div class="draw-hints" v-if="currentMode === 'wall' || currentMode === 'door'">
            <div class="hint-box">
                <p><strong>{{ currentMode === 'wall' ? '墙体' : '门' }}绘制模式</strong></p>
                <p>点击地图添加点，双击或按ESC完成绘制</p>
                <p v-if="drawingPoints.length > 0">当前点数: {{ drawingPoints.length }}</p>
                <button @click="finishDrawing" class="btn btn-sm">完成绘制</button>
                <button @click="cancelDrawing" class="btn btn-sm btn-warning">取消</button>
            </div>
        </div>

        <!-- 画布容器 -->
        <div ref="canvasContainer" class="canvas-container with-sidebar">
        </div>

        <!-- 底部信息栏 -->
        <div class="status-bar">
            <span>模式: {{ getModeText() }}</span>
            <span v-if="selectedUnitType && currentMode === 'unit'">当前单位: {{ selectedUnitType }}</span>
            <span>鼠标位置: ({{ mouseX }}, {{ mouseY }})</span>
            <span>网格位置: ({{ Math.floor(mouseX / gridSize) }}, {{ Math.floor(mouseY / gridSize) }})</span>
            <span>对象数: {{ objectCount }}</span>
            <span v-if="historyStack.length > 0">
                历史: {{ currentHistoryIndex + 1 }}/{{ historyStack.length }}
            </span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import * as PIXI from 'pixi.js';
import { getAnimMetaJsonFile, getAnimSpriteImgUrl, getAnimActionSpriteJsonFile } from '@/utils/utils';
import { AnimMetaJson } from '@/core/anim/AnimMetaJson';
import { UnitAnimSpirite } from '@/core/anim/UnitAnimSprite';
import * as envSetting from '@/core/envSetting';

// 配置
const gridSize = 64;
const defaultCanvasWidth = 1536;
const defaultCanvasHeight = 1920;
const showGrid = ref(true);
const mapName = ref('custom_map');
const currentMode = ref<'unit' | 'wall' | 'door' | 'select'>('unit');
const zoomLevel = ref(1);
const minZoom = 0.25;
const maxZoom = 3;
const zoomStep = 0.1;

// PIXI应用相关
let app: PIXI.Application;
let mapSprite: PIXI.Sprite | null = null;
let worldContainer: PIXI.Container;
let gridContainer: PIXI.Container;
let objectsContainer: PIXI.Container;
let previewGraphics: PIXI.Graphics;
let wheelListener: ((event: WheelEvent) => void) | null = null;

// 单位相关
const unitTypes = ['skeleton', 'wolf', 'manFighter', 'skeletonArcher', 'oldCleric', 'dragonCleric', 'bigSkeleton'];
const selectedUnitType = ref('skeleton');
const unitName = ref('');
const unitParty = ref('player');
const unitDirection = ref(2);
const unitFriendly = ref(false);
const unitSelectionGroup = ref('');
const unitIsSceneHidden = ref(false);

// 编辑选中单位的属性
const editingUnitName = ref('');
const editingUnitParty = ref('player');
const editingUnitDirection = ref(2);
const editingUnitFriendly = ref(false);
const editingUnitSelectionGroup = ref('');
const editingUnitHidden = ref(false);

// 编辑选中墙体/门的属性
const editingOnlyVisition = ref(false);
const editingOnlyBlock = ref(false);

// 绘制相关
const drawingPoints = ref<{ x: number, y: number }[]>([]);
const currentDrawingGraphics = ref<PIXI.Graphics | null>(null);

// 鼠标位置
const mouseX = ref(0);
const mouseY = ref(0);

// 数据存储
const placedUnits = ref<any[]>([]);
const wallObjects = ref<any[]>([]);
const doorObjects = ref<any[]>([]);
let nextObjectId = 1;

// 历史记录（撤回/重做）
const historyStack = ref<any[]>([]);
const currentHistoryIndex = ref(-1);
const maxHistorySize = 50; // 最多保存50步历史

// 单位精灵数据缓存（存储 spritesheet 而不是精灵实例）
const unitSpriteDataCache = new Map<string, { textures: PIXI.Texture[], scale: number, visualSize: number, frameSize: number }>();

// 选中和拖动相关
const selectedObject = ref<any>(null);
const selectedContainer = ref<PIXI.Container | null>(null);
const isDragging = ref(false);
const dragOffset = { x: 0, y: 0 };

// 文件输入
const fileInput = ref<HTMLInputElement | null>(null);
const tmjFileInput = ref<HTMLInputElement | null>(null);
const canvasContainer = ref<HTMLDivElement | null>(null);

// 计算对象总数
const objectCount = computed(() => {
    return placedUnits.value.length + wallObjects.value.length + doorObjects.value.length;
});

const zoomPercent = computed(() => Math.round(zoomLevel.value * 100));

const zoomIn = () => {
    const center = getViewportCenter();
    applyZoom(zoomLevel.value + zoomStep, center?.x, center?.y);
};

const zoomOut = () => {
    const center = getViewportCenter();
    applyZoom(zoomLevel.value - zoomStep, center?.x, center?.y);
};

const resetZoom = () => {
    resetViewTransform();
};

// 自动保存编辑状态到 localStorage
const saveEditorState = () => {
    try {
        const state = {
            placedUnits: placedUnits.value,
            wallObjects: wallObjects.value,
            doorObjects: doorObjects.value,
            nextObjectId: nextObjectId,
            mapName: mapName.value,
            timestamp: Date.now()
        };
        localStorage.setItem('mapEditorState', JSON.stringify(state));
        console.log('编辑状态已自动保存');
    } catch (error) {
        console.error('保存编辑状态失败:', error);
    }
};

// 从 localStorage 恢复编辑状态
const loadEditorState = async () => {
    try {
        const savedState = localStorage.getItem('mapEditorState');
        if (!savedState) return false;

        const state = JSON.parse(savedState);
        
        // 恢复数据
        placedUnits.value = state.placedUnits || [];
        wallObjects.value = state.wallObjects || [];
        doorObjects.value = state.doorObjects || [];
        nextObjectId = state.nextObjectId || 1;
        mapName.value = state.mapName || 'custom_map';

        // 重建视觉元素
        // 重建单位
        for (const unit of placedUnits.value) {
            const unitTypeProp = unit.properties?.find((p: any) => p.name === 'unitTypeName');
            const unitTypeName = unitTypeProp?.value || 'skeleton';
            await createUnitVisual(unit, unitTypeName);
        }

        // 重建墙体
        for (const wall of wallObjects.value) {
            createWallVisual(wall);
        }

        // 重建门
        for (const door of doorObjects.value) {
            createDoorVisual(door);
        }

        console.log('已恢复上次编辑状态');
        return true;
    } catch (error) {
        console.error('恢复编辑状态失败:', error);
        return false;
    }
};

// 清除保存的编辑状态
const clearEditorState = () => {
    localStorage.removeItem('mapEditorState');
    console.log('编辑状态已清除');
};

// 新建地图
const newMap = () => {
    if (confirm('确定要新建地图吗？当前编辑内容将被清除。')) {
        // 清空所有内容
        placedUnits.value = [];
        wallObjects.value = [];
        doorObjects.value = [];
        objectsContainer.removeChildren();
        if (mapSprite) {
            mapSprite.destroy();
            mapSprite = null;
        }
        syncCanvasSizeWithMap();
        resetViewTransform();
        nextObjectId = 1;
        mapName.value = 'custom_map';
        
        // 清除自动保存的状态
        clearEditorState();
        
        // 清空历史记录并保存初始状态
        historyStack.value = [];
        currentHistoryIndex.value = -1;
        saveHistory();
        
        console.log('已新建地图');
    }
};

onMounted(async () => {
    // 初始化PIXI应用
    app = new PIXI.Application();
    await app.init({
        width: defaultCanvasWidth,
        height: defaultCanvasHeight,
        backgroundColor: 0x1a1a1a,
        antialias: true,
    });

    const canvasElement = app.canvas as HTMLCanvasElement;
    if (canvasContainer.value) {
        canvasContainer.value.appendChild(canvasElement);
    }
    wheelListener = handleWheelZoom;
    canvasElement.addEventListener('wheel', wheelListener, { passive: false });

    // 创建容器
    worldContainer = new PIXI.Container();
    worldContainer.sortableChildren = true;
    gridContainer = new PIXI.Container();
    objectsContainer = new PIXI.Container();
    objectsContainer.sortableChildren = true;
    previewGraphics = new PIXI.Graphics();

    worldContainer.addChild(gridContainer);
    worldContainer.addChild(objectsContainer);
    worldContainer.addChild(previewGraphics);
    app.stage.addChild(worldContainer);

    // 绘制初始网格
    drawGrid();

    // 添加事件监听
    app.stage.eventMode = 'static';
    app.stage.hitArea = new PIXI.Rectangle(0, 0, app.screen.width, app.screen.height);

    app.stage.on('pointermove', handlePointerMove);
    app.stage.on('pointerdown', handlePointerDown);
    app.stage.on('pointerup', handlePointerUp);
    app.stage.on('pointerupoutside', handlePointerUp);

    // 键盘事件
    window.addEventListener('keydown', handleKeyDown);

    // 尝试恢复上次编辑状态
    const restored = await loadEditorState();
    
    // 如果没有恢复状态，保存初始状态
    if (!restored) {
        saveHistory();
    } else {
        // 恢复后也保存到历史记录
        saveHistory();
    }
});

onBeforeUnmount(() => {
    // 退出前保存当前状态
    saveEditorState();
    
    window.removeEventListener('keydown', handleKeyDown);
    const canvasElement = app?.canvas as HTMLCanvasElement | undefined;
    if (canvasElement && wheelListener) {
        canvasElement.removeEventListener('wheel', wheelListener);
        wheelListener = null;
    }
    if (app) {
        app.destroy(true);
    }
});

// 绘制网格
const drawGrid = () => {
    gridContainer.removeChildren();

    if (!showGrid.value) return;

    const grid = new PIXI.Graphics();
    const cols = Math.ceil(app.screen.width / gridSize);
    const rows = Math.ceil(app.screen.height / gridSize);

    grid.lineStyle(1, 0x333333, 0.5);

    // 竖线
    for (let i = 0; i <= cols; i++) {
        const x = i * gridSize;
        grid.moveTo(x, 0);
        grid.lineTo(x, app.screen.height);
    }

    // 横线
    for (let j = 0; j <= rows; j++) {
        const y = j * gridSize;
        grid.moveTo(0, y);
        grid.lineTo(app.screen.width, y);
    }

    grid.stroke();
    gridContainer.addChild(grid);
};

// 根据内容尺寸调整画布，保证大地图图片可以完整显示
const resizeCanvas = (width: number, height: number) => {
    if (!app) return;
    app.renderer.resize(width, height);
    app.stage.hitArea = new PIXI.Rectangle(0, 0, width, height);

    const canvasElement = app.canvas as HTMLCanvasElement | undefined;
    if (canvasElement) {
        canvasElement.style.width = `${width}px`;
        canvasElement.style.height = `${height}px`;
    }

    drawGrid();
};

const syncCanvasSizeWithMap = () => {
    if (!app) return;
    const targetWidth = Math.max(mapSprite?.width ?? defaultCanvasWidth, defaultCanvasWidth);
    const targetHeight = Math.max(mapSprite?.height ?? defaultCanvasHeight, defaultCanvasHeight);

    if (app.screen.width === targetWidth && app.screen.height === targetHeight) {
        drawGrid();
        return;
    }

    resizeCanvas(targetWidth, targetHeight);
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const resetViewTransform = () => {
    zoomLevel.value = 1;
    if (worldContainer) {
        worldContainer.scale.set(1);
        worldContainer.position.set(0, 0);
    }
};

const toWorldCoordinates = (screenX: number, screenY: number) => {
    if (!worldContainer) return { x: screenX, y: screenY };
    const scale = worldContainer.scale.x || 1;
    const pos = worldContainer.position;
    return {
        x: (screenX - pos.x) / scale,
        y: (screenY - pos.y) / scale
    };
};

const toWorldPoint = (point: PIXI.PointData) => toWorldCoordinates(point.x, point.y);

const applyZoom = (newZoom: number, anchorScreenX?: number, anchorScreenY?: number) => {
    if (!worldContainer) return;
    const clamped = clamp(newZoom, minZoom, maxZoom);
    if (clamped === zoomLevel.value) return;

    const anchorWorld = (anchorScreenX !== undefined && anchorScreenY !== undefined)
        ? toWorldCoordinates(anchorScreenX, anchorScreenY)
        : null;

    zoomLevel.value = clamped;
    worldContainer.scale.set(clamped);

    if (anchorWorld && anchorScreenX !== undefined && anchorScreenY !== undefined) {
        const newPosX = anchorScreenX - anchorWorld.x * clamped;
        const newPosY = anchorScreenY - anchorWorld.y * clamped;
        worldContainer.position.set(newPosX, newPosY);
    }
};

const handleWheelZoom = (event: WheelEvent) => {
    if (!app) return;
    if (!event.ctrlKey && !event.metaKey) {
        return;
    }
    const canvas = app.canvas as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    const deltaDirection = event.deltaY > 0 ? -1 : 1;
    const newZoom = zoomLevel.value + zoomStep * deltaDirection;

    event.preventDefault();
    applyZoom(newZoom, screenX, screenY);
};

const getViewportCenter = () => {
    const containerEl = canvasContainer.value;
    if (containerEl) {
        return {
            x: containerEl.scrollLeft + containerEl.clientWidth / 2,
            y: containerEl.scrollTop + containerEl.clientHeight / 2
        };
    }
    if (app) {
        return {
            x: app.screen.width / 2,
            y: app.screen.height / 2
        };
    }
    return null;
};

// 切换网格显示
const toggleGrid = () => {
    showGrid.value = !showGrid.value;
    drawGrid();
};

// 加载地图图片
const loadMapImage = () => {
    fileInput.value?.click();
};

const handleFileSelect = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        const result = e.target?.result as string;

        // 移除旧的地图精灵
        if (mapSprite) {
            objectsContainer.removeChild(mapSprite);
        }

        // 创建新的地图精灵
        const texture = await PIXI.Assets.load(result);
        mapSprite = new PIXI.Sprite(texture);
        mapSprite.zIndex = -1;
        objectsContainer.addChild(mapSprite);
        objectsContainer.sortChildren();
        syncCanvasSizeWithMap();
        resetViewTransform();
    };

    reader.readAsDataURL(file);
};

// 设置编辑模式
const setMode = (mode: 'unit' | 'wall' | 'door' | 'select') => {
    // 取消当前绘制
    if (currentMode.value === 'wall' || currentMode.value === 'door') {
        cancelDrawing();
    }
    currentMode.value = mode;
};

// 选择单位类型
const selectUnitType = (type: string) => {
    selectedUnitType.value = type;
};

// 鼠标移动处理
const handlePointerMove = (event: PIXI.FederatedPointerEvent) => {
    const pos = toWorldPoint(event.global);
    mouseX.value = Math.round(pos.x);
    mouseY.value = Math.round(pos.y);

    // 如果正在拖动对象
    if (isDragging.value && selectedContainer.value && selectedObject.value) {
        // 单位对齐网格，墙体和门自由移动
        let newX, newY;
        
        if (selectedObject.value.type === 'unit') {
            // 单位：对齐到网格
            newX = Math.floor((pos.x - dragOffset.x) / gridSize) * gridSize;
            newY = Math.floor((pos.y - dragOffset.y) / gridSize) * gridSize;
        } else {
            // 墙体和门：自由移动
            newX = pos.x - dragOffset.x;
            newY = pos.y - dragOffset.y;
        }

        selectedContainer.value.position.set(newX, newY);
        selectedObject.value.x = newX;
        selectedObject.value.y = newY;
        return;
    }

    // 更新预览
    updatePreview(pos.x, pos.y);
};

// 更新预览
const updatePreview = (x: number, y: number) => {
    previewGraphics.clear();

    if (currentMode.value === 'unit') {
        // 显示单位放置预览
        const gridX = Math.floor(x / gridSize) * gridSize;
        const gridY = Math.floor(y / gridSize) * gridSize;

        previewGraphics.rect(gridX, gridY, gridSize, gridSize);
        previewGraphics.fill({ color: 0x00ff00, alpha: 0.3 });
        previewGraphics.stroke({ color: 0x00ff00, width: 2 });
    } else if (currentMode.value === 'wall' || currentMode.value === 'door') {
        // 显示绘制预览
        if (drawingPoints.value.length > 0) {
            const lastPoint = drawingPoints.value[drawingPoints.value.length - 1];
            previewGraphics.moveTo(lastPoint.x, lastPoint.y);
            previewGraphics.lineTo(x, y);
            previewGraphics.stroke({
                color: currentMode.value === 'wall' ? 0xff0000 : 0x0000ff,
                width: 3
            });

            // 绘制已有的点和线
            if (drawingPoints.value.length > 1) {
                for (let i = 0; i < drawingPoints.value.length - 1; i++) {
                    const p1 = drawingPoints.value[i];
                    const p2 = drawingPoints.value[i + 1];
                    previewGraphics.moveTo(p1.x, p1.y);
                    previewGraphics.lineTo(p2.x, p2.y);
                    previewGraphics.stroke({
                        color: currentMode.value === 'wall' ? 0xff0000 : 0x0000ff,
                        width: 3
                    });
                }
            }

            // 绘制所有点
            drawingPoints.value.forEach(point => {
                previewGraphics.circle(point.x, point.y, 4);
                previewGraphics.fill({ color: 0xffff00 });
            });
        }
    }
};

// 鼠标点击处理
const handlePointerDown = (event: PIXI.FederatedPointerEvent) => {
    const pos = toWorldPoint(event.global);

    if (currentMode.value === 'unit') {
        placeUnit(pos.x, pos.y);
    } else if (currentMode.value === 'wall' || currentMode.value === 'door') {
        addDrawingPoint(pos.x, pos.y);
    } else if (currentMode.value === 'select') {
        const hitContainer = selectObject(pos.x, pos.y);
        if (hitContainer) {
            // 开始拖动
            isDragging.value = true;
            dragOffset.x = pos.x - hitContainer.position.x;
            dragOffset.y = pos.y - hitContainer.position.y;
        }
    }
};

// 鼠标松开处理
const handlePointerUp = () => {
    // 如果刚完成拖动，保存历史记录
    if (isDragging.value) {
        isDragging.value = false;
        saveHistory();
    }
};

// 放置单位
const placeUnit = async (x: number, y: number) => {
    const gridX = Math.floor(x / gridSize) * gridSize;
    const gridY = Math.floor(y / gridSize) * gridSize;

    const unitProperties: any[] = [
        { name: 'unitTypeName', type: 'string', value: selectedUnitType.value },
        { name: 'party', type: 'string', value: unitParty.value },
        { name: 'direction', type: 'int', value: unitDirection.value },
        { name: 'friendly', type: 'bool', value: unitFriendly.value },
        { name: 'isSceneHidden', type: 'bool', value: unitIsSceneHidden.value }
    ];

    const selectionGroupValue = unitSelectionGroup.value.trim();
    if (selectionGroupValue) {
        unitProperties.push({ name: 'selectionGroup', type: 'string', value: selectionGroupValue });
    }

    const unit = {
        id: nextObjectId++,
        name: unitName.value || selectedUnitType.value,
        x: gridX,
        y: gridY,
        width: gridSize,
        height: gridSize,
        type: 'unit',
        properties: unitProperties
    };

    placedUnits.value.push(unit);

    // 加载并显示单位图像
    const container = new PIXI.Container();
    container.position.set(gridX, gridY);
    container.eventMode = 'static';
    container.cursor = 'pointer';
    (container as any).userData = { id: unit.id, type: 'unit', data: unit };

    // 先显示加载中的占位符
    const placeholder = new PIXI.Graphics();
    placeholder.rect(0, 0, gridSize, gridSize);
    placeholder.fill({ color: 0x00ff00, alpha: 0.3 });
    placeholder.stroke({ color: 0x00ff00, width: 2 });
    container.addChild(placeholder);

    const loadingText = new PIXI.Text({
        text: '加载中...',
        style: { fontSize: 10, fill: 0xffffff }
    });
    loadingText.x = 5;
    loadingText.y = 5;
    container.addChild(loadingText);

    objectsContainer.addChild(container);

    // 异步加载单位精灵
    try {
        const spriteData = await loadUnitSprite(selectedUnitType.value);
        if (spriteData) {
            // 移除占位符
            container.removeChildren();

            // 计算实际大小（大型单位占用 2x2 网格）
            const unitGridSize = spriteData.visualSize;

            // 每次都创建新的精灵实例
            const displaySprite = new PIXI.AnimatedSprite(spriteData.textures);
            displaySprite.animationSpeed = 0.1;
            displaySprite.play();
            displaySprite.scale.set(spriteData.scale);

            // 调整精灵位置，居中显示（参考 UnitAnimSprite.ts 的逻辑）
            displaySprite.x = -(displaySprite.width - unitGridSize) / 2;
            displaySprite.y = -(displaySprite.height - unitGridSize) / 2;

            // 添加边框以区分（根据实际大小）
            const border = new PIXI.Graphics();
            border.rect(0, 0, unitGridSize, unitGridSize);
            border.stroke({ color: 0x00ff00, width: 2, alpha: 0.5 });

            // 添加名称标签
            const nameText = new PIXI.Text({
                text: unit.name,
                style: { fontSize: 10, fill: 0xffffff, stroke: { color: 0x000000, width: 2 } }
            });
            nameText.x = 2;
            nameText.y = 2;

            container.addChild(displaySprite);
            container.addChild(border);
            container.addChild(nameText);
        }
    } catch (error) {
        console.error('加载单位图像失败:', error);
        // 保持占位符显示
    }

    // 保存历史记录
    saveHistory();
};

// 添加绘制点
const addDrawingPoint = (x: number, y: number) => {
    drawingPoints.value.push({ x, y });
};

// 完成绘制
const finishDrawing = () => {
    if (drawingPoints.value.length < 2) {
        alert('至少需要2个点才能完成绘制');
        return;
    }

    const points = drawingPoints.value.map(p => ({ x: p.x, y: p.y }));
    const objType = currentMode.value; // 'wall' 或 'door'
    const obj = {
        id: nextObjectId++,
        name: '',
        x: points[0].x,
        y: points[0].y,
        width: 0,
        height: 0,
        rotation: 0,
        visible: true,
        type: objType,
        polyline: points.map((p, i) => ({
            x: i === 0 ? 0 : p.x - points[0].x,
            y: i === 0 ? 0 : p.y - points[0].y
        })),
        properties: objType === 'wall' ? [
            { name: 'onlyVisition', type: 'string', value: 'false' },
            { name: 'onlyBlock', type: 'string', value: 'false' }
        ] : [
            { name: 'onlyVisition', type: 'string', value: 'false' },
            { name: 'onlyBlock', type: 'string', value: 'true' }
        ]
    };

    if (objType === 'wall') {
        wallObjects.value.push(obj);
    } else {
        doorObjects.value.push(obj);
    }

    // 可视化显示
    const graphics = new PIXI.Graphics();
    graphics.position.set(obj.x, obj.y); // 设置Graphics的位置
    // 使用相对坐标绘制（polyline中的坐标）
    for (let i = 0; i < obj.polyline.length - 1; i++) {
        const p1 = obj.polyline[i];
        const p2 = obj.polyline[i + 1];
        graphics.moveTo(p1.x, p1.y);
        graphics.lineTo(p2.x, p2.y);
    }
    graphics.stroke({
        color: currentMode.value === 'wall' ? 0xff0000 : 0x0000ff,
        width: 3
    });
    (graphics as any).userData = { id: obj.id, type: currentMode.value, data: obj };
    objectsContainer.addChild(graphics);

    // 重置绘制状态
    drawingPoints.value = [];
    previewGraphics.clear();

    // 保存历史记录
    saveHistory();
};

// 取消绘制
const cancelDrawing = () => {
    drawingPoints.value = [];
    previewGraphics.clear();
};

// 计算点到线段的最短距离
const pointToLineSegmentDistance = (px: number, py: number, x1: number, y1: number, x2: number, y2: number): number => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSquared = dx * dx + dy * dy;
    
    if (lengthSquared === 0) {
        // 线段退化为点
        return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
    }
    
    // 计算投影参数t
    let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
    t = Math.max(0, Math.min(1, t));
    
    // 投影点坐标
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    
    // 返回距离
    return Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));
};

// 检查点击位置是否靠近折线
const isNearPolyline = (x: number, y: number, obj: any, containerX: number = 0, containerY: number = 0, tolerance: number = 10): boolean => {
    if (!obj.polyline || obj.polyline.length < 2) return false;
    
    // 使用容器的实际位置（如果移动过，位置会变化）
    const baseX = containerX;
    const baseY = containerY;
    
    // 检查每一条线段
    for (let i = 0; i < obj.polyline.length - 1; i++) {
        const p1 = obj.polyline[i];
        const p2 = obj.polyline[i + 1];
        
        const x1 = baseX + p1.x;
        const y1 = baseY + p1.y;
        const x2 = baseX + p2.x;
        const y2 = baseY + p2.y;
        
        const distance = pointToLineSegmentDistance(x, y, x1, y1, x2, y2);
        if (distance <= tolerance) {
            return true;
        }
    }
    
    return false;
};

// 选择对象（用于删除）
const selectObject = (x: number, y: number): PIXI.Container | null => {
    // 取消之前的选中状态
    if (selectedContainer.value) {
        // 移除选中边框
        const oldBorder = selectedContainer.value.children.find(child =>
            (child as any).isSelectionBorder
        ) as PIXI.Container;
        if (oldBorder) {
            selectedContainer.value.removeChild(oldBorder as any);
        }
    }

    // 查找点击的对象 - 优先查找单位，然后才是墙体/门
    let hitContainer: PIXI.Container | null = null;

    // 第一遍：只查找单位（从后往前，后添加的在上层）
    for (let i = objectsContainer.children.length - 1; i >= 0; i--) {
        const child = objectsContainer.children[i] as PIXI.Container;
        const userData = (child as any).userData;

        if (userData && userData.type === 'unit') {
            const localBounds = child.getLocalBounds();
            const left = child.position.x + localBounds.x;
            const top = child.position.y + localBounds.y;
            const right = left + localBounds.width;
            const bottom = top + localBounds.height;

            if (x >= left && x <= right && y >= top && y <= bottom) {
                hitContainer = child;
                break;
            }
        }
    }

    // 如果没找到单位，第二遍：查找墙体/门
    if (!hitContainer) {
        const tolerance = 10; // 点击容差：10像素（世界坐标）
        
        for (let i = objectsContainer.children.length - 1; i >= 0; i--) {
            const child = objectsContainer.children[i] as PIXI.Container;
            const userData = (child as any).userData;

            if (userData && (userData.type === 'wall' || userData.type === 'door') && userData.data) {
                // 精确检测：点击位置是否靠近折线（使用容器的实际位置）
                if (isNearPolyline(x, y, userData.data, child.position.x, child.position.y, tolerance)) {
                    hitContainer = child;
                    break;
                }
            }
        }
    }

    if (hitContainer) {
        const userData = (hitContainer as any).userData;
        selectedObject.value = userData.data || userData;
        selectedContainer.value = hitContainer;

        // 添加选中边框
        const selectionBorder = new PIXI.Graphics();

        if (userData.type === 'unit') {
            // 单位：矩形边框
            const localBounds = hitContainer.getLocalBounds();
            const width = localBounds.width || gridSize;
            const height = localBounds.height || gridSize;
            selectionBorder.rect(localBounds.x, localBounds.y, width, height);
            selectionBorder.stroke({ color: 0xffff00, width: 3 });
        } else if (userData.type === 'wall' || userData.type === 'door') {
            // 墙体/门：沿折线高亮
            const polyline = userData.data?.polyline;
            if (polyline?.length > 1) {
                for (let i = 0; i < polyline.length - 1; i++) {
                    const p1 = polyline[i];
                    const p2 = polyline[i + 1];
                    selectionBorder.moveTo(p1.x, p1.y);
                    selectionBorder.lineTo(p2.x, p2.y);
                }
                selectionBorder.stroke({ color: 0xffff00, width: 5, alpha: 0.8 });
            }
        }

        (selectionBorder as any).isSelectionBorder = true;
        hitContainer.addChild(selectionBorder);

        console.log('选中对象 userData:', userData);
        console.log('selectedObject.value:', selectedObject.value);
        console.log('selectedObject.value.type:', selectedObject.value?.type);
        console.log('当前模式 currentMode.value:', currentMode.value);

        // 如果选中的是单位，同步属性到编辑器
        if (userData.type === 'unit' && userData.data) {
            syncUnitPropertiesToEditor(userData.data);
        }
        
        // 如果选中的是墙体或门，同步属性到编辑器
        if ((userData.type === 'wall' || userData.type === 'door') && userData.data) {
            syncWallDoorPropertiesToEditor(userData.data);
        }

        return hitContainer;
    } else {
        selectedObject.value = null;
        selectedContainer.value = null;
        // 清空编辑器
        editingUnitName.value = '';
        editingUnitParty.value = 'player';
        editingUnitDirection.value = 2;
        editingUnitFriendly.value = false;
        editingUnitSelectionGroup.value = '';
        editingUnitHidden.value = false;
        editingOnlyVisition.value = false;
        editingOnlyBlock.value = false;
        return null;
    }
};

// 加载单位精灵数据
const loadUnitSprite = async (unitTypeName: string): Promise<{ textures: PIXI.Texture[], scale: number, visualSize: number, frameSize: number } | null> => {
    // 检查缓存
    if (unitSpriteDataCache.has(unitTypeName)) {
        return unitSpriteDataCache.get(unitTypeName)!;
    }

    try {
        // 加载动画元数据
        const animMetaJson = new AnimMetaJson(await getAnimMetaJsonFile(unitTypeName) as any);
        const animations = animMetaJson.getAllExportedAnimations();

        if (animations.length === 0) {
            console.warn(`单位 ${unitTypeName} 没有可用的动画`);
            return null;
        }

        // 加载第一个动画 (通常是 idle 或 walk)
        const firstAnim = 'walk'
        const spriteUrl = getAnimSpriteImgUrl(unitTypeName, firstAnim, 'standard');
        const sheetTexture = await PIXI.Assets.load(spriteUrl);
        const json: any = await getAnimActionSpriteJsonFile(unitTypeName, firstAnim, 'standard');

        if (!json || !json.frames) {
            console.warn(`单位 ${unitTypeName} 的动画数据无效`);
            return null;
        }

        // 创建 spritesheet
        const spritesheet = new PIXI.Spritesheet(sheetTexture, json as any);
        await spritesheet.parse();

        // 获取纹理数组
        const textures = Object.values(spritesheet.textures) as PIXI.Texture[];
        if (textures.length === 0) {
            return null;
        }

        // 根据单位类型判断大小（参考 GamePannel.vue）
        const frameSize = animMetaJson.frameSize || 64;
        const isBigUnit = unitTypeName === 'bigSkeleton'; // 可以添加更多大型单位
        const visualSize = isBigUnit ? 128 : 64;
        const scale = visualSize / frameSize;

        // 缓存精灵数据
        const spriteData = { textures, scale, visualSize, frameSize };
        unitSpriteDataCache.set(unitTypeName, spriteData);

        return spriteData;
    } catch (error) {
        console.error(`加载单位精灵失败: ${unitTypeName}`, error);
        return null;
    }
};

// 键盘事件处理
const handleKeyDown = (event: KeyboardEvent) => {
    // Ctrl+Z 撤回
    if (event.ctrlKey && event.key === 'z') {
        event.preventDefault();
        undo();
        return;
    }

    // Ctrl+Y 重做
    if (event.ctrlKey && event.key === 'y') {
        event.preventDefault();
        redo();
        return;
    }

    if (event.key === 'Escape') {
        if (currentMode.value === 'wall' || currentMode.value === 'door') {
            finishDrawing();
        } else if (currentMode.value === 'select') {
            // 取消选中
            if (selectedContainer.value) {
                const oldBorder = selectedContainer.value.children.find(child =>
                    (child as any).isSelectionBorder
                ) as PIXI.Container;
                if (oldBorder) {
                    selectedContainer.value.removeChild(oldBorder as any);
                }
            }
            selectedObject.value = null;
            selectedContainer.value = null;
            // 清空编辑器
            editingUnitName.value = '';
            editingUnitParty.value = 'player';
            editingUnitDirection.value = 2;
            editingUnitFriendly.value = false;
            editingUnitSelectionGroup.value = '';
            editingUnitHidden.value = false;
            editingOnlyVisition.value = false;
            editingOnlyBlock.value = false;
        }
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
        // 删除选中的对象
        if (selectedObject.value && selectedContainer.value) {
            deleteSelectedObject();
        }
    }
};

// 删除选中的对象
const deleteSelectedObject = () => {
    if (!selectedObject.value || !selectedContainer.value) return;

    const userData = (selectedContainer.value as any).userData;

    if (userData.type === 'unit') {
        // 从数据数组中移除
        const index = placedUnits.value.findIndex(u => u.id === userData.id);
        if (index !== -1) {
            placedUnits.value.splice(index, 1);
        }

        // 从场景中移除
        objectsContainer.removeChild(selectedContainer.value as any);
        selectedContainer.value.destroy({ children: true });

        console.log(`已删除单位: ${userData.data?.name || userData.id}`);
    } else if (userData.type === 'wall') {
        // 从墙体数组中移除
        const index = wallObjects.value.findIndex(w => w.id === userData.id);
        if (index !== -1) {
            wallObjects.value.splice(index, 1);
        }

        // 从场景中移除
        objectsContainer.removeChild(selectedContainer.value as any);
        selectedContainer.value.destroy({ children: true });

        console.log(`已删除墙体: ${userData.id}`);
    } else if (userData.type === 'door') {
        // 从门数组中移除
        const index = doorObjects.value.findIndex(d => d.id === userData.id);
        if (index !== -1) {
            doorObjects.value.splice(index, 1);
        }

        // 从场景中移除
        objectsContainer.removeChild(selectedContainer.value as any);
        selectedContainer.value.destroy({ children: true });

        console.log(`已删除门: ${userData.id}`);
    }

    selectedObject.value = null;
    selectedContainer.value = null;
    // 清空编辑器
    editingUnitName.value = '';
    editingUnitParty.value = 'player';
    editingUnitDirection.value = 2;
    editingUnitFriendly.value = false;
    editingUnitSelectionGroup.value = '';
    editingUnitHidden.value = false;
    editingOnlyVisition.value = false;
    editingOnlyBlock.value = false;

    // 保存历史记录
    saveHistory();
    // 自动保存编辑状态
    saveEditorState();
};

// 清空画布
const clearCanvas = () => {
    if (confirm('确定要清空所有对象吗？')) {
        placedUnits.value = [];
        wallObjects.value = [];
        doorObjects.value = [];
        objectsContainer.removeChildren();
        if (mapSprite) {
            objectsContainer.addChild(mapSprite);
        }
        nextObjectId = 1;

        // 保存历史记录
        saveHistory();
        // 自动保存编辑状态
        saveEditorState();
        // 清除保存的状态（因为已经清空了）
        clearEditorState();
        syncCanvasSizeWithMap();
        resetViewTransform();
    }
};

// ========== 单位属性编辑相关函数 ==========

// 同步单位属性到编辑器
const syncUnitPropertiesToEditor = (unit: any) => {
    editingUnitName.value = unit.name || '';

    // 从 properties 数组中提取属性
    const partyProp = unit.properties?.find((p: any) => p.name === 'party');
    const directionProp = unit.properties?.find((p: any) => p.name === 'direction');
    const friendlyProp = unit.properties?.find((p: any) => p.name === 'friendly');
    const selectionGroupProp = unit.properties?.find((p: any) => p.name === 'selectionGroup');
    const hiddenProp = unit.properties?.find((p: any) => p.name === 'isSceneHidden');

    editingUnitParty.value = partyProp?.value || 'player';
    editingUnitDirection.value = directionProp?.value || 2;
    editingUnitFriendly.value = friendlyProp?.value === 'true' || friendlyProp?.value === true;
    editingUnitSelectionGroup.value = typeof selectionGroupProp?.value === 'string' ? selectionGroupProp.value : '';
    editingUnitHidden.value = hiddenProp?.value === 'true' || hiddenProp?.value === true;
};

// 应用单位属性更改
const applyUnitPropertyChanges = () => {
    if (!selectedObject.value || selectedObject.value.type !== 'unit') return;

    const unit = selectedObject.value;

    // 更新名称
    unit.name = editingUnitName.value;

    // 更新 properties 数组
    if (!unit.properties) {
        unit.properties = [];
    }

    const upsertProperty = (name: string, type: string, value: any) => {
        const existing = unit.properties.find((p: any) => p.name === name);
        if (existing) {
            existing.value = value;
            existing.type = existing.type || type;
        } else {
            unit.properties.push({ name, type, value });
        }
    };

    const removeProperty = (name: string) => {
        const index = unit.properties.findIndex((p: any) => p.name === name);
        if (index !== -1) {
            unit.properties.splice(index, 1);
        }
    };

    upsertProperty('party', 'string', editingUnitParty.value);
    upsertProperty('direction', 'int', editingUnitDirection.value);
    upsertProperty('friendly', 'bool', editingUnitFriendly.value);

    const trimmedGroup = editingUnitSelectionGroup.value.trim();
    if (trimmedGroup) {
        upsertProperty('selectionGroup', 'string', trimmedGroup);
    } else {
        removeProperty('selectionGroup');
    }

    upsertProperty('isSceneHidden', 'bool', editingUnitHidden.value);

    // 更新视觉显示（名称标签）
    if (selectedContainer.value) {
        const nameText = selectedContainer.value.children.find(child => child instanceof PIXI.Text) as PIXI.Text;
        if (nameText) {
            nameText.text = unit.name;
        }
    }

    // 保存历史记录
    saveHistory();

    console.log('单位属性已更新:', unit);
};

// 同步墙体/门属性到编辑器
const syncWallDoorPropertiesToEditor = (obj: any) => {
    // 从 properties 数组中提取属性
    const onlyVisitionProp = obj.properties?.find((p: any) => p.name === 'onlyVisition');
    const onlyBlockProp = obj.properties?.find((p: any) => p.name === 'onlyBlock');

    editingOnlyVisition.value = onlyVisitionProp?.value === 'true' || onlyVisitionProp?.value === true;
    editingOnlyBlock.value = onlyBlockProp?.value === 'true' || onlyBlockProp?.value === true;
};

// 应用墙体/门属性更改
const applyWallDoorPropertyChanges = () => {
    if (!selectedObject.value || (selectedObject.value.type !== 'wall' && selectedObject.value.type !== 'door')) return;

    const obj = selectedObject.value;

    // 确保properties数组存在
    if (!obj.properties) {
        obj.properties = [];
    }

    // 更新或添加 onlyVisition 属性
    let onlyVisitionProp = obj.properties.find((p: any) => p.name === 'onlyVisition');
    if (onlyVisitionProp) {
        onlyVisitionProp.value = editingOnlyVisition.value.toString();
    } else {
        obj.properties.push({
            name: 'onlyVisition',
            type: 'string',
            value: editingOnlyVisition.value.toString()
        });
    }

    // 更新或添加 onlyBlock 属性
    let onlyBlockProp = obj.properties.find((p: any) => p.name === 'onlyBlock');
    if (onlyBlockProp) {
        onlyBlockProp.value = editingOnlyBlock.value.toString();
    } else {
        obj.properties.push({
            name: 'onlyBlock',
            type: 'string',
            value: editingOnlyBlock.value.toString()
        });
    }

    // 保存历史记录
    saveHistory();

    console.log(`${obj.type === 'wall' ? '墙体' : '门'}属性已更新:`, obj);
};

// ========== 历史记录（撤回/重做）相关函数 ==========

// 保存当前状态到历史记录
const saveHistory = () => {
    // 深拷贝当前状态
    const currentState = {
        placedUnits: JSON.parse(JSON.stringify(placedUnits.value)),
        wallObjects: JSON.parse(JSON.stringify(wallObjects.value)),
        doorObjects: JSON.parse(JSON.stringify(doorObjects.value)),
        nextObjectId: nextObjectId
    };

    // 如果当前不在历史末尾，删除后面的历史
    if (currentHistoryIndex.value < historyStack.value.length - 1) {
        historyStack.value = historyStack.value.slice(0, currentHistoryIndex.value + 1);
    }

    // 添加新状态
    historyStack.value.push(currentState);
    currentHistoryIndex.value = historyStack.value.length - 1;

    // 限制历史记录数量
    if (historyStack.value.length > maxHistorySize) {
        historyStack.value.shift();
        currentHistoryIndex.value--;
    }

    console.log(`历史记录已保存 [${currentHistoryIndex.value + 1}/${historyStack.value.length}]`);
    
    // 自动保存编辑状态
    saveEditorState();
};

// 从历史记录恢复状态
const restoreFromHistory = async (state: any) => {
    // 恢复数据
    placedUnits.value = JSON.parse(JSON.stringify(state.placedUnits));
    wallObjects.value = JSON.parse(JSON.stringify(state.wallObjects));
    doorObjects.value = JSON.parse(JSON.stringify(state.doorObjects));
    nextObjectId = state.nextObjectId;

    // 清空场景
    objectsContainer.removeChildren();
    if (mapSprite) {
        objectsContainer.addChild(mapSprite);
    }

    // 重建视觉元素
    // 重建单位
    for (const unit of placedUnits.value) {
        // 从 properties 中提取 unitTypeName
        const unitTypeProp = unit.properties?.find((p: any) => p.name === 'unitTypeName');
        const unitTypeName = unitTypeProp?.value || 'skeleton';
        await createUnitVisual(unit, unitTypeName);
    }

    // 重建墙体
    for (const wall of wallObjects.value) {
        createWallVisual(wall);
    }

    // 重建门
    for (const door of doorObjects.value) {
        createDoorVisual(door);
    }

    // 清除选中状态
    selectedObject.value = null;
    selectedContainer.value = null;
    // 清空编辑器
    editingUnitName.value = '';
    editingUnitParty.value = 'player';
    editingUnitDirection.value = 2;
    editingUnitFriendly.value = false;
    editingUnitSelectionGroup.value = '';
    editingUnitHidden.value = false;
    editingOnlyVisition.value = false;
    editingOnlyBlock.value = false;

    syncCanvasSizeWithMap();

    console.log('状态已恢复');
};

// 撤回
const undo = async () => {
    if (currentHistoryIndex.value <= 0) {
        console.log('已经是最早的状态，无法撤回');
        return;
    }

    currentHistoryIndex.value--;
    const state = historyStack.value[currentHistoryIndex.value];
    await restoreFromHistory(state);
    console.log(`撤回到步骤 [${currentHistoryIndex.value + 1}/${historyStack.value.length}]`);
};

// 重做
const redo = async () => {
    if (currentHistoryIndex.value >= historyStack.value.length - 1) {
        console.log('已经是最新的状态，无法重做');
        return;
    }

    currentHistoryIndex.value++;
    const state = historyStack.value[currentHistoryIndex.value];
    await restoreFromHistory(state);
    console.log(`重做到步骤 [${currentHistoryIndex.value + 1}/${historyStack.value.length}]`);
};

// ========== 导入/导出相关函数 ==========

// 导入TMJ文件
const importTMJ = () => {
    tmjFileInput.value?.click();
};

// 处理TMJ文件导入
const handleTMJImport = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) return;

    try {
        const text = await file.text();
        const tmjData = JSON.parse(text);

        // 确认是否覆盖现有内容
        if (placedUnits.value.length > 0 || wallObjects.value.length > 0 || doorObjects.value.length > 0) {
            if (!confirm('导入地图将清空现有内容，是否继续？')) {
                return;
            }
        }

        // 清空现有内容
        placedUnits.value = [];
        wallObjects.value = [];
        doorObjects.value = [];
        objectsContainer.removeChildren();
        if (mapSprite) {
            objectsContainer.addChild(mapSprite);
        }

        // 解析TMJ数据
        await parseTMJData(tmjData);
        syncCanvasSizeWithMap();
        resetViewTransform();

        // 设置地图名称
        const fileName = file.name.replace(/\.(tmj|json)$/, '');
        mapName.value = fileName;

        alert('地图导入成功！');
    } catch (error) {
        console.error('导入TMJ文件失败:', error);
        alert('导入失败，请检查文件格式！');
    }

    // 清空文件选择器
    if (target) target.value = '';
};

// 解析TMJ数据
const parseTMJData = async (tmjData: any) => {
    // 找到最大的ID
    let maxId = 0;

    // 解析各个图层
    tmjData.layers?.forEach((layer: any) => {
        if (layer.type === 'objectgroup') {
            if (layer.name === 'sprite' && layer.objects) {
                // 解析单位层
                layer.objects.forEach(async (obj: any) => {
                    if (obj.id > maxId) maxId = obj.id;

                    // 获取属性
                        const unitTypeName = obj.properties?.find((p: any) => p.name === 'unitTypeName')?.value || 'skeleton';
                        const party = obj.properties?.find((p: any) => p.name === 'party')?.value || 'enemy';
                        const directionRaw = obj.properties?.find((p: any) => p.name === 'direction')?.value ?? 2;
                        const friendlyRaw = obj.properties?.find((p: any) => p.name === 'friendly')?.value ?? false;
                        const selectionGroupRaw = obj.properties?.find((p: any) => p.name === 'selectionGroup')?.value || '';
                        const hiddenRaw = obj.properties?.find((p: any) => p.name === 'isSceneHidden')?.value ?? false;

                        const direction = typeof directionRaw === 'number' ? directionRaw : parseInt(directionRaw as string, 10) || 2;
                        const friendly = friendlyRaw === 'true' || friendlyRaw === true;
                        const selectionGroup = typeof selectionGroupRaw === 'string' ? selectionGroupRaw.trim() : '';
                        const isSceneHidden = hiddenRaw === 'true' || hiddenRaw === true;

                        const clonedProperties = obj.properties ? JSON.parse(JSON.stringify(obj.properties)) : [];
                        const upsertProperty = (name: string, type: string, value: any) => {
                            const existing = clonedProperties.find((p: any) => p.name === name);
                            if (existing) {
                                existing.value = value;
                                existing.type = existing.type || type;
                            } else {
                                clonedProperties.push({ name, type, value });
                            }
                        };
                        const removeProperty = (name: string) => {
                            const index = clonedProperties.findIndex((p: any) => p.name === name);
                            if (index !== -1) {
                                clonedProperties.splice(index, 1);
                            }
                        };

                        upsertProperty('unitTypeName', 'string', unitTypeName);
                        upsertProperty('party', 'string', party);
                        upsertProperty('direction', 'int', direction);
                        upsertProperty('friendly', 'bool', friendly);
                        upsertProperty('isSceneHidden', 'bool', isSceneHidden);
                        if (selectionGroup) {
                            upsertProperty('selectionGroup', 'string', selectionGroup);
                        } else {
                            removeProperty('selectionGroup');
                        }

                    const unitHeight = obj.height || gridSize;
                    const unit = {
                        id: obj.id,
                        name: obj.name || unitTypeName,
                        x: obj.x,
                        y: obj.y - unitHeight, // TMJ 使用底部坐标，需要减去高度转换为左上角坐标
                        width: obj.width || gridSize,
                        height: unitHeight,
                        type: 'unit',
                            properties: clonedProperties
                    };

                    placedUnits.value.push(unit);

                    // 创建视觉元素
                    await createUnitVisual(unit, unitTypeName);
                });
            } else if (layer.name === 'wall' && layer.objects) {
                // 解析墙体层
                layer.objects.forEach((obj: any) => {
                    if (obj.id > maxId) maxId = obj.id;
                    obj.type = 'wall'; // 确保type字段正确
                    wallObjects.value.push(obj);
                    createWallVisual(obj);
                });
            } else if (layer.name === 'door' && layer.objects) {
                // 解析门层
                layer.objects.forEach((obj: any) => {
                    if (obj.id > maxId) maxId = obj.id;
                    obj.type = 'door'; // 确保type字段正确
                    doorObjects.value.push(obj);
                    createDoorVisual(obj);
                });
            }
        }
    });

    // 设置下一个ID
    nextObjectId = maxId + 1;
};

// 创建单位视觉元素
const createUnitVisual = async (unit: any, unitTypeName: string) => {
    const container = new PIXI.Container();
    container.position.set(unit.x, unit.y);
    container.eventMode = 'static';
    container.cursor = 'pointer';
    (container as any).userData = { id: unit.id, type: 'unit', data: unit };

    try {
        const spriteData = await loadUnitSprite(unitTypeName);
        if (spriteData) {
            const unitGridSize = spriteData.visualSize;

            const displaySprite = new PIXI.AnimatedSprite(spriteData.textures);
            displaySprite.animationSpeed = 0.1;
            displaySprite.play();
            displaySprite.scale.set(spriteData.scale);
            displaySprite.x = -(displaySprite.width - unitGridSize) / 2;
            displaySprite.y = -(displaySprite.height - unitGridSize) / 2;

            const border = new PIXI.Graphics();
            border.rect(0, 0, unitGridSize, unitGridSize);
            border.stroke({ color: 0x00ff00, width: 2, alpha: 0.5 });

            const nameText = new PIXI.Text({
                text: unit.name,
                style: { fontSize: 10, fill: 0xffffff, stroke: { color: 0x000000, width: 2 } }
            });
            nameText.x = 2;
            nameText.y = 2;

            container.addChild(displaySprite);
            container.addChild(border);
            container.addChild(nameText);
        }
    } catch (error) {
        console.error('加载单位图像失败:', error);
    }

    objectsContainer.addChild(container);
};

// 创建墙体视觉元素
const createWallVisual = (obj: any) => {
    if (!obj.polyline || obj.polyline.length < 2) return;

    const graphics = new PIXI.Graphics();
    graphics.position.set(obj.x || 0, obj.y || 0); // 设置Graphics的位置
    // 使用相对坐标绘制
    for (let i = 0; i < obj.polyline.length - 1; i++) {
        const p1 = obj.polyline[i];
        const p2 = obj.polyline[i + 1];
        graphics.moveTo(p1.x, p1.y);
        graphics.lineTo(p2.x, p2.y);
    }
    graphics.stroke({ color: 0xff0000, width: 3 });
    (graphics as any).userData = { id: obj.id, type: 'wall', data: obj };
    objectsContainer.addChild(graphics);
};

// 创建门视觉元素
const createDoorVisual = (obj: any) => {
    if (!obj.polyline || obj.polyline.length < 2) return;

    const graphics = new PIXI.Graphics();
    graphics.position.set(obj.x || 0, obj.y || 0); // 设置Graphics的位置
    // 使用相对坐标绘制
    for (let i = 0; i < obj.polyline.length - 1; i++) {
        const p1 = obj.polyline[i];
        const p2 = obj.polyline[i + 1];
        graphics.moveTo(p1.x, p1.y);
        graphics.lineTo(p2.x, p2.y);
    }
    graphics.stroke({ color: 0x0000ff, width: 3 });
    (graphics as any).userData = { id: obj.id, type: 'door', data: obj };
    objectsContainer.addChild(graphics);
};

// 导出地图数据
const exportMapData = () => {
    // 转换单位坐标为 TMJ 格式（y 坐标需要加上高度，因为 TMJ 使用底部坐标）
    const exportedUnits = placedUnits.value.map(unit => {
        // 确保所有必需字段存在
        return {
            height: unit.height || gridSize,
            id: unit.id,
            name: unit.name || '',
            rotation: 0,
            type: unit.type || '',
            visible: true,
            width: unit.width || gridSize,
            x: unit.x,
            y: unit.y + (unit.height || gridSize), // TMJ 格式使用底部坐标
            properties: unit.properties || []
        };
    });

    // 确保墙体对象格式完整
    const exportedWalls = wallObjects.value.map(wall => ({
        height: wall.height || 0,
        id: wall.id,
        name: wall.name || '',
        polyline: wall.polyline || [],
        properties: wall.properties || [],
        rotation: wall.rotation || 0,
        type: wall.type || '',
        visible: wall.visible !== undefined ? wall.visible : true,
        width: wall.width || 0,
        x: wall.x || 0,
        y: wall.y || 0
    }));

    // 确保门对象格式完整
    const exportedDoors = doorObjects.value.map(door => ({
        height: door.height || 0,
        id: door.id,
        name: door.name || '',
        polyline: door.polyline || [],
        properties: door.properties || [],
        rotation: door.rotation || 0,
        type: door.type || '',
        visible: door.visible !== undefined ? door.visible : true,
        width: door.width || 0,
        x: door.x || 0,
        y: door.y || 0
    }));

    const mapData = {
        compressionlevel: -1,
        height: Math.ceil(app.screen.height / gridSize),
        infinite: false,
        layers: [
            // 墙体层
            {
                draworder: 'topdown',
                id: 2,
                name: 'wall',
                objects: exportedWalls,
                opacity: 1,
                type: 'objectgroup',
                visible: true,
                x: 0,
                y: 0
            },
            // 门层
            {
                draworder: 'topdown',
                id: 3,
                name: 'door',
                objects: exportedDoors,
                opacity: 1,
                type: 'objectgroup',
                visible: true,
                x: 0,
                y: 0
            },
            // 单位层
            {
                draworder: 'topdown',
                id: 4,
                name: 'sprite',
                objects: exportedUnits,
                opacity: 1,
                type: 'objectgroup',
                visible: true,
                x: 0,
                y: 0
            }
        ],
        nextlayerid: 5,
        nextobjectid: nextObjectId,
        orientation: 'orthogonal',
        renderorder: 'right-down',
        tiledversion: '1.11.2',
        tileheight: gridSize,
        tilesets: [],
        tilewidth: gridSize,
        type: 'map',
        version: '1.10',
        width: Math.ceil(app.screen.width / gridSize)
    };

    // 下载JSON文件
    const dataStr = JSON.stringify(mapData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${mapName.value}.tmj`;
    link.click();

    URL.revokeObjectURL(url);
};

// 获取模式文本
const getModeText = () => {
    const modeMap = {
        unit: '放置单位',
        wall: '绘制墙体',
        door: '绘制门',
        select: '选择/删除'
    };
    return modeMap[currentMode.value];
};
</script>

<style scoped>
.map-editor {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: #2a2a2a;
    color: #fff;
    position: absolute;
    top: 0;
    left: 0;
}

.toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 20px;
    background: #1a1a1a;
    border-bottom: 2px solid #333;
    flex-wrap: wrap;
    gap: 10px;
}

.toolbar-section {
    display: flex;
    align-items: center;
    gap: 10px;
}

.toolbar-label {
    font-weight: bold;
    margin-right: 5px;
}

.zoom-controls .zoom-display {
    min-width: 50px;
    text-align: center;
    display: inline-block;
}

.toolbar-separator {
    margin: 0 10px;
    color: #666;
    font-size: 18px;
}

.btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    background: #444;
    color: #fff;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
}

.btn:hover {
    background: #555;
}

.btn-primary {
    background: #007bff;
}

.btn-primary:hover {
    background: #0056b3;
}

.btn-success {
    background: #28a745;
}

.btn-success:hover {
    background: #218838;
}

.btn-warning {
    background: #ffc107;
    color: #000;
}

.btn-warning:hover {
    background: #e0a800;
}

.btn-active {
    background: #0056b3;
    box-shadow: 0 0 10px rgba(0, 123, 255, 0.5);
}

.btn:disabled {
    background: #333;
    color: #666;
    cursor: not-allowed;
    opacity: 0.5;
}

.btn:disabled:hover {
    background: #333;
}

.btn-sm {
    padding: 5px 10px;
    font-size: 12px;
}

.input-text {
    padding: 6px 12px;
    border: 1px solid #555;
    border-radius: 4px;
    background: #333;
    color: #fff;
    font-size: 14px;
}

.sidebar {
    position: fixed;
    left: 0;
    top: 60px;
    width: 250px;
    height: calc(100vh - 100px);
    background: #1a1a1a;
    border-right: 2px solid #333;
    padding: 20px;
    overflow-y: auto;
    z-index: 100;
}

.sidebar h3 {
    margin: 0 0 15px 0;
    font-size: 16px;
    border-bottom: 2px solid #444;
    padding-bottom: 10px;
}

.sidebar h4 {
    margin: 15px 0 10px 0;
    font-size: 14px;
    color: #aaa;
}

.unit-item {
    padding: 10px;
    margin-bottom: 8px;
    background: #333;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
}

.unit-item:hover {
    background: #444;
}

.unit-item.selected {
    background: #007bff;
    box-shadow: 0 0 10px rgba(0, 123, 255, 0.5);
}

.unit-properties {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 2px solid #444;
}

.unit-properties label {
    display: block;
    margin-bottom: 10px;
    font-size: 13px;
}

.unit-properties input[type="text"],
.unit-properties select {
    width: 100%;
    margin-top: 5px;
}

.unit-properties input[type="checkbox"] {
    margin-right: 5px;
}

.draw-hints {
    position: fixed;
    top: 70px;
    right: 20px;
    z-index: 100;
}

.hint-box {
    background: #1a1a1a;
    border: 2px solid #007bff;
    border-radius: 8px;
    padding: 15px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.hint-box p {
    margin: 5px 0;
    font-size: 13px;
}

.hint-box button {
    margin-top: 10px;
    margin-right: 5px;
}

.canvas-container {
    flex: 1;
    position: relative;
    overflow: auto;
    background: #1a1a1a;
    transition: margin-left 0.3s ease;
}

.canvas-container.with-sidebar {
    margin-left: 250px;
}

.status-bar {
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 8px 20px;
    background: #1a1a1a;
    border-top: 2px solid #333;
    font-size: 12px;
    color: #aaa;
}

.status-bar span {
    margin: 0 10px;
}

/* 滚动条样式 */
::-webkit-scrollbar {
    width: 10px;
    height: 10px;
}

::-webkit-scrollbar-track {
    background: #1a1a1a;
}

::-webkit-scrollbar-thumb {
    background: #444;
    border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
    background: #555;
}
</style>
