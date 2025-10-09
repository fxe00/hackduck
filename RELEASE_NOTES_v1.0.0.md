# HackDuck v1.0.0 Release Notes

## 🎉 首次正式发布

HackDuck是一个强大的浏览器扩展，专为HTTP请求调试和操作而设计。支持Chrome、Firefox和Edge浏览器。

## ✨ 主要功能

### 🔍 实时请求拦截
- 捕获浏览器发出的所有HTTP请求
- 实时显示请求详情（URL、方法、状态码、响应时间）
- 智能过滤静态资源请求
- 支持按域名过滤请求

### 🛠️ 双模式操作界面

#### Burp Suite 模式
- **请求列表**：显示所有捕获的请求，支持高亮选中
- **请求编辑器**：左侧编辑HTTP请求内容
- **响应查看器**：右侧查看响应内容（只读）
- **方法切换**：支持GET/POST等方法切换，自动调整参数位置
- **请求发送**：重新发送修改后的请求

#### HackBar 模式
- **当前页面加载**：快速加载当前页面的URL和参数
- **请求编辑**：修改URL、请求头、请求体
- **原生浏览器导航**：使用浏览器原生功能发送请求，绕过CORS限制
- **紧凑布局**：专为快速操作设计

### 🎯 高级功能

#### 右键编码菜单
- **Base64编码/解码**
- **URL编码/解码**
- **HTML编码/解码**
- **MD5哈希**
- **SHA256哈希**
- 支持在请求编辑器和HackBar中使用

#### 撤销/重做功能
- 支持Ctrl+Z撤销和Ctrl+Y重做
- 完整的历史记录管理
- 最多保存50个操作历史

#### 动态高度调整
- 自动适应F12 DevTools面板高度
- 支持小屏幕DevTools面板
- 智能滚动和内容显示

## 🌐 浏览器支持

### Google Chrome
- **最低版本**：Chrome 88+
- **Manifest版本**：V3
- **安装方式**：开发者模式加载或Chrome Web Store

### Mozilla Firefox
- **最低版本**：Firefox 78+
- **Manifest版本**：V2（兼容性优化）
- **安装方式**：about:debugging或Firefox Add-ons

### Microsoft Edge
- **最低版本**：Edge 88+
- **Manifest版本**：V3
- **安装方式**：开发者模式加载或Microsoft Edge Add-ons

## 📦 安装说明

### 开发者安装
1. 下载对应浏览器的ZIP文件
2. 解压到本地目录
3. 打开浏览器扩展管理页面
4. 启用"开发者模式"
5. 点击"加载已解压的扩展程序"
6. 选择解压后的文件夹

### 使用说明
1. 安装扩展后，打开F12开发者工具
2. 在DevTools面板中找到"HackDuck"标签
3. 选择Burp Suite模式或HackBar模式
4. 开始调试HTTP请求

## 🔧 技术特性

- **Vue 3 + TypeScript**：现代化的前端框架
- **Ant Design Vue**：美观的UI组件库
- **WebExtensions API**：标准浏览器扩展API
- **Webpack构建**：优化的打包和构建系统
- **响应式设计**：适配不同屏幕尺寸

## 📋 文件清单

### Chrome版本
- `hackduck-chrome-v1.0.0.zip`
- 包含Chrome优化的manifest.json
- 支持Manifest V3特性

### Firefox版本
- `hackduck-firefox-v1.0.0.zip`
- 包含Firefox兼容的manifest.json
- 使用Manifest V2确保兼容性

### Edge版本
- `hackduck-edge-v1.0.0.zip`
- 包含Edge优化的manifest.json
- 支持Manifest V3特性

## 🚀 未来计划

- [ ] 支持更多HTTP方法（PUT、DELETE、PATCH等）
- [ ] 添加请求/响应历史记录
- [ ] 支持自定义脚本注入
- [ ] 添加请求性能分析
- [ ] 支持批量请求操作

## 📄 许可证

MIT License - 详见LICENSE文件

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📞 支持

如有问题，请通过GitHub Issues联系我们。

---

**HackDuck Team** - 让HTTP调试更简单！
