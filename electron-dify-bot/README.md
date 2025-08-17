# 千牛智能客服机器人 - Electron + TypeScript 版本

## 项目概述

这是一个使用 TypeScript + Electron 开发的跨平台桌面自动化应用，用于自动化千牛客服工作流程。

## 功能特性

- ✅ 跨平台支持 (Windows, macOS, Linux)
- ✅ 图像识别和模板匹配
- ✅ 鼠标键盘自动控制
- ✅ 与 Dify API 集成
- ✅ 系统托盘运行
- ✅ 实时截图和分析
- ✅ 自动回复和转人工
- ✅ 配置管理和日志记录

## 技术栈

- **Electron**: 跨平台桌面应用框架
- **TypeScript**: 类型安全的 JavaScript
- **@nut-tree/nut-js**: 桌面自动化库
- **Jimp**: 图像处理
- **Axios**: HTTP 客户端
- **Clipboardy**: 剪贴板操作

## 安装和使用

### 1. 安装依赖

```bash
cd electron-dify-bot
npm install
```

### 2. 配置设置

编辑 `config.json` 文件，填入你的 Dify API 信息：

```json
{
  "dify": {
    "vision_api_url": "https://your-dify-instance.com/v1/workflows/run",
    "chat_api_url": "https://your-dify-instance.com/v1/chat-messages",
    "file_upload_url": "https://your-dify-instance.com/v1/files/upload",
    "api_key": "app-your-chat-api-key",
    "vision_api_key": "app-your-vision-api-key"
  }
}
```

### 3. 准备模板图片

在 `templates` 目录下放置以下模板图片：

- `chat_window.png` - 聊天窗口区域
- `input_box.png` - 输入框
- `send_button.png` - 发送按钮
- `new_message.png` - 新消息通知
- `transfer_button.png` - 转人工按钮
- `close_chat.png` - 关闭聊天按钮

**截图技巧：**

- 使用系统截图工具精确截取UI元素
- 图片大小建议 50x50 到 200x200 像素
- 避免包含变化的内容（时间、数字等）

### 4. 编译和运行

```bash
# 编译 TypeScript
npm run build

# 开发模式运行（显示主窗口和开发工具）
npm run dev

# 生产模式运行（后台运行，系统托盘控制）
npm start
```

## 使用方法

### 系统托盘操作

应用启动后会在系统托盘显示图标，右键菜单包含：

- **显示主窗口** - 打开管理界面
- **启动机器人** - 开始自动化流程
- **停止机器人** - 停止自动化
- **手动检查** - 立即检查新消息
- **退出应用** - 完全退出程序

### 主窗口界面

主窗口提供：

- 机器人状态显示
- 控制按钮
- 日志查看
- 配置管理

### 自动化流程

1. **监控新消息** - 定期扫描新消息通知
2. **截取聊天内容** - 自动截图聊天区域
3. **AI 分析** - 调用 Dify API 分析消息内容
4. **生成回复** - 使用 Dify 聊天 API 生成回复
5. **自动发送** - 将回复发送到聊天窗口
6. **智能转人工** - 根据 AI 判断是否需要转人工

## 与 Python 版本对比

| 功能 | Python + Clicknium | TypeScript + Electron |
|------|-------------------|----------------------|
| 跨平台支持 | ❌ 主要支持 Windows | ✅ 全平台支持 |
| 图像识别 | ✅ 内置支持 | ✅ 自实现模板匹配 |
| 性能 | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| 维护性 | ⭐⭐ | ⭐⭐⭐⭐ |
| 用户界面 | ❌ 无 | ✅ 现代化界面 |
| 安装复杂度 | ⭐⭐⭐ | ⭐⭐ |

## 优势

1. **跨平台兼容** - 一套代码，多平台运行
2. **现代化界面** - Electron 提供原生体验
3. **类型安全** - TypeScript 减少运行时错误
4. **易于扩展** - 模块化架构，便于添加新功能
5. **社区支持** - 丰富的 npm 生态系统

## 注意事项

### macOS 权限设置

首次运行时需要授予以下权限：

- **辅助功能** - 用于鼠标键盘控制
- **屏幕录制** - 用于截图功能

### Windows 防火墙

可能需要允许应用通过防火墙访问网络。

### 性能优化

- 调整 `config.json` 中的检查间隔
- 优化模板图片大小
- 根据需要调整置信度阈值

## 故障排除

### 找不到模板图片

```bash
错误：模板图片不存在: templates/xxx.png
解决：确保所有模板图片都已正确放置
```

### API 连接失败

```bash
错误：API 连接失败
解决：检查 config.json 中的 API 配置
```

### 权限不足

```bash
错误：没有屏幕录制权限
解决：在系统设置中授予相应权限
```

## 开发和扩展

### 项目结构

```bash
src/
├── bot/                 # 核心自动化逻辑
│   ├── config.ts       # 配置管理
│   ├── screenshot.ts   # 截图功能
│   ├── image-matcher.ts # 图像匹配
│   ├── mouse-keyboard.ts # 鼠标键盘控制
│   ├── api-client.ts   # API 客户端
│   └── qianniu-bot.ts  # 主机器人类
├── main.ts             # Electron 主进程
├── preload.ts          # 预加载脚本
└── types.ts            # 类型定义
```

### 添加新功能

1. 在 `src/bot/` 目录下创建新模块
2. 在 `qianniu-bot.ts` 中集成新功能
3. 通过 IPC 暴露给渲染进程
4. 更新 UI 界面（如需要）

### 调试技巧

- 使用 `npm run dev` 开启开发模式
- 检查控制台日志
- 使用 Electron DevTools
- 截图验证模板匹配

## 许可证

MIT License

## 贡献

欢迎提交 Issues 和 Pull Requests！
