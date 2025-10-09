# 百度网站警告分析

## 问题描述

用户报告在访问百度网站时出现以下警告和错误：

1. **Deprecated feature used**: `Unload event listeners are deprecated and will be removed.`
2. **CORB (Cross-Origin Read Blocking)**: `Response was blocked by CORB (Cross-Origin Read Blocking)`
3. **多个ztbox请求被阻止**

## 分析结果

### 1. 警告来源
这些警告和错误**不是由HackDuck扩展引起的**，而是来自百度网站本身的JavaScript代码：

- **文件来源**: `all_async_search_75181ec.js:351`
- **问题类型**: 百度网站使用了已弃用的`unload`事件监听器
- **CORB问题**: 百度网站的某些请求被浏览器的CORS策略阻止

### 2. 具体分析

#### Deprecated Feature Warning
```
Deprecated feature used
Unload event listeners are deprecated and will be removed.
1 source
all_async_search_75181ec.js:351
```
- 这是百度网站代码中使用了已弃用的`unload`事件监听器
- 与我们的扩展无关

#### CORB (Cross-Origin Read Blocking)
```
Response was blocked by CORB (Cross-Origin Read Blocking)
Cross-Origin Read Blocking (CORB) blocked a cross-origin response.
13 requests
```
- 这是浏览器的安全机制，阻止跨域响应
- 主要影响百度的`ztbox`相关请求
- 这些请求被阻止是正常的浏览器安全行为

### 3. 请求列表分析

被阻止的请求都是百度的内部请求：
- `ztbox?action=zpblog&appname=pcsearch&v=2.0&data=...`
- 这些是百度搜索页面的数据收集和分析请求
- 被CORB阻止是正常的，不影响网站功能

## 解决方案

### 1. 确认扩展功能正常
这些警告不影响HackDuck扩展的功能。扩展应该能够正常：
- 拦截HTTP请求
- 显示请求列表
- 编辑和发送请求

### 2. 用户指导
1. **忽略百度网站的警告**: 这些是百度网站的问题，不是扩展问题
2. **检查扩展功能**: 确认HackDuck能够正常捕获和显示请求
3. **测试其他网站**: 在其他网站上测试扩展功能

### 3. 技术说明
- CORB是浏览器的安全特性，用于防止恶意网站读取敏感数据
- 百度的一些请求被CORB阻止是正常现象
- 我们的扩展不应该尝试绕过这些安全机制

## 验证步骤

1. 打开Chrome DevTools
2. 查看HackDuck面板
3. 确认能够看到HTTP请求列表
4. 测试请求编辑和发送功能
5. 在其他网站（如Google、GitHub）上测试

## 结论

这些警告是百度网站本身的问题，不是HackDuck扩展的bug。扩展功能应该正常工作。如果用户发现扩展功能异常，那才是需要修复的问题。
