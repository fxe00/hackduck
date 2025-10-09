# Firefox Add-ons (AMO) 提交检查清单

## 📋 提交前检查清单

### ✅ 1. 扩展包准备
- [x] Firefox版本已构建：`releases/hackduck-firefox-v1.1.0.zip`
- [x] 文件大小合理：~3.5MB
- [x] 包含所有必要文件
- [x] manifest.json格式正确

### ✅ 2. 扩展信息准备

#### 基本信息
- **名称**: HackDuck - HTTP Request Debugger
- **版本**: 1.1.0
- **描述**: A powerful browser extension for HTTP request debugging and manipulation
- **分类**: Developer Tools
- **标签**: http, debug, request, interceptor, devtools, burp, hackbar

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

### ✅ 3. 隐私政策准备

#### 隐私政策内容
```markdown
# HackDuck 隐私政策

## 数据收集
HackDuck不会收集、存储或传输任何用户数据到外部服务器。

## 本地数据处理
- 所有HTTP请求数据仅在本地浏览器中处理
- 数据不会离开用户的设备
- 不会与任何第三方服务共享数据

## 权限使用
- **activeTab**: 用于访问当前标签页的HTTP请求
- **storage**: 用于本地存储用户设置
- **webRequest**: 用于拦截和分析HTTP请求
- **tabs**: 用于与浏览器标签页交互
- **debugger**: 用于DevTools集成

## 数据安全
- 所有数据都存储在本地浏览器中
- 不会向外部服务器发送任何数据
- 遵循Firefox扩展安全最佳实践

## 联系信息
如有隐私相关问题，请通过GitHub Issues联系我们。
```

### ✅ 4. 审核准备

#### 代码质量检查
- [x] 代码结构清晰
- [x] 注释完整
- [x] 错误处理完善
- [x] 性能优化

#### 安全性检查
- [x] 权限最小化
- [x] 数据安全
- [x] 无恶意代码
- [x] 遵循安全最佳实践

#### 用户体验
- [x] 界面友好
- [x] 功能完整
- [x] 文档清晰
- [x] 错误提示友好

## 🚀 提交步骤

### 步骤1：访问AMO开发者中心
1. 打开 https://addons.mozilla.org/developers/
2. 使用GitHub账户登录
3. 验证邮箱地址

### 步骤2：创建新扩展
1. 点击"Submit a New Add-on"
2. 选择"On this site"
3. 上传 `hackduck-firefox-v1.1.0.zip`

### 步骤3：填写扩展信息
1. **名称**: HackDuck - HTTP Request Debugger
2. **描述**: 使用上面的详细描述
3. **分类**: Developer Tools
4. **标签**: http, debug, request, interceptor, devtools, burp, hackbar

### 步骤4：设置发布选项
1. **发布状态**: 公开
2. **自动更新**: 启用
3. **用户反馈**: 启用

### 步骤5：提交审核
1. 检查所有信息
2. 确认隐私政策
3. 提交审核

## 📊 预期审核时间

- **自动审核**: 几分钟到几小时
- **人工审核**: 1-7个工作日
- **审核通过**: 自动获得签名

## 🎯 审核通过后的优势

1. **官方签名**: 自动获得Mozilla官方签名
2. **用户信任**: 通过官方渠道分发
3. **自动更新**: 支持Firefox自动更新
4. **广泛分发**: 覆盖更多用户
5. **官方支持**: 获得Mozilla技术支持

## 📞 审核支持

如果审核遇到问题：
1. 查看AMO审核指南
2. 联系Mozilla支持
3. 查看GitHub Issues
4. 参考其他成功案例

---

**HackDuck Team** - 让Firefox扩展发布更简单！
