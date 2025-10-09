# HackDuck 测试指南

## 🚀 安装扩展

1. 打开Chrome浏览器，访问 `chrome://extensions/`
2. 开启右上角的"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择项目的 `dist` 文件夹
5. 确认安装成功

## 🧪 测试步骤

### 1. 基础功能测试

1. **打开测试页面**
   - 访问 https://httpbin.org
   - 按F12打开开发者工具
   - 查看是否有"HackDuck"标签页

2. **开启请求拦截**
   - 在HackDuck面板中，开启"拦截请求"开关
   - 应该看到开关变为蓝色

3. **触发HTTP请求**
   - 在页面上点击任何链接或按钮
   - 或者手动在控制台执行：
     ```javascript
     fetch('https://httpbin.org/get')
     ```

4. **验证请求捕获**
   - 在HackDuck面板的左侧应该看到捕获的请求
   - 请求应该显示URL、方法、状态等信息

### 2. 高级功能测试

1. **编辑请求**
   - 点击左侧列表中的请求
   - 在右侧编辑器中修改URL、方法、请求头等
   - 点击"发送请求"按钮

2. **过滤请求**
   - 在顶部搜索框中输入关键词
   - 应该只显示匹配的请求

3. **导出请求**
   - 点击"导出"按钮
   - 应该下载JSON文件

### 3. 调试信息

如果请求没有被捕获，请检查：

1. **控制台错误**
   - 按F12打开开发者工具
   - 查看Console标签页是否有错误

2. **扩展权限**
   - 确保扩展有正确的权限
   - 检查manifest.json中的permissions

3. **网络请求**
   - 确保页面确实发送了HTTP请求
   - 可以在Network标签页中确认

## 🔧 常见问题

### Q: 扩展安装后没有HackDuck标签页
A: 确保：
- 扩展已正确安装
- 刷新页面后重新打开开发者工具
- 检查控制台是否有错误

### Q: 开启拦截后没有捕获到请求
A: 检查：
- 确保页面确实发送了HTTP请求
- 检查控制台是否有JavaScript错误
- 尝试刷新页面重新加载扩展

### Q: 请求显示不完整
A: 这是正常的，因为：
- 某些请求可能没有请求体
- 某些请求头可能被浏览器过滤
- 这是浏览器安全限制

## 📝 测试用例

### 基础请求测试
```javascript
// 在控制台执行这些命令测试不同类型的请求

// GET请求
fetch('https://httpbin.org/get')

// POST请求
fetch('https://httpbin.org/post', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ test: 'data' })
})

// XMLHttpRequest
const xhr = new XMLHttpRequest()
xhr.open('GET', 'https://httpbin.org/get')
xhr.send()
```

### 复杂请求测试
```javascript
// 带自定义请求头的请求
fetch('https://httpbin.org/headers', {
  headers: {
    'X-Custom-Header': 'test-value',
    'Authorization': 'Bearer token123'
  }
})

// 带请求体的POST请求
fetch('https://httpbin.org/post', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'HackDuck',
    version: '1.0.0'
  })
})
```

## ✅ 成功标准

测试成功的标准：
- [ ] HackDuck面板正常显示
- [ ] 拦截开关可以正常切换
- [ ] 能够捕获到HTTP请求
- [ ] 请求列表正确显示
- [ ] 可以编辑和发送请求
- [ ] 过滤功能正常工作
- [ ] 导出功能正常工作

## 🐛 问题报告

如果遇到问题，请提供：
1. 浏览器版本
2. 扩展版本
3. 控制台错误信息
4. 复现步骤
5. 期望结果和实际结果
