const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

// 启用CORS
app.use(cors());

// 设置静态文件服务
app.use(express.static(__dirname));

// 特殊处理视频文件，确保正确的MIME类型
app.get('*.webm', (req, res) => {
  res.type('video/webm');
  res.sendFile(path.join(__dirname, req.path));
});

app.get('*.mp4', (req, res) => {
  res.type('video/mp4');
  res.sendFile(path.join(__dirname, req.path));
});

// 默认路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log('🚀 Node.js 服务器启动成功!');
  console.log(`📍 本地地址: http://localhost:${PORT}`);
  console.log(`📂 服务目录: ${__dirname}`);
  console.log('=' * 50);
  console.log('💡 使用 Ctrl+C 停止服务器');
  console.log('=' * 50);
});
