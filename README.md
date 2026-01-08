# HackDuck - HTTP Request Debugger

一个强大的浏览器扩展，用于 HTTP 请求的调试、拦截和修改。HackDuck 提供了两种工作模式：**Burp 模式**和 **HackBar 模式**，满足不同的使用场景。

## 功能特性

- 🔍 **实时请求拦截** - 捕获浏览器发出的所有 HTTP 请求
- ✏️ **请求编辑** - 修改请求头、参数、方法等
- 🚀 **请求重放** - 重新发送修改后的请求
- 📚 **请求历史** - 保存和管理请求记录
- 🔄 **批量操作** - 支持批量修改和发送
- 🌐 **多浏览器支持** - 兼容 Chrome、Edge、Firefox
- 🎨 **语法高亮** - 请求编辑器支持语法高亮和表格视图
- 📝 **用户笔记** - HackBar 模式支持用户笔记功能

## 两种工作模式

### 🔧 Burp 模式

类似 Burp Suite 的请求拦截和编辑界面，适合批量查看和管理请求。

**主要功能：**

- 📋 请求列表：实时显示所有捕获的 HTTP 请求
- 🔍 请求过滤：支持按域名、静态资源过滤
- ✏️ 请求编辑器：支持文本视图和表格视图，语法高亮显示
- 📊 响应查看器：查看请求的响应头和响应体
- 🔄 请求重放：修改后重新发送请求

![Burp 模式](images/burp_mode.png)

### ⚡ HackBar 模式

类似 HackBar 的快速请求编辑和发送界面，适合快速测试和调试。

**主要功能：**

- 🚀 快速编辑：简洁的界面，快速修改请求
- 📝 用户笔记：支持保存用户笔记，方便记录测试思路
- 🎯 当前页面请求：一键加载当前页面的请求
- 📤 快速发送：修改后立即发送请求

![HackBar 模式](images/hackbar_mode.png)

## 本地编译和安装

### 1. 克隆项目

```bash
git clone https://github.com/fxe00/hackduck.git
cd hackduck
```

### 2. 安装依赖

```bash
npm install
```

### 3. 编译项目

编译生产版本（用于安装到浏览器）：

```bash
npm run build
```

编译完成后，会在项目根目录生成 `dist` 文件夹，包含所有编译后的文件。

**开发模式（可选）：**

如果需要开发调试，可以使用开发模式，支持热重载：

```bash
npm run dev
```

### 4. 安装到浏览器

#### Chrome / Edge 浏览器

1. 打开浏览器，访问扩展管理页面：

   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`

2. 启用"开发者模式"（Developer mode）

   - 在页面右上角找到"开发者模式"开关，将其打开

3. 加载扩展

   - 点击"加载已解压的扩展程序"（Load unpacked）按钮
   - 选择项目的 `dist` 文件夹（**注意：是 dist 文件夹，不是项目根目录**）

4. 完成安装
   - 扩展加载成功后，会在扩展列表中显示
   - 打开浏览器开发者工具（F12），可以看到 "HackDuck" 标签页

#### Firefox 浏览器

1. 打开 Firefox，访问 `about:debugging`
2. 点击"此 Firefox"（This Firefox）
3. 点击"临时载入附加组件"（Load Temporary Add-on）
4. 选择 `dist` 文件夹中的 `manifest.json` 文件

### 5. 使用扩展

1. 打开浏览器开发者工具（F12）
2. 切换到 "HackDuck" 标签页
3. 选择工作模式：
   - **Burp 模式**：查看和管理所有捕获的请求
   - **HackBar 模式**：快速编辑和发送请求

## 开发说明

### 项目结构

```
hackduck/
├── src/
│   ├── components/      # Vue 组件
│   ├── core/           # 核心逻辑（background, content, injected）
│   ├── assets/         # 静态资源
│   └── styles.css      # 全局样式
├── dist/               # 编译输出目录（用于安装到浏览器）
├── images/             # 截图和图片资源
└── package.json        # 项目配置
```

### 构建命令

- `npm run build` - 构建生产版本（输出到 dist 目录）
- `npm run dev` - 开发模式，支持热重载
- `npm run package` - 构建并打包为 zip 文件

## 技术栈

- TypeScript
- WebExtensions API
- Webpack
- CSS3
- HTML5

## 浏览器兼容性

- Chrome 88+
- Firefox 78+
- Edge 88+

## 许可证

MIT License
