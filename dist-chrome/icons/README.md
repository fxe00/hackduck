# HackDuck 图标文件

这个文件夹包含HackDuck扩展的图标文件。

## 图标规格

- icon16.png: 16x16 像素
- icon32.png: 32x32 像素  
- icon48.png: 48x48 像素
- icon128.png: 128x128 像素

## 生成图标

可以使用以下工具将SVG转换为PNG：

1. 使用在线工具如 https://convertio.co/svg-png/
2. 使用ImageMagick: `convert icon.svg -resize 16x16 icon16.png`
3. 使用Inkscape命令行: `inkscape --export-png=icon16.png --export-width=16 --export-height=16 icon.svg`

## 设计说明

图标设计融合了：
- 鸭子形象（代表HackDuck品牌）
- 网络/连接元素（代表HTTP请求）
- 绿色主题（代表安全和调试）
