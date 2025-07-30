# 本地服务器使用说明

这个文件夹包含了多种启动本地服务器的方法，用于绕过CORS限制测试视频文件。

## 方法一：Python服务器（推荐）

### 快速启动
```bash
# 双击运行
start_server.bat

# 或者手动运行
python server.py
```

### 自定义端口
```bash
python server.py 3000
```

## 方法二：Node.js服务器

### 安装依赖
```bash
npm install
```

### 启动服务器
```bash
npm start
# 或者
node server.js
```

## 方法三：使用VSCode内置服务器

1. 在VSCode中右键点击 `index.html`
2. 选择 "Open with Live Server"（需要安装Live Server扩展）

## 访问地址

服务器启动后，在浏览器中访问：
- http://localhost:8080
- http://127.0.0.1:8080

## 功能特性

✅ 支持CORS跨域访问
✅ 正确处理视频文件MIME类型
✅ 自动端口冲突处理
✅ 简单易用的界面

## 故障排除

如果遇到端口占用问题，服务器会自动尝试下一个端口。
如果Python/Node.js未安装，请先安装对应的运行环境。
