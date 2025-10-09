# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2024-10-09

### Added
- 🎨 **自定义图标系统** - 支持完整的图标尺寸集合
- 🚀 **GitHub Actions自动发布** - 推送tag自动构建和发布
- 📋 **持续集成** - 每次推送自动测试构建
- 📖 **详细文档** - 完整的发布和使用指南

### Enhanced
- 🎯 **图标优化** - 使用sips工具生成高质量多尺寸图标
- 📦 **构建流程** - 自动化Chrome、Firefox、Edge版本构建
- 🔧 **开发体验** - 简化发布流程，专注功能开发

### Technical
- 添加GitHub Actions workflows (release.yml, ci.yml)
- 优化图标文件大小和质量
- 完善构建脚本和自动化流程
- 增加详细的发布和使用文档

## [1.0.0] - 2024-10-09

### Added
- 🔍 **实时请求拦截** - 捕获浏览器发出的所有HTTP请求
- 🛠️ **双模式操作界面** - Burp Suite模式和HackBar模式
- 🎯 **右键编码菜单** - Base64、URL、HTML编码/解码，MD5、SHA256哈希
- ↩️ **撤销/重做功能** - 支持Ctrl+Z/Y操作历史
- 📏 **动态高度调整** - 自动适应F12 DevTools面板高度
- 🌐 **多浏览器支持** - Chrome、Firefox、Edge兼容

### Features
- **Burp Suite模式**：请求列表、编辑器、响应查看器
- **HackBar模式**：原生浏览器导航、紧凑布局
- **编码工具**：右键菜单支持多种编码/解码
- **历史管理**：完整的撤销/重做功能
- **响应式设计**：适配不同屏幕尺寸

### Technical
- Vue 3 + TypeScript架构
- Ant Design Vue组件库
- WebExtensions API
- Webpack构建系统
- 响应式UI设计
