# Firefox Add-ons (AMO) 快速提交指南

## 🚀 5分钟快速提交

### 步骤1：准备文件
```bash
# 确保Firefox版本已构建
./scripts/build-firefox.sh

# 检查文件是否存在
ls -la releases/hackduck-firefox-v1.1.0.zip
```

### 步骤2：访问AMO开发者中心
1. 打开 https://addons.mozilla.org/developers/
2. 使用GitHub账户登录
3. 点击"Submit a New Add-on"

### 步骤3：上传扩展
1. 选择"On this site"
2. 上传 `releases/hackduck-firefox-v1.1.0.zip`
3. 等待文件验证

### 步骤4：填写基本信息
```
名称: HackDuck - HTTP Request Debugger
描述: A powerful browser extension for HTTP request debugging and manipulation
分类: Developer Tools
标签: http, debug, request, interceptor, devtools
```

### 步骤5：设置发布选项
- 发布状态: 公开
- 自动更新: 启用
- 用户反馈: 启用

### 步骤6：提交审核
1. 检查所有信息
2. 确认隐私政策
3. 提交审核

## 📋 提交信息模板

### 扩展名称
```
HackDuck - HTTP Request Debugger
```

### 简短描述
```
A powerful browser extension for HTTP request debugging and manipulation
```

### 详细描述
```
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

### 分类和标签
```
分类: Developer Tools
标签: http, debug, request, interceptor, devtools, burp, hackbar
```

## ⏱️ 预期时间线

- **文件上传**: 1-2分钟
- **信息填写**: 2-3分钟
- **自动审核**: 5-30分钟
- **人工审核**: 1-7个工作日
- **审核通过**: 自动获得签名

## 🎯 审核通过后

1. **自动签名**: 扩展自动获得Mozilla官方签名
2. **公开分发**: 用户可以从AMO下载
3. **自动更新**: 支持Firefox自动更新
4. **用户反馈**: 用户可以评价和反馈

## 📞 审核支持

如果审核遇到问题：
1. 查看AMO审核指南
2. 联系Mozilla支持
3. 查看GitHub Issues
4. 参考其他成功案例

## 🔍 审核状态检查

提交后可以：
1. 登录AMO开发者中心
2. 查看扩展状态
3. 监控审核进度
4. 处理审核反馈

---

**HackDuck Team** - 让Firefox扩展发布更简单！
