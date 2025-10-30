// index.js - Electron应用入口点
const { app } = require('electron');
const path = require('path');
const fs = require('fs');

// 显示启动信息
console.log('======================================');
console.log('Android桌面模拟器 v1.0');
console.log('准备启动应用...');
console.log('======================================');

// 检查main.js是否存在
const mainJsPath = path.join(__dirname, 'main.js');
if (fs.existsSync(mainJsPath)) {
  console.log('正在加载主程序文件...');
  // 加载主程序文件
  require('./main.js');
} else {
  console.error('错误: 找不到main.js文件');
  console.error('请确保您在正确的目录中运行应用');
  app.exit(1);
}