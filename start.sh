#!/bin/bash

echo "🚀 启动 HackDuck 开发环境..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 请先安装 Node.js"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ 请先安装 npm"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
npm install

# 构建项目
echo "🔨 构建项目..."
npm run build

echo "✅ 构建完成！"
echo ""
echo "📋 安装说明："
echo "1. 打开Chrome浏览器，访问 chrome://extensions/"
echo "2. 开启右上角的'开发者模式'"
echo "3. 点击'加载已解压的扩展程序'"
echo "4. 选择项目的 dist 文件夹"
echo "5. 打开任意网页，按F12打开开发者工具"
echo "6. 在开发者工具中会看到'HackDuck'标签页"
echo ""
echo "🎉 HackDuck 已准备就绪！"
