#!/bin/bash

# 千牛智能客服机器人 Electron 版本启动脚本

echo "🤖 千牛智能客服机器人 - Electron版本"
echo "======================================"

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 请先安装 Node.js"
    echo "   下载地址: https://nodejs.org/"
    exit 1
fi

# 检查是否在项目目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装依赖..."
    npm install
fi

# 检查配置文件
if [ ! -f "config.json" ]; then
    echo "❌ 错误: 配置文件 config.json 不存在"
    echo "   请复制 config.example.json 并修改配置"
    exit 1
fi

# 检查模板图片目录
if [ ! -d "templates" ]; then
    echo "📁 创建模板图片目录..."
    mkdir -p templates
fi

# 检查关键模板图片
missing_templates=()
templates=("chat_window.png" "input_box.png" "send_button.png" "new_message.png" "transfer_button.png" "close_chat.png")

for template in "${templates[@]}"; do
    if [ ! -f "templates/$template" ]; then
        missing_templates+=("$template")
    fi
done

if [ ${#missing_templates[@]} -gt 0 ]; then
    echo "⚠️  警告: 缺少以下模板图片:"
    for template in "${missing_templates[@]}"; do
        echo "   - templates/$template"
    done
    echo ""
    echo "   请截取相应的UI元素并保存到 templates 目录"
    echo "   程序仍会启动，但某些功能可能无法正常工作"
    echo ""
    read -p "是否继续启动? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 编译 TypeScript
echo "🔨 编译 TypeScript..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 编译失败"
    exit 1
fi

# 检查启动模式
if [ "$1" = "dev" ]; then
    echo "🚀 启动开发模式..."
    npm run dev
else
    echo "🚀 启动生产模式..."
    npm start
fi
