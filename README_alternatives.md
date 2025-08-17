# 千牛智能客服机器人 - PyAutoGUI版本

## 替代方案对比

### 1. PyAutoGUI (推荐)
**优点:**
- 跨平台支持 (Windows, macOS, Linux)
- 简单易用，学习成本低
- 支持图像识别和坐标定位
- 活跃社区支持

**缺点:**
- 需要截取UI模板图片
- 对界面变化敏感
- 可能受屏幕分辨率影响

### 2. Selenium + WebDriver
**优点:**
- 专业的Web自动化工具
- 稳定可靠
- 元素定位精确

**缺点:**
- 只适用于Web应用
- 千牛可能是桌面应用

### 3. Playwright
**优点:**
- 现代化Web自动化
- 速度快，功能强大
- 支持多浏览器

**缺点:**
- 主要针对Web应用
- 学习成本较高

### 4. AppScript/AppleScript (macOS)
**优点:**
- macOS原生支持
- 系统级自动化

**缺点:**
- 只支持macOS
- 语法复杂

## 安装和使用 PyAutoGUI 版本

### 1. 安装依赖
```bash
# 激活虚拟环境
source .venv/bin/activate

# 安装新的依赖包
pip install -r requirements_pyautogui.txt
```

### 2. 准备模板图片
创建 `templates` 目录并截取以下UI元素的图片:

- `chat_window.png` - 聊天窗口区域
- `input_box.png` - 输入框
- `send_button.png` - 发送按钮  
- `new_message.png` - 新消息通知图标
- `transfer_button.png` - 转人工按钮
- `close_chat.png` - 关闭聊天按钮

**截图技巧:**
- 图片要小且包含关键特征
- 避免包含变化的内容(如时间、数字)
- 建议尺寸: 50x50 到 200x200 像素

### 3. 运行程序
```bash
python qianniu_bot_pyautogui.py
```

### 4. 紧急停止
将鼠标快速移动到屏幕左上角可以立即停止程序

## 其他替代方案

### 简化版本 (只使用坐标)
如果不想处理图像识别，可以使用固定坐标:

```python
import pyautogui
import time

# 点击固定位置
pyautogui.click(500, 300)  # 调整坐标

# 输入文本
pyautogui.typewrite('Hello')

# 按键
pyautogui.press('enter')
```

### 使用 pynput (更轻量)
```python
from pynput import mouse, keyboard
from pynput.mouse import Button

# 鼠标点击
mouse.Controller().click(Button.left, 1)

# 键盘输入
keyboard.Controller().type('Hello')
```

## 建议方案

1. **首选**: 在Windows环境运行原版clicknium代码
2. **次选**: 使用PyAutoGUI版本，但需要手动截取模板图片
3. **简化**: 使用固定坐标版本，适合界面固定的情况

你想尝试哪种方案？我可以帮你进一步配置。
