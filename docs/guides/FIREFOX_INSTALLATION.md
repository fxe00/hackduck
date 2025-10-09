# Firefox 安装指南

## 🦊 Firefox 扩展安装方法

由于Firefox对扩展的严格验证要求，HackDuck需要通过开发者模式安装。

### 方法1：临时安装（推荐）

1. **下载扩展文件**
   - 访问 [GitHub Releases](https://github.com/fxe00/hackduck/releases)
   - 下载 `hackduck-firefox-v1.1.0.zip`

2. **解压扩展文件**
   ```bash
   unzip hackduck-firefox-v1.1.0.zip
   ```

3. **打开Firefox开发者模式**
   - 在地址栏输入：`about:debugging`
   - 点击"此Firefox"
   - 点击"临时载入附加组件"

4. **选择扩展文件**
   - 点击"选择文件"
   - 选择解压后的文件夹中的 `manifest.json` 文件
   - 点击"打开"

5. **确认安装**
   - 扩展会显示在列表中
   - 状态显示为"已启用"

### 方法2：永久安装

1. **启用Firefox开发者模式**
   - 在地址栏输入：`about:config`
   - 搜索 `xpinstall.signatures.required`
   - 设置为 `false`（需要重启Firefox）

2. **安装扩展**
   - 按照方法1的步骤安装
   - 扩展将永久保留

### 方法3：从源码构建

1. **克隆仓库**
   ```bash
   git clone https://github.com/fxe00/hackduck.git
   cd hackduck
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **构建Firefox版本**
   ```bash
   ./scripts/build-firefox.sh
   ```

4. **安装构建的扩展**
   - 按照方法1的步骤安装

## 🔧 故障排除

### 常见问题

#### 1. "此附加组件无法安装，因为它似乎已损坏"
**解决方案**：
- 确保下载的是完整的ZIP文件
- 重新解压文件
- 检查manifest.json文件是否存在

#### 2. "无法验证此附加组件"
**解决方案**：
- 使用开发者模式安装
- 确保Firefox版本 >= 78.0

#### 3. 扩展无法加载
**解决方案**：
- 检查浏览器控制台错误信息
- 确保所有文件都已正确解压
- 重新安装扩展

### 权限问题

如果遇到权限问题：
1. 确保扩展有足够的权限
2. 检查Firefox的隐私设置
3. 允许扩展访问所有网站

## 📋 系统要求

- **Firefox版本**：78.0 或更高
- **操作系统**：Windows、macOS、Linux
- **权限**：需要访问所有网站

## 🚀 使用说明

安装成功后：
1. 打开F12开发者工具
2. 找到"HackDuck"标签
3. 选择Burp Suite模式或HackBar模式
4. 开始调试HTTP请求

## 📞 支持

如果遇到问题：
- 查看 [GitHub Issues](https://github.com/fxe00/hackduck/issues)
- 提交新的问题报告
- 查看 [调试指南](DEBUG_GUIDE.md)

---

**HackDuck Team** - 让Firefox扩展安装更简单！
