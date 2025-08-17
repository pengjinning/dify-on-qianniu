#!/bin/bash

# 千牛智能客服机器人 - 功能测试脚本

echo "🧪 千牛智能客服机器人功能测试"
echo "================================"

# 检查是否已编译
if [ ! -d "dist" ]; then
    echo "📦 正在编译..."
    npm run build
fi

# 创建测试模板图片（空文件）
echo "🖼️  创建测试模板图片..."
mkdir -p templates
touch templates/chat_window.png
touch templates/input_box.png
touch templates/send_button.png
touch templates/new_message.png
touch templates/transfer_button.png
touch templates/close_chat.png

# 创建测试截图目录
mkdir -p screenshots

echo "✅ 测试环境准备完成"
echo ""
echo "📝 可用功能："
echo "   1. npm start          - 启动完整应用"
echo "   2. npm run dev         - 开发模式（显示窗口）"
echo "   3. ./start.sh          - 使用启动脚本"
echo "   4. ./test.sh           - 运行此测试脚本"
echo ""
echo "⚠️  注意事项："
echo "   • 需要在 config.json 中配置 Dify API"
echo "   • 需要截取真实的模板图片以实现图像识别"
echo "   • 首次运行可能需要系统权限（截图、鼠标控制等）"
echo ""
echo "🎯 下一步："
echo "   1. 编辑 config.json 配置 Dify API"
echo "   2. 截取千牛界面UI元素作为模板图片"
echo "   3. 运行 npm start 启动应用"
