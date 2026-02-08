# 角色替换序列帧指南

## 目标
保持原序列帧的动作、姿势、布局不变，只替换角色外观。

## 方法对比

### 方法1：ControlNet OpenPose（推荐用于人形角色）
**优点：** 精确保持姿势
**缺点：** 只适用于人形角色
**适用场景：** 人类、人形怪物、骑士、法师等

### 方法2：ControlNet Depth/Canny（推荐用于所有类型）
**优点：** 适用于任何角色类型
**缺点：** 可能需要多次调整
**适用场景：** 怪物、动物、机械、非人形角色

### 方法3：IP-Adapter + Tile ControlNet（最佳）
**优点：** 保持布局和细节最好
**缺点：** 需要更多显存
**适用场景：** 像素风格序列帧，需要精确对齐

## 实战步骤

### 准备工作

1. **原始序列帧图**（例如：skeleton_walk_8frames.png）
2. **新角色参考图**（例如：knight_reference.png）
3. **确保已下载模型：**
   - ControlNet OpenPose 或 Canny
   - IP-Adapter 模型
   - CLIP Vision 模型

### ComfyUI操作流程

#### 步骤1：加载图像
```
LoadImage (原序列帧) → [Image 1]
LoadImage (新角色) → [Image 2]
```

#### 步骤2：提取控制信息
```
[Image 1] → ControlNet Preprocessor (选择类型)
  - OpenPose：用于人形角色
  - Canny Edge：用于保持轮廓
  - Depth：用于保持深度结构
```

#### 步骤3：编码新角色特征
```
[Image 2] → IPAdapterEncoder
  设置 weight: 0.8
```

#### 步骤4：设置提示词

**正向提示词（针对像素序列帧）：**
```
pixel art sprite sheet, [新角色描述], multiple animation frames, 
consistent character design, same character in all frames, 
transparent background, front view, full body, 
crisp outlines, high contrast, clean pixel art style,
preserve exact layout and positions
```

**示例（骷髅换成骑士）：**
```
pixel art sprite sheet, armored knight warrior, silver armor, 
blue cape, holding sword and shield, medieval fantasy knight,
multiple animation frames, consistent character design, 
same character in all frames, transparent background, 
front view, full body, crisp outlines, high contrast
```

**负向提示词：**
```
different characters, inconsistent style, multiple people, 
blurry, low quality, background scenery, deformed limbs, 
mixed styles, realistic, 3d render
```

#### 步骤5：生成参数

**关键参数调整：**

| 参数 | 精确复制 | 创意改编 |
|------|---------|---------|
| ControlNet Strength | 1.0 | 0.7 |
| Denoise | 0.75 | 0.9 |
| IP-Adapter Weight | 0.9 | 0.6 |
| CFG Scale | 7.5 | 9.0 |
| Steps | 30-40 | 20-30 |

### 高级技巧

#### 技巧1：分帧处理（最精确）

如果整张序列帧效果不好，可以：

1. 用工具切分序列帧为单个帧
2. 对每一帧单独处理
3. 处理后重新拼接

**自动化脚本：**
```javascript
// 使用项目中的工具
node resize-tool.js --split sprite_sheet.png --frames 8 --output frames/
// 处理每一帧...
node resize-tool.js --merge frames/ --output new_sprite_sheet.png
```

#### 技巧2：使用Tile ControlNet保持布局

```
原序列帧 → ControlNet Tile (strength: 0.8)
        → 保持每帧的精确位置和间距
```

#### 技巧3：多次迭代优化

```
第1次：Denoise 0.9，获得初步结果
第2次：使用第1次结果作为输入，Denoise 0.5，精修细节
第3次：Denoise 0.3，微调
```

## 常见问题

### Q: 角色在不同帧中样式不一致
**A:** 
- 增加 IP-Adapter weight 到 0.9
- 在提示词中添加 "consistent character design, exact same character"
- 降低 CFG Scale 到 7.0

### Q: 姿势变形了
**A:**
- 增加 ControlNet strength 到 1.0
- 尝试使用 Canny + Depth 双重控制
- 降低 Denoise 到 0.7

### Q: 像素风格变模糊了
**A:**
- 添加提示词："sharp pixel art, crisp edges, no blur, no antialiasing"
- 使用专门的像素风格模型
- 后期使用 `resize-tool.js` 或 Photoshop 的 Nearest Neighbor 缩放

### Q: 序列帧布局错乱
**A:**
- 使用 Tile ControlNet 保持布局
- 考虑分帧处理后重新拼接
- 检查输入图像尺寸是否正确

## 推荐工作流模板

根据您的需求选择：

1. **[05_character_replacement_sprite_sheet.json](05_character_replacement_sprite_sheet.json)** - 基础版本
2. **[03_ipadapter_style.json](03_ipadapter_style.json)** - 风格迁移版本
3. **[02_controlnet_pose.json](02_controlnet_pose.json)** - 姿势控制版本

## 完整示例

### 输入：
- 原图：8帧骷髅行走动画（128x128像素 × 8帧）
- 参考：骑士角色立绘

### ComfyUI设置：
```
Checkpoint: dreamshaper_8.safetensors
ControlNet: OpenPose (strength 1.0)
IP-Adapter: weight 0.85
Positive: "pixel art knight, silver armor, 8 frames walk cycle, consistent design"
Negative: "different characters, blurry, inconsistent"
Steps: 35
CFG: 7.5
Denoise: 0.8
```

### 输出：
- 新图：8帧骑士行走动画，保持相同姿势和布局

## 性能优化

- **显存不足：** 减小图像尺寸，处理完后放大
- **生成太慢：** 减少 steps 到 20-25
- **批量处理：** 使用 ComfyUI 的 Batch 功能

## 相关资源

- [IP-Adapter 模型下载](../download-ipadapter-models.ps1)
- [ControlNet 设置指南](CONTROLNET_SETUP.md)
- [提示词库](prompts_library.txt)
