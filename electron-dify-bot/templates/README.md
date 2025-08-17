<!--
 * @Author: jack ning github@bytedesk.com
 * @Date: 2025-08-17 14:19:54
 * @LastEditors: jack ning github@bytedesk.com
 * @LastEditTime: 2025-08-17 14:22:07
 * @FilePath: /dify-on-qianniu/electron-dify-bot/templates/README.md
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
# 模板图片设置指南

## 📸 需要的模板图片

请截取千牛界面的以下元素，并保存为对应的文件名：

### 1. chat_window.png

- **说明**: 聊天窗口的主要区域
- **截图范围**: 包含消息列表的矩形区域
- **建议尺寸**: 200x150 像素左右

### 2. input_box.png  

- **说明**: 消息输入框
- **截图范围**: 文本输入框区域
- **建议尺寸**: 150x30 像素左右

### 3. send_button.png

- **说明**: 发送按钮
- **截图范围**: "发送" 按钮
- **建议尺寸**: 50x30 像素左右

### 4. new_message.png

- **说明**: 新消息通知图标
- **截图范围**: 新消息提示或未读消息标识
- **建议尺寸**: 30x30 像素左右

### 5. transfer_button.png

- **说明**: 转人工按钮
- **截图范围**: "转人工" 或类似功能的按钮
- **建议尺寸**: 60x30 像素左右

### 6. close_chat.png

- **说明**: 关闭聊天按钮
- **截图范围**: 关闭当前聊天窗口的按钮
- **建议尺寸**: 20x20 像素左右

## 📝 截图技巧

1. **使用系统截图工具**:
   - macOS: Command + Shift + 4
   - Windows: Snipping Tool 或 Win + Shift + S

2. **截图要求**:
   - 图片要清晰，避免模糊
   - 尽量避免包含变化的内容（如时间、数字）
   - 截取的区域要有明显的特征
   - 建议使用 PNG 格式保存

3. **测试方法**:
   - 截图后可以手动测试图像识别是否正常
   - 调整 config.json 中的 confidence_threshold 值

## 🔧 配置调整

如果图像识别效果不好，可以调整配置：

```json
{
  "settings": {
    "confidence_threshold": 0.8  // 降低到 0.6-0.7 可能提高识别率
  }
}
```

## ⚠️ 注意事项

- 不同分辨率和缩放比例可能影响识别效果
- 千牛界面更新后可能需要重新截取模板图片
- 建议在实际使用的设备和分辨率下截取模板图片
