# GitHub Release 发布指南

## 📋 发布前检查清单

### ✅ 代码准备

- [x] 所有功能已完成并测试
- [x] 版本号已更新到 v1.0.0
- [x] 构建脚本已创建
- [x] 所有浏览器版本已构建
- [x] 发布说明已编写

### ✅ 构建文件

- [x] `hackduck-chrome-v1.0.0.zip` - Chrome 版本
- [x] `hackduck-firefox-v1.0.0.zip` - Firefox 版本
- [x] `hackduck-edge-v1.0.0.zip` - Edge 版本

## 🚀 GitHub 发布步骤

### 1. 创建 GitHub 仓库

```bash
# 在GitHub上创建新仓库：hackduck
# 仓库描述：A powerful browser extension for HTTP request debugging and manipulation
# 设置为公开仓库
# 添加README.md
# 添加MIT许可证
```

### 2. 推送代码到 GitHub

```bash
# 添加远程仓库
git remote add origin https://github.com/YOUR_USERNAME/hackduck.git

# 推送代码
git branch -M main
git push -u origin main
```

### 3. 创建 Release 标签

```bash
# 创建v1.0.0标签
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

### 4. 在 GitHub 上创建 Release

#### 访问 GitHub Release 页面

- 进入仓库页面
- 点击右侧的"Releases"
- 点击"Create a new release"

#### 填写 Release 信息

- **Tag version**: `v1.0.0`
- **Release title**: `HackDuck v1.0.0`
- **Description**: 使用`RELEASE_NOTES_v1.0.0.md`的内容

#### 上传构建文件

- 上传 `hackduck-chrome-v1.0.0.zip`
- 上传 `hackduck-firefox-v1.0.0.zip`
- 上传 `hackduck-edge-v1.0.0.zip`

#### 发布设置

- 勾选"This is a pre-release"（如果是预发布版本）
- 点击"Publish release"

## 📝 Release 描述模板

```markdown
# HackDuck v1.0.0

## 🎉 首次正式发布

HackDuck 是一个强大的浏览器扩展，专为 HTTP 请求调试和操作而设计。支持 Chrome、Firefox 和 Edge 浏览器。

## ✨ 主要功能

### 🔍 实时请求拦截

- 捕获浏览器发出的所有 HTTP 请求
- 实时显示请求详情（URL、方法、状态码、响应时间）
- 智能过滤静态资源请求
- 支持按域名过滤请求

### 🛠️ 双模式操作界面

#### Burp Suite 模式

- **请求列表**：显示所有捕获的请求，支持高亮选中
- **请求编辑器**：左侧编辑 HTTP 请求内容
- **响应查看器**：右侧查看响应内容（只读）
- **方法切换**：支持 GET/POST 等方法切换，自动调整参数位置
- **请求发送**：重新发送修改后的请求

#### HackBar 模式

- **当前页面加载**：快速加载当前页面的 URL 和参数
- **请求编辑**：修改 URL、请求头、请求体
- **原生浏览器导航**：使用浏览器原生功能发送请求，绕过 CORS 限制
- **紧凑布局**：专为快速操作设计

### 🎯 高级功能

#### 右键编码菜单

- **Base64 编码/解码**
- **URL 编码/解码**
- **HTML 编码/解码**
- **MD5 哈希**
- **SHA256 哈希**
- 支持在请求编辑器和 HackBar 中使用

#### 撤销/重做功能

- 支持 Ctrl+Z 撤销和 Ctrl+Y 重做
- 完整的历史记录管理
- 最多保存 50 个操作历史

#### 动态高度调整

- 自动适应 F12 DevTools 面板高度
- 支持小屏幕 DevTools 面板
- 智能滚动和内容显示

## 🌐 浏览器支持

### Google Chrome

- **最低版本**：Chrome 88+
- **Manifest 版本**：V3
- **安装方式**：开发者模式加载或 Chrome Web Store

### Mozilla Firefox

- **最低版本**：Firefox 78+
- **Manifest 版本**：V2（兼容性优化）
- **安装方式**：about:debugging 或 Firefox Add-ons

### Microsoft Edge

- **最低版本**：Edge 88+
- **Manifest 版本**：V3
- **安装方式**：开发者模式加载或 Microsoft Edge Add-ons

## 📦 安装说明

### 开发者安装

1. 下载对应浏览器的 ZIP 文件
2. 解压到本地目录
3. 打开浏览器扩展管理页面
4. 启用"开发者模式"
5. 点击"加载已解压的扩展程序"
6. 选择解压后的文件夹

### 使用说明

1. 安装扩展后，打开 F12 开发者工具
2. 在 DevTools 面板中找到"HackDuck"标签
3. 选择 Burp Suite 模式或 HackBar 模式
4. 开始调试 HTTP 请求

## 🔧 技术特性

- **Vue 3 + TypeScript**：现代化的前端框架
- **Ant Design Vue**：美观的 UI 组件库
- **WebExtensions API**：标准浏览器扩展 API
- **Webpack 构建**：优化的打包和构建系统
- **响应式设计**：适配不同屏幕尺寸

## 📋 文件清单

### Chrome 版本

- `hackduck-chrome-v1.0.0.zip`
- 包含 Chrome 优化的 manifest.json
- 支持 Manifest V3 特性

### Firefox 版本

- `hackduck-firefox-v1.0.0.zip`
- 包含 Firefox 兼容的 manifest.json
- 使用 Manifest V2 确保兼容性

### Edge 版本

- `hackduck-edge-v1.0.0.zip`
- 包含 Edge 优化的 manifest.json
- 支持 Manifest V3 特性

## 🚀 未来计划

- [ ] 支持更多 HTTP 方法（PUT、DELETE、PATCH 等）
- [ ] 添加请求/响应历史记录
- [ ] 支持自定义脚本注入
- [ ] 添加请求性能分析
- [ ] 支持批量请求操作

## 📄 许可证

MIT License - 详见 LICENSE 文件

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 支持

如有问题，请通过 GitHub Issues 联系我们。

---

**HackDuck Team** - 让 HTTP 调试更简单！
```

## 🎯 发布后任务

### 1. 更新 README.md

- 添加安装说明
- 添加功能截图
- 添加使用示例

### 2. 创建 GitHub Pages（可选）

- 创建项目网站
- 添加在线文档
- 添加演示视频

### 3. 社区推广

- 在相关技术社区分享
- 创建技术博客文章
- 制作演示视频

## 📊 发布检查清单

- [ ] 所有构建文件已生成
- [ ] 版本号已更新
- [ ] 发布说明已编写
- [ ] GitHub 仓库已创建
- [ ] 代码已推送到 GitHub
- [ ] Release 标签已创建
- [ ] GitHub Release 已发布
- [ ] 构建文件已上传
- [ ] 文档已更新
