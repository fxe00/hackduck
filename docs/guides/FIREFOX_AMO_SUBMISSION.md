# Firefox Add-ons (AMO) 提交指南

## 🦊 将HackDuck提交到Firefox官方扩展商店

### 步骤1：准备扩展包

1. **构建Firefox版本**
   ```bash
   ./scripts/build-firefox.sh
   ```

2. **检查文件结构**
   ```
   releases/dist-firefox/
   ├── manifest.json
   ├── background.js
   ├── content.js
   ├── devtools.html
   ├── devtools.js
   ├── injected.js
   └── icons/
       ├── icon16.png
       ├── icon32.png
       ├── icon48.png
       └── icon128.png
   ```

### 步骤2：创建AMO账户

1. 访问 [Firefox Add-ons Developer Hub](https://addons.mozilla.org/developers/)
2. 使用GitHub账户登录
3. 验证邮箱地址
4. 完成开发者认证

### 步骤3：准备扩展信息

#### 基本信息
- **名称**: HackDuck - HTTP Request Debugger
- **版本**: 1.1.0
- **描述**: A powerful browser extension for HTTP request debugging and manipulation
- **分类**: Developer Tools
- **标签**: http, debug, request, interceptor, devtools

#### 详细描述
```markdown
# HackDuck - HTTP Request Debugger

## 🎯 功能特性

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

## 🚀 使用场景

- **Web开发调试**：分析API请求和响应
- **安全测试**：修改请求参数进行安全测试
- **性能分析**：监控请求响应时间
- **API测试**：快速测试各种HTTP方法
- **学习HTTP协议**：理解HTTP请求和响应机制

## 📋 系统要求

- **Firefox版本**：78.0 或更高
- **权限**：需要访问所有网站
- **兼容性**：支持所有现代网站

## 🔒 隐私说明

- 本扩展仅在本地处理HTTP请求数据
- 不会向外部服务器发送任何数据
- 所有数据都存储在本地浏览器中
- 遵循Firefox扩展隐私政策

## 📞 支持

- **GitHub**: https://github.com/fxe00/hackduck
- **Issues**: https://github.com/fxe00/hackduck/issues
- **文档**: https://github.com/fxe00/hackduck#readme
```

### 步骤4：上传扩展

1. **登录AMO开发者中心**
   - 访问 https://addons.mozilla.org/developers/
   - 点击"Submit a New Add-on"

2. **选择上传方式**
   - 选择"On this site"（推荐）
   - 上传 `hackduck-firefox-v1.1.0.zip`

3. **填写扩展信息**
   - 名称：HackDuck - HTTP Request Debugger
   - 描述：使用上面的详细描述
   - 分类：Developer Tools
   - 标签：http, debug, request, interceptor, devtools

### 步骤5：等待审核

1. **审核流程**
   - 自动审核：几分钟到几小时
   - 人工审核：1-7个工作日
   - 审核通过后自动获得签名

2. **审核要求**
   - 代码质量检查
   - 安全性检查
   - 功能完整性验证
   - 隐私政策合规

### 步骤6：发布管理

1. **版本管理**
   - 每次更新需要重新提交
   - 保持版本号递增
   - 更新变更日志

2. **用户反馈**
   - 监控用户评价
   - 回复用户问题
   - 持续改进功能

## 📋 审核清单

### 代码质量
- [ ] 代码结构清晰
- [ ] 注释完整
- [ ] 错误处理完善
- [ ] 性能优化

### 安全性
- [ ] 权限最小化
- [ ] 数据安全
- [ ] 无恶意代码
- [ ] 遵循安全最佳实践

### 用户体验
- [ ] 界面友好
- [ ] 功能完整
- [ ] 文档清晰
- [ ] 错误提示友好

### 合规性
- [ ] 遵循Firefox扩展政策
- [ ] 隐私政策完整
- [ ] 开源协议明确
- [ ] 用户协议清晰

## 🎯 成功发布后的优势

1. **官方签名**：自动获得Mozilla官方签名
2. **用户信任**：通过官方渠道分发
3. **自动更新**：支持Firefox自动更新
4. **广泛分发**：覆盖更多用户
5. **官方支持**：获得Mozilla技术支持

---

**HackDuck Team** - 让Firefox扩展发布更简单！
