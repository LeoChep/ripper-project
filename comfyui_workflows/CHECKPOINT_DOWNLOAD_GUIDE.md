# ComfyUI Checkpoint 完整下载指南

## 📁 存放位置

所有 Checkpoint 模型必须放在：
```
D:\tool\comfyFile\models\checkpoints\
```

---

## 🎯 推荐模型列表（像素艺术专用）

### 1. DreamShaper 8（强烈推荐）
- **大小**: 2GB
- **特点**: 通用性强，细节好，适合像素艺术
- **下载**:
  1. 访问：https://civitai.com/models/4384/dreamshaper
  2. 点击 "Download" 按钮
  3. 选择 **DreamShaper 8** 版本
  4. 下载 `.safetensors` 格式
  5. 保存到 `D:\tool\comfyFile\models\checkpoints\`

### 2. ReV Animated v1.2.2（卡通风格）
- **大小**: 2GB
- **特点**: 偏卡通，适合Q版角色
- **下载**: https://civitai.com/models/7371/rev-animated

### 3. Deliberate v2（平衡型）
- **大小**: 2GB
- **特点**: 细节和风格化平衡
- **下载**: https://civitai.com/models/4823/deliberate

---

## 📥 下载方法详解

### 方法 A：Civitai 下载（最简单）

**步骤**：

1. **访问 Civitai**
   ```
   https://civitai.com
   ```

2. **搜索模型**
   - 在搜索框输入 "DreamShaper 8"
   - 或直接访问上面的链接

3. **下载模型**
   - 点击蓝色 "Download" 按钮
   - 选择 `.safetensors` 格式（文件较小，推荐）
   - 如果提示登录，可以免费注册

4. **保存文件**
   ```powershell
   # 移动下载的文件到正确位置
   Move-Item "C:\Users\你的用户名\Downloads\dreamshaper_8.safetensors" "D:\tool\comfyFile\models\checkpoints\"
   ```

---

### 方法 B：Hugging Face 下载（国外需要魔法）

1. 访问：https://huggingface.co/models
2. 搜索："stable diffusion checkpoint"
3. 选择模型，点击 "Files and versions"
4. 下载 `.safetensors` 文件

**常用链接**：
- DreamShaper: https://huggingface.co/Lykon/DreamShaper/tree/main
- ReV Animated: https://huggingface.co/s6yx/ReV_Animated

---

### 方法 C：使用脚本下载

```powershell
# 在项目目录运行
cd D:\workplace\gameDemo\ripper-project

# 查看可用模型
.\download-checkpoint.ps1

# 下载 DreamShaper 8
.\download-checkpoint.ps1 -Model dreamshaper

# 下载 ReV Animated
.\download-checkpoint.ps1 -Model revanimated
```

**注意**：脚本下载可能较慢或失败（取决于网络），建议使用方法A手动下载。

---

### 方法 D：国内镜像站（最快）

**LiblibAI（国内）**：
1. 访问：https://www.liblib.art
2. 搜索 "DreamShaper" 或 "像素艺术"
3. 下载模型（需注册）
4. 保存到 checkpoints 目录

**ModelScope（阿里云）**：
1. 访问：https://modelscope.cn
2. 搜索 Stable Diffusion 相关模型
3. 下载后放到 checkpoints 目录

---

## ✅ 验证安装

**检查文件是否正确**：

```powershell
# 列出已安装的 checkpoints
Get-ChildItem "D:\tool\comfyFile\models\checkpoints\" | Select-Object Name, @{N='Size(GB)';E={[math]::Round($_.Length/1GB, 2)}}
```

**应该看到类似输出**：
```
Name                          Size(GB)
----                          --------
dreamshaper_8.safetensors     1.98
```

---

## 🎨 推荐的像素艺术增强 LoRA

除了 Checkpoint，还建议下载 LoRA（小文件，增强特定风格）：

**存放位置**：`D:\tool\comfyFile\models\loras\`

**推荐下载**：

1. **Pixel Art XL**
   - https://civitai.com/models/120096/pixel-art-xl
   - 专门用于像素艺术生成

2. **Game Icon Institute**
   - https://civitai.com/models/110766/game-icon-institute
   - 游戏图标和精灵图专用

3. **16Bit Scene**
   - https://civitai.com/models/80743/16bit-scene
   - 16位复古游戏风格

**下载后放到**：
```
D:\tool\comfyFile\models\loras\
```

---

## 🔧 在 ComfyUI 中使用

**启动 ComfyUI 后**：

1. 找到 "CheckpointLoaderSimple" 节点
2. 点击下拉菜单
3. 选择你下载的模型（如 `dreamshaper_8.safetensors`）

**如果模型没有出现**：
- 检查文件是否在正确目录
- 重启 ComfyUI
- 清除浏览器缓存（Ctrl+F5）

---

## 📊 文件大小参考

| 文件类型 | 大小 | 说明 |
|---------|------|------|
| Checkpoint (.safetensors) | 2-7GB | 必需的主模型 |
| Checkpoint (.ckpt) | 2-7GB | 旧格式，不推荐 |
| LoRA (.safetensors) | 10-200MB | 可选的风格增强 |
| VAE (.safetensors) | 300MB | 可选的质量提升 |

---

## ⚡ 加速下载技巧

### 1. 使用下载工具
```powershell
# 安装 aria2（多线程下载）
winget install aria2

# 使用 aria2 下载（比浏览器快很多）
aria2c -x 16 -s 16 "https://civitai.com/api/download/models/128713" -o dreamshaper_8.safetensors
```

### 2. 使用代理（如果 Civitai 慢）
- 配置系统代理
- 或使用国内镜像站

### 3. 网盘分享（如果下载实在太慢）
- 搜索 "DreamShaper 8 百度网盘"
- 或加入 ComfyUI 中文社群获取分享

---

## 🚨 常见问题

### Q: 下载的文件很小（几百KB）？
**A**: 可能下载了网页而非模型文件
- 确保点击的是实际下载链接
- 查看文件扩展名是否为 `.safetensors`

### Q: ComfyUI 找不到模型？
**A**: 检查文件位置
```powershell
# 应该在这里
D:\tool\comfyFile\models\checkpoints\dreamshaper_8.safetensors

# 而不是
D:\tool\comfyFile\models\dreamshaper_8.safetensors  # 错误！
```

### Q: 下载速度太慢？
**A**: 
- 使用 aria2 多线程下载
- 换国内镜像站（LiblibAI）
- 使用网盘分享

### Q: 需要下载多少个模型？
**A**: 
- **最少**: 1个 Checkpoint（如 DreamShaper 8）就能用
- **推荐**: 2-3个不同风格的 Checkpoint + 1-2个 LoRA

---

## 🎯 快速开始清单

- [ ] 创建 checkpoints 目录（如果不存在）
- [ ] 下载 DreamShaper 8（必需）
- [ ] 验证文件大小约 2GB
- [ ] 确认文件在正确位置
- [ ] 启动 ComfyUI 测试是否能选择模型
- [ ] （可选）下载 Pixel Art LoRA

---

## 📞 获取帮助

如果下载遇到问题：

1. **检查磁盘空间**：确保 D 盘至少有 10GB 空间
2. **检查网络**：Civitai 需要良好的国际网络
3. **使用备用方案**：国内镜像站或网盘分享

---

完成下载后，就可以导入工作流开始生成精灵图了！
