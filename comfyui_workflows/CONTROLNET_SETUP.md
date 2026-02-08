# ControlNet 模型安装指南

## 🎯 什么是 ControlNet？

ControlNet 可以精确控制生成图像的姿势、轮廓、深度等，对于生成精灵图动画非常有用。

---

## 📁 存放位置

```
D:\tool\comfyFile\models\controlnet\
```

---

## ⚡ 快速安装（推荐）

### 方法 1：使用脚本自动下载

```powershell
cd D:\workplace\gameDemo\ripper-project

# 下载 OpenPose（精灵图必需）
.\download-controlnet.ps1 -Model openpose

# 或下载所有常用模型（约 6GB）
.\download-controlnet.ps1 -Model all
```

---

## 🎨 推荐模型（按优先级）

### 1. OpenPose（必需 - 精灵图动画用）
- **文件名**: `control_v11p_sd15_openpose.pth`
- **大小**: 1.45GB
- **用途**: 控制角色姿势，生成不同动作帧
- **优先级**: ⭐⭐⭐⭐⭐

### 2. Canny（推荐 - 保持轮廓）
- **文件名**: `control_v11p_sd15_canny.pth`
- **大小**: 1.45GB
- **用途**: 边缘检测，保持角色轮廓
- **优先级**: ⭐⭐⭐⭐

### 3. Lineart（可选 - 线稿风格）
- **文件名**: `control_v11p_sd15_lineart.pth`
- **大小**: 1.45GB
- **用途**: 线稿控制，适合像素艺术
- **优先级**: ⭐⭐⭐

### 4. Depth（可选 - 深度控制）
- **文件名**: `control_v11f1p_sd15_depth.pth`
- **大小**: 1.45GB
- **用途**: 深度图控制
- **优先级**: ⭐⭐

---

## 📥 手动下载方法

### 从 Hugging Face 下载

**步骤**：

1. **访问官方仓库**
   ```
   https://huggingface.co/lllyasviel/ControlNet-v1-1/tree/main
   ```

2. **找到并下载文件**
   - 点击 `control_v11p_sd15_openpose.pth`
   - 点击右上角的下载按钮（↓图标）
   - 等待下载完成（约 1.45GB）

3. **保存到正确位置**
   ```
   移动到: D:\tool\comfyFile\models\controlnet\
   ```

4. **验证文件**
   ```powershell
   Get-Item "D:\tool\comfyFile\models\controlnet\control_v11p_sd15_openpose.pth"
   ```
   应该显示约 1.45GB

---

## 🚀 使用国内镜像加速

如果 Hugging Face 下载太慢：

### 方法 1：使用 HF Mirror

```powershell
# 使用镜像 URL（更快）
$url = "https://hf-mirror.com/lllyasviel/ControlNet-v1-1/resolve/main/control_v11p_sd15_openpose.pth"
$output = "D:\tool\comfyFile\models\controlnet\control_v11p_sd15_openpose.pth"

curl.exe -L -o $output $url --progress-bar
```

### 方法 2：使用 ModelScope

访问：https://modelscope.cn/models/lllyasviel/ControlNet-v1-1

---

## ✅ 验证安装

```powershell
# 检查已安装的模型
Get-ChildItem "D:\tool\comfyFile\models\controlnet" | Select-Object Name, @{N='Size(MB)';E={[math]::Round($_.Length/1MB, 0)}}
```

**应该看到**：
```
Name                               Size(MB)
----                               --------
control_v11p_sd15_openpose.pth     1445
```

---

## 🔧 在 ComfyUI 工作流中使用

安装 OpenPose 后，工作流 `02_controlnet_pose.json` 会自动识别：

1. 导入工作流到 ComfyUI
2. 找到 `ControlNetLoader` 节点
3. 下拉菜单会显示 `control_v11p_sd15_openpose.pth`
4. 准备姿势参考图即可使用

---

## 🎨 创建姿势参考图

### 在线工具（最简单）

**OpenPose Editor**：
- https://openposetest.com
- 免费，在线使用
- 拖拽创建火柴人姿势

### 手机 APP

**Magic Poser**：
- iOS/Android 都有
- 可以摆出各种姿势
- 导出为图片

### 简笔画（最快）

用任何绘图软件画火柴人：
- 头：圆形
- 身体：直线
- 四肢：连接的线条

ComfyUI 会自动识别简单的姿势草图！

---

## 🐛 常见问题

### Q: 下载速度很慢？
**A**: 
- 使用脚本下载（支持断点续传）
- 或使用国内镜像（HF Mirror / ModelScope）
- 或搜索网盘分享

### Q: 文件大小不对？
**A**: 
- 正确的文件应该是 ~1.45GB
- 如果只有几KB，可能下载失败
- 重新下载

### Q: ComfyUI 找不到模型？
**A**: 
```powershell
# 检查文件位置
Test-Path "D:\tool\comfyFile\models\controlnet\control_v11p_sd15_openpose.pth"

# 应该返回 True
```
- 确保文件在 controlnet 文件夹内
- 重启 ComfyUI
- 刷新浏览器（Ctrl+F5）

### Q: 是否需要所有 ControlNet 模型？
**A**: 不需要
- **最少**: 只要 OpenPose（用于姿势控制）
- **推荐**: OpenPose + Canny（更好的效果）
- **完整**: 下载全部（如果磁盘空间充足）

---

## 📊 磁盘空间需求

| 配置 | 模型数量 | 总大小 | 适用场景 |
|------|---------|--------|----------|
| 最小安装 | 1个（OpenPose） | ~1.5GB | 基础姿势控制 |
| 推荐安装 | 2个（OpenPose+Canny） | ~3GB | 精灵图生成 |
| 完整安装 | 4个（全部） | ~6GB | 各种风格实验 |

---

## 🎯 快速开始清单

- [ ] 确认有足够磁盘空间（至少 2GB）
- [ ] 运行下载脚本或手动下载 OpenPose
- [ ] 验证文件大小约 1.45GB
- [ ] 重启 ComfyUI（如果已打开）
- [ ] 导入 02_controlnet_pose.json 工作流
- [ ] 准备姿势参考图
- [ ] 开始生成！

---

## 📞 获取帮助

如果遇到问题：
1. 检查文件是否在正确目录
2. 确认文件大小是否正确
3. 尝试重启 ComfyUI
4. 查看 ComfyUI 控制台是否有错误信息

---

完成安装后，就可以使用 ControlNet 精确控制精灵图的姿势了！
