# 千牛智能客服机器人 - 完整解决方案

## 📁 项目结构总览

```
dify-on-qianniu/
├── 📄 Python 版本 (原始)
│   ├── qianniu_bot.py           # Python + clicknium 实现
│   ├── qianniu_bot_pyautogui.py # Python + pyautogui 替代版本
│   ├── requirements.txt         # Python 依赖 (clicknium)
│   ├── requirements_pyautogui.txt # PyAutoGUI 版本依赖
│   ├── config.json             # 配置文件
│   └── README_alternatives.md   # Python 替代方案说明
│
└── 📁 electron-dify-bot/       # TypeScript + Electron 版本
    ├── src/                    # 源代码目录
    │   ├── bot/               # 核心自动化逻辑
    │   │   ├── config.ts      # 配置管理
    │   │   ├── screenshot.ts   # 截图功能
    │   │   ├── image-matcher.ts # 图像识别
    │   │   ├── mouse-keyboard.ts # 鼠标键盘控制
    │   │   ├── api-client.ts   # Dify API 客户端
    │   │   └── qianniu-bot.ts  # 主机器人类
    │   ├── main.ts            # Electron 主进程
    │   ├── preload.ts         # 预加载脚本
    │   └── types.ts           # TypeScript 类型定义
    ├── templates/             # UI 模板图片
    ├── screenshots/           # 截图保存目录
    ├── config.json           # 配置文件
    ├── package.json          # Node.js 依赖
    ├── tsconfig.json         # TypeScript 配置
    ├── start.sh              # 启动脚本
    └── README.md             # 使用说明
```

## 🎯 三种实现方案对比

| 特性 | Python + Clicknium | Python + PyAutoGUI | TypeScript + Electron |
|------|-------------------|-------------------|----------------------|
| **跨平台支持** | ❌ 主要 Windows | ✅ 全平台 | ✅ 全平台 |
| **安装复杂度** | ⭐⭐⭐ 依赖多 | ⭐⭐ 简单 | ⭐⭐ 中等 |
| **图像识别** | ✅ 内置优秀 | ⭐⭐⭐ 需手动模板 | ⭐⭐⭐⭐ 自实现 |
| **用户界面** | ❌ 无 | ❌ 无 | ✅ 现代化 GUI |
| **维护性** | ⭐⭐ 依赖版本问题 | ⭐⭐⭐ 稳定 | ⭐⭐⭐⭐ 类型安全 |
| **性能** | ⭐⭐⭐ 中等 | ⭐⭐⭐ 中等 | ⭐⭐⭐⭐ 较好 |
| **扩展性** | ⭐⭐ 有限 | ⭐⭐⭐ 中等 | ⭐⭐⭐⭐⭐ 优秀 |
| **社区支持** | ⭐⭐ 较少 | ⭐⭐⭐⭐ 活跃 | ⭐⭐⭐⭐⭐ 非常活跃 |

## 🚀 推荐使用方案

### 1. 开发/测试阶段
**推荐: Python + PyAutoGUI**
- 快速原型验证
- 简单易调试
- 跨平台兼容

### 2. 生产环境
**推荐: TypeScript + Electron**
- 专业级应用体验
- 现代化用户界面
- 长期维护性好
- 功能扩展性强

### 3. Windows 专用环境
**可选: Python + Clicknium**
- 如果只在 Windows 运行
- 对图像识别精度要求极高

## 📋 快速开始

### Python + PyAutoGUI 版本
```bash
cd dify-on-qianniu
python -m venv .venv
source .venv/bin/activate  # macOS/Linux
pip install -r requirements_pyautogui.txt
python qianniu_bot_pyautogui.py
```

### TypeScript + Electron 版本
```bash
cd electron-dify-bot
npm install
npm run build
npm start
# 或使用启动脚本
./start.sh
```

## ⚙️ 配置要求

### 1. Dify API 配置
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

### 2. 模板图片准备
所有版本都需要以下UI模板图片：
- `chat_window.png` - 聊天窗口区域
- `input_box.png` - 输入框
- `send_button.png` - 发送按钮
- `new_message.png` - 新消息通知
- `transfer_button.png` - 转人工按钮
- `close_chat.png` - 关闭聊天按钮

### 3. 系统权限设置

#### macOS
- 系统偏好设置 → 安全性与隐私 → 辅助功能
- 系统偏好设置 → 安全性与隐私 → 屏幕录制

#### Windows
- 允许应用访问摄像头和麦克风
- 防火墙例外设置

## 🔧 功能特性

### 核心自动化流程
1. **智能监控** - 实时检测新消息通知
2. **精确截图** - 自动截取聊天内容区域
3. **AI 理解** - 调用 Dify 视觉 API 分析图片文本
4. **智能回复** - 使用 Dify 对话 API 生成回复
5. **自动操作** - 模拟键盘鼠标发送回复
6. **智能转人工** - 根据 AI 判断自动转人工处理

### 高级功能
- 📊 **运行统计** - 处理消息数量、成功率统计
- 🗂️ **日志记录** - 详细的操作和错误日志
- ⚡ **性能优化** - 可配置的检查间隔和重试机制
- 🔄 **自动清理** - 定期清理过期截图文件
- 🎛️ **灵活配置** - 丰富的配置选项和个性化设置

## 🛠️ 开发和扩展

### 添加新的自动化功能
1. **Python 版本**: 修改 `qianniu_bot_pyautogui.py`
2. **Electron 版本**: 在 `src/bot/` 目录下创建新模块

### 集成其他 AI 服务
- 修改 `api-client.ts` 或 `qianniu_bot.py` 中的 API 调用部分
- 支持 OpenAI、Claude、本地模型等

### 自定义UI识别
- 训练自己的图像识别模型
- 集成 OpenCV 进行更精确的图像处理

## 🔍 故障排除

### 常见问题
1. **找不到模板图片** → 检查模板图片路径和文件名
2. **权限不足** → 检查系统权限设置
3. **API 连接失败** → 验证 Dify API 配置
4. **图像识别失败** → 调整置信度阈值或重新截取模板

### 调试技巧
- 启用详细日志输出
- 使用开发模式检查中间结果
- 手动测试各个功能模块

## 📈 性能优化建议

1. **调整检查间隔** - 根据业务量调整扫描频率
2. **优化模板图片** - 使用小而精确的模板图片
3. **并发处理** - 对于高并发场景，可以实现多线程处理
4. **缓存机制** - 缓存常用的 API 响应

## 🤝 贡献指南

欢迎提交 Issues 和 Pull Requests！

### 贡献方式
1. Fork 项目
2. 创建功能分支
3. 提交代码
4. 发起 Pull Request

### 代码规范
- Python: 遵循 PEP 8
- TypeScript: 使用 ESLint 和 Prettier
- 提交信息: 使用约定式提交格式

## 📄 许可证

MIT License - 可自由使用、修改和分发

---

**选择适合你的版本，开始自动化你的千牛客服工作流程！** 🎉
