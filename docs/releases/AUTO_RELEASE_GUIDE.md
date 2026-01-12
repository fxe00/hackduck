# HackDuck 自动发布指南

## 🚀 自动发布功能

HackDuck项目已配置GitHub Actions自动发布功能。当您推送新的tag时，GitHub会自动构建并发布对应的release。

## 📋 发布流程

### 1. 准备发布
```bash
# 确保所有更改已提交
git add .
git commit -m "准备发布v1.1.0"

# 推送到GitHub
git push origin main
```

### 2. 创建并推送tag
```bash
# 创建新版本tag
git tag -a v1.1.0 -m "Release version 1.1.0"

# 推送tag到GitHub
git push origin v1.1.0
```

### 3. 自动发布
- GitHub Actions会自动检测到新的tag
- 自动构建项目
- 生成Chrome、Firefox、Edge三个版本的扩展包
- 自动创建GitHub Release
- 上传构建文件到Release

## 🔧 Workflow配置

### 触发条件
- 当推送以`v`开头的tag时触发
- 例如：`v1.0.0`, `v1.1.0`, `v2.0.0-beta.1`

### 构建步骤
1. **环境准备**：Ubuntu + Node.js 18
2. **依赖安装**：`npm ci`
3. **项目构建**：`npm run build`
4. **扩展打包**：
   - Chrome版本：`./build-chrome.sh`
   - Firefox版本：`./build-firefox.sh`
   - Edge版本：`./build-edge.sh`
5. **Release创建**：自动上传构建文件

### 生成的文件
- `hackduck-chrome-v1.1.0.zip`
- `hackduck-firefox-v1.1.0.zip`
- `hackduck-edge-v1.1.0.zip`

## 📝 Release说明

每个自动发布的Release包含：
- **标题**：HackDuck v1.1.0
- **详细说明**：功能特性、安装说明、技术特性等
- **构建文件**：三个浏览器版本的ZIP文件
- **自动生成**：基于tag名称和项目信息

## 🎯 版本管理建议

### 语义化版本控制
- **主版本号**：不兼容的API修改
- **次版本号**：向下兼容的功能性新增
- **修订号**：向下兼容的问题修正

### 版本示例
- `v1.0.0` - 首次正式发布
- `v1.1.0` - 新功能添加
- `v1.1.1` - 问题修复
- `v2.0.0` - 重大更新
- `v1.2.0-beta.1` - 测试版本

## 🔍 监控发布状态

### GitHub Actions页面
1. 访问仓库的"Actions"标签
2. 查看"Auto Release"工作流
3. 监控构建和发布进度

### 发布状态
- ✅ **成功**：绿色勾号，Release已创建
- ❌ **失败**：红色叉号，查看错误日志
- 🟡 **进行中**：黄色圆点，正在构建

## 🛠️ 故障排除

### 常见问题

#### 1. 构建失败
```bash
# 检查本地构建是否正常
npm run build
./build-all.sh
```

#### 2. 权限问题
- 确保GitHub仓库有正确的权限设置
- 检查GITHUB_TOKEN是否有效

#### 3. 文件上传失败
- 检查构建文件是否生成
- 确认文件大小是否超限

### 手动发布
如果自动发布失败，可以手动创建Release：
1. 访问GitHub仓库的"Releases"页面
2. 点击"Create a new release"
3. 选择对应的tag
4. 上传构建文件

## 📊 发布历史

查看所有发布版本：
- 访问 https://github.com/fxe00/hackduck/releases
- 查看版本历史、下载统计、用户反馈

## 🎉 最佳实践

### 发布前检查
- [ ] 代码已测试通过
- [ ] 版本号已更新
- [ ] 更新日志已编写
- [ ] 所有更改已提交

### 发布后验证
- [ ] Release已成功创建
- [ ] 构建文件已上传
- [ ] 下载链接正常工作
- [ ] 扩展安装测试通过

## 📞 支持

如有问题，请通过以下方式联系：
- GitHub Issues：报告问题
- GitHub Discussions：讨论功能
- Pull Request：贡献代码

---

**HackDuck Team** - 让发布更简单！
