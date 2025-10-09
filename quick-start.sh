#!/bin/bash

echo "🚀 HackDuck 快速启动指南"
echo "=========================="

# 检查是否已构建
if [ ! -d "dist" ]; then
    echo "📦 正在构建项目..."
    npm run build
fi

echo ""
echo "✅ 项目已准备就绪！"
echo ""
echo "📋 接下来的步骤："
echo "1. 打开Chrome浏览器，访问 chrome://extensions/"
echo "2. 开启右上角的'开发者模式'"
echo "3. 点击'加载已解压的扩展程序'"
echo "4. 选择这个项目的 'dist' 文件夹"
echo "5. 打开任意网页，按F12打开开发者工具"
echo "6. 在开发者工具中会看到'HackDuck'标签页"
echo ""
echo "🎯 测试建议："
echo "- 访问 https://httpbin.org 进行API测试"
echo "- 访问 https://jsonplaceholder.typicode.com 进行数据测试"
echo "- 在HackDuck面板中开启'拦截请求'开关"
echo ""
echo "📖 详细测试指南请查看 TEST_GUIDE.md"
echo ""
echo "🎉 开始使用HackDuck吧！"
