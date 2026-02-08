# ComfyUI 精灵图生成工作流使用指南

## 📦 文件说明

### 1. `01_basic_sprite_batch.json` - 基础批量生成
**适用场景**：快速生成测试，无需参考图
**优点**：最简单，速度快
**缺点**：风格不稳定，每次生成可能不一致

**使用步骤**：
1. 导入工作流到ComfyUI
2. 修改Prompt中的姿势描述（如"walking pose" → "standing pose"）
3. 调整batch_size（默认9，生成9个不同姿势）
4. 点击Queue Prompt生成

**重要参数**：
- `seed`: 42（固定种子保持风格一致）
- `steps`: 20（生成步数）
- `cfg`: 7.0（提示词遵循度）
- `batch_size`: 9（一次生成9帧）

---

### 2. `02_controlnet_pose.json` - ControlNet姿势控制
**适用场景**：需要精确控制姿势
**优点**：姿势准确可控
**缺点**：需要准备姿势参考图

**使用步骤**：
1. 准备姿势参考图（可以是简笔画火柴人）
2. 将图片放到ComfyUI/input目录
3. 导入工作流
4. 在LoadImage节点选择你的参考图
5. 修改Prompt描述角色特征
6. 生成

**所需模型**：
- `control_v11p_sd15_openpose.pth` 
  下载地址: https://huggingface.co/lllyasviel/ControlNet-v1-1/tree/main

**姿势参考图制作工具**：
- https://openposetest.com （在线制作）
- Magic Poser（手机APP）
- Blender插件（3D软件）

---

### 3. `03_ipadapter_style.json` - 风格参考生成
**适用场景**：需要保持与现有精灵图风格一致
**优点**：风格高度一致
**缺点**：需要提供风格参考图

**使用步骤**：
1. 准备一张你喜欢的精灵图作为风格参考
2. 放到ComfyUI/input目录
3. 导入工作流
4. 在LoadImage节点选择参考图
5. 修改Prompt（描述新姿势，但会保持参考图风格）
6. 生成

**所需模型**：
- `ip-adapter_sd15.safetensors`
  下载: https://huggingface.co/h94/IP-Adapter
- `CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors`
  下载: https://huggingface.co/h94/IP-Adapter/tree/main/sdxl_models

---

## 🔧 安装依赖

### 必需插件（通过ComfyUI Manager安装）

```bash
# 1. 启动ComfyUI Manager
# 进入 ComfyUI界面 → Manager → Install Custom Nodes

# 2. 搜索并安装以下插件：
- ComfyUI-Manager
- ComfyUI's ControlNet Auxiliary Preprocessors
- ComfyUI_IPAdapter_plus
```

### 必需模型下载

```
模型放置路径：

ComfyUI/
├── models/
│   ├── checkpoints/
│   │   └── dreamshaper_8.safetensors  # 主模型
│   ├── controlnet/
│   │   └── control_v11p_sd15_openpose.pth  # OpenPose控制
│   ├── ipadapter/
│   │   └── ip-adapter_sd15.safetensors  # IP-Adapter
│   └── clip_vision/
│       └── CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors
```

**下载链接汇总**：

| 模型 | 大小 | 下载地址 |
|------|------|----------|
| DreamShaper 8 | 2GB | https://civitai.com/models/4384/dreamshaper |
| ControlNet OpenPose | 1.45GB | https://huggingface.co/lllyasviel/ControlNet-v1-1 |
| IP-Adapter SD1.5 | 100MB | https://huggingface.co/h94/IP-Adapter |
| CLIP Vision | 3.69GB | https://huggingface.co/h94/IP-Adapter/tree/main/models/image_encoder |

---

## 🎨 提示词模板

### 正向提示词（根据需要修改）

```
【基础骨架】
pixel art, 2d game sprite, chibi skeleton warrior, 

【姿势描述】（根据帧数修改）
standing idle pose / walking left leg forward / jumping / attacking

【装备描述】
round golden shield with gem center, sword with golden hilt, 
brown leather armor, tattered dark cape, 

【角色特征】
white skull head, black hollow eye sockets, skeletal hands,

【技术要求】
64x64 pixel style, clean pixel art, limited color palette, 
sharp edges, no anti-aliasing, transparent background, 
single character, game asset, top-down RPG view,

【视角】（4个方向）
facing left / facing right / facing away / facing toward camera
```

### 反向提示词（通用，基本不需要改）

```
realistic, photo, 3d render, blurry, smooth, gradient, 
anti-aliasing, soft edges, complex shading, 
multiple characters, background elements, scenery,
text, watermark, signature, logo,
modern art style, high resolution, detailed textures,
anime style (unless you want anime), 
dithering (unless you want dithering)
```

---

## 📋 完整工作流程

### 方案A：一次性生成全部36帧

```
步骤1：准备9个姿势的参考图（火柴人即可）
步骤2：使用 02_controlnet_pose.json
步骤3：批量生成4次，每次改方向：
  - 第1次：prompt加 "facing left, left side view"
  - 第2次：prompt加 "facing right, right side view"  
  - 第3次：prompt加 "facing away, back view"
  - 第4次：prompt加 "facing toward, front view"
步骤4：用PS/GIMP合并成精灵图
```

### 方案B：逐帧精细控制

```
步骤1：生成关键帧（frame 0, 2, 4）
步骤2：用 03_ipadapter_style.json，参考关键帧生成中间帧
步骤3：微调不满意的帧（用inpaint修复）
步骤4：合并精灵图
```

---

## ⚙️ 参数调优建议

### 如果生成效果不理想：

| 问题 | 解决方案 |
|------|----------|
| **风格不一致** | 固定seed，或使用IP-Adapter |
| **姿势不准确** | 使用ControlNet，提供更清晰的姿势图 |
| **太模糊** | 降低cfg到6-7，增加steps到30 |
| **太像3D渲染** | 负向提示词加 "3d, smooth, gradient" |
| **颜色太多** | 提示词加 "limited palette, 16 colors" |
| **边缘有锯齿** | 负向提示词加 "anti-aliasing, blur" |
| **角色太小** | 生成更大分辨率（768x768）再缩小 |

---

## 🎯 快速测试

**5分钟测试流程**：

```bash
1. 只用 01_basic_sprite_batch.json
2. batch_size改为1
3. seed改为：12345
4. 生成1张测试
5. 满意后再改batch_size为9
6. 重复生成4个方向
```

---

## 💡 高级技巧

### 技巧1：使用LoRA提升像素风格

在Checkpoint Loader后添加LoRA Loader节点：
- 推荐LoRA：Pixel Art XL, Game Icon Institute
- 权重：0.6-0.8

### 技巧2：后处理节点

添加在VAEDecode后：
- ImageSharpen（锐化）
- ColorCorrect（调色）
- ImageScale（缩放到64x64）

### 技巧3：批量队列

使用ComfyUI的Queue功能：
```
1. 将4个方向的工作流保存为4个文件
2. 用ComfyUI CLI批量执行
3. 自动生成全部36帧
```

---

## 🐛 常见问题

**Q: 提示"Missing node type"**
A: 安装对应的Custom Nodes插件

**Q: 显存不足**
A: 减少batch_size，或降低分辨率到256x256

**Q: 生成速度慢**
A: 减少steps到15-18，使用DPM++系列采样器

**Q: ControlNet不生效**
A: 检查ControlNet权重是否为0.8-1.0

**Q: 每帧角色位置不一致**
A: 固定seed + 使用ControlNet确保姿势位置一致

---

## 📞 支持

如遇问题，可以：
1. 查看ComfyUI官方文档：https://github.com/comfyanonymous/ComfyUI
2. 查看各插件的GitHub Issues
3. 搜索关键词 "ComfyUI pixel art sprite"

---

## 🎮 最终输出

生成完成后，你应该得到：
- 36张独立图片（4方向 × 9帧）
- 合并为576x254的精灵图（与你的walk.json对应）
- 配合更新后的walk.json使用

祝生成顺利！🎨✨
