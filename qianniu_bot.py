import time
import json
import requests
import os
import glob
import pyperclip
from datetime import datetime, timedelta
from clicknium import clicknium as cc, locator, ui

# 创建截图保存目录
SCREENSHOTS_DIR = "screenshots"
if not os.path.exists(SCREENSHOTS_DIR):
    os.makedirs(SCREENSHOTS_DIR)

# 加载配置
def load_config():
    try:
        with open('config.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"加载配置文件失败: {str(e)}")
        return None

CONFIG = load_config()
if not CONFIG:
    raise Exception("无法加载配置文件，请确保config.json文件存在且格式正确")

# 从配置文件获取参数
DIFY_VISION_API_URL = CONFIG['dify']['vision_api_url']
DIFY_CHAT_API_URL = CONFIG['dify']['chat_api_url']
DIFY_API_KEY = CONFIG['dify']['api_key']
DIFY_VISION_API_KEY = CONFIG['dify']['vision_api_key']
DIFY_FILE_UPLOAD_URL = CONFIG['dify']['file_upload_url']

# 分离不同API的请求头
DIFY_HEADERS = {
    "Authorization": f"Bearer {DIFY_API_KEY}",
    "Content-Type": "application/json"
}

DIFY_VISION_HEADERS = {
    "Authorization": f"Bearer {DIFY_VISION_API_KEY}",
    "Content-Type": "application/json"
}


def cleanup_old_screenshots():
    """清理过期的截图文件"""
    if not CONFIG['settings'].get('cleanup_screenshots', False):
        return
    
    days = CONFIG['settings'].get('cleanup_after_days', 7)
    cutoff_date = datetime.now() - timedelta(days=days)
    
    try:
        screenshot_files = glob.glob(f"{SCREENSHOTS_DIR}/*.png")
        for file in screenshot_files:
            file_time = datetime.fromtimestamp(os.path.getctime(file))
            if file_time < cutoff_date:
                os.remove(file)
                print(f"已清理过期截图: {file}")
    except Exception as e:
        print(f"清理截图失败: {str(e)}")

def capture_chat_screenshot(customer_id):
    """截取聊天区域并保存为图片"""
    if not CONFIG['settings'].get('use_screenshot', True):
        return None
        
    try:
        # 找到聊天内容区域
        chat_content = ui(locator.aliworkbench.chat_window)
        if cc.is_existing(locator.aliworkbench.chat_window):
            # 生成文件名：客户ID_时间戳.png
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{SCREENSHOTS_DIR}/{customer_id}_{timestamp}.png"
            
            # 截取聊天区域图片
            chat_content.save_to_image(filename)
            print(f"已保存聊天截图: {filename}")
            return filename
        else:
            print("未找到聊天内容区域")
            return None
    except Exception as e:
        print(f"截图失败: {str(e)}")
        return None

def upload_file_to_dify(file_path, customer_id):
    """
    上传文件到Dify，获取文件ID
    返回: 上传文件的ID
    """
    if not file_path or not os.path.exists(file_path):
        return None
    
    try:
        # 准备上传文件请求
        headers = {
            "Authorization": f"Bearer {DIFY_VISION_API_KEY}"
        }
        
        # 使用form格式上传文件
        with open(file_path, 'rb') as file_object:
            files = {
                'file': (os.path.basename(file_path), file_object, 'image/png')
            }
            
            data = {
                'user': customer_id
            }
            
            # 调用文件上传API
            response = requests.post(
                DIFY_FILE_UPLOAD_URL, 
                headers=headers,
                files=files,
                data=data
            )
        
        response.raise_for_status()
        
        # 解析响应，获取文件ID
        result = response.json()
        file_id = result.get('id')
        
        if file_id:
            print(f"文件上传成功，ID: {file_id}")
            return file_id
        else:
            print("上传文件失败：未返回文件ID")
            return None
            
    except Exception as e:
        print(f"上传文件失败: {str(e)}")
        return None

def analyze_image_with_dify(image_path, customer_id):
    """
    使用Dify视觉工作流分析图像内容
    返回: 图像中的文本内容
    """
    if not image_path or not os.path.exists(image_path):
        return None
        
    try:
        # 第一步：上传文件获取文件ID
        file_id = upload_file_to_dify(image_path, customer_id)
        if not file_id:
            print("无法获取文件ID，无法进行图像分析")
            return None
        
        # 第二步：使用文件ID调用工作流
        payload = {
            "inputs": {
                "input": {
                    "transfer_method": "local_file",
                    "upload_file_id": file_id,
                    "type": "image"
                }
            },
            "response_mode": "blocking",
            "user": customer_id
        }
        
        # 调用Dify视觉工作流API
        response = requests.post(
            DIFY_VISION_API_URL,
            json=payload,
            headers=DIFY_VISION_HEADERS
        )
        response.raise_for_status()
        
        # 解析响应
        result = response.json()
        # 提取工作流执行结果
        extracted_text = result.get("data", {}).get("outputs", "")
        print(f"从图片中提取的文本: {extracted_text}")
        
        return extracted_text
    except Exception as e:
        print(f"分析图片失败: {str(e)}")
        return None

def chat_with_dify(customer_id, message):
    """
    使用Dify对话流处理消息并获取回复
    返回: (回复内容, 是否需要转人工)
    """
    try:
        # 基本负载
        payload = {
            "inputs": {},
            "query": message,
            "user": customer_id,  # 使用客户ID作为用户标识
            "response_mode": "blocking"
        }
        
        # 调用Dify对话流API
        response = requests.post(DIFY_CHAT_API_URL, json=payload, headers=DIFY_HEADERS)
        response.raise_for_status()
        
        # 解析响应
        result = response.json()
        reply = result.get("answer", "")
        
        # 检查是否需要转人工 (根据dify返回中的特定标记判断)
        need_human = "需要转人工" in reply or "转人工" in reply
        
        # 从回复中删除转人工标记，只保留回复内容
        if need_human:
            reply = reply.replace("需要转人工", "").replace("转人工", "").strip()
        
        return reply, need_human
    except Exception as e:
        print(f"调用Dify对话API出错: {str(e)}")
        return "抱歉，系统暂时无法回答您的问题。", True

def transfer_to_human():
    """转交给人工客服处理"""
    try:
        # 找到并点击转人工按钮
        transfer_button = ui(locator.aliworkbench.button_transfer)
        if cc.is_existing(locator.aliworkbench.button_transfer):
            transfer_button.click()
            print("已转交给人工客服")
            return True
        else:
            print("未找到转人工按钮")
            return False
    except Exception as e:
        print(f"转人工失败: {str(e)}")
        return False

def send_reply(message):
    """在聊天窗口发送回复"""
    try:
        # 找到输入框
        input_box = ui(locator.aliworkbench.reply_text)
        if cc.is_existing(locator.aliworkbench.reply_text):
            # 将消息复制到系统剪贴板,使用这种方式比clicknium自带的set_text方法更优，set_text模拟键盘输入，部分文字会有问题
            pyperclip.copy(message)
            # 点击输入框获取焦点
            input_box.click()
            # 使用Ctrl+V粘贴内容
            input_box.send_hotkey('^v')
            # 点击发送按钮
            send_button = ui(locator.aliworkbench.button_send)
            if cc.is_existing(locator.aliworkbench.button_send):
                send_button.click()
                print(f"发送回复: {message}")
                return True
            else:
                print("未找到发送按钮")
                return False
        else:
            print("未找到输入框")
            return False
    except Exception as e:
        print(f"发送消息失败: {str(e)}")
        return False

def has_new_customer():
    """检查是否有新的待接待客户"""
    try:
        # 检查新任务通知
        if cc.is_existing(locator.aliworkbench.new_message):
            # 尝试获取客户ID或其他标识
            new_task = ui(locator.aliworkbench.current_user)
            customer_id = extract_customer_id(new_task)
            if customer_id:
                return True, customer_id
        return False, None
    except Exception as e:
        print(f"检查新客户失败: {str(e)}")
        return False, None

def extract_customer_id(customer_element):
    """从客户元素中提取客户ID"""
    try:
        # 尝试获取元素的文本
        element_id = customer_element.get_text()
        if element_id:
            return element_id
        
        # 如果都没有，使用时间戳作为临时ID
        return f"customer_{int(time.time())}"
    except Exception:
        return f"unknown_{int(time.time())}"

def handle_customer(customer_element, customer_id):
    """处理单个客户的咨询"""
    try:
        # 点击客户元素打开聊天窗口
        customer_element.click()
        print(f"正在处理客户: {customer_id}")
        
        # 等待聊天窗口加载
        time.sleep(1)
            
            # 截取聊天区域图片
        image_path = capture_chat_screenshot(customer_id)
            
        if image_path:
        # 第一步：使用工作流分析图片内容
            extracted_text = analyze_image_with_dify(image_path, customer_id)
                
            if not extracted_text:
                print("无法从图片中提取文本内容")
                return
                
            # 使用提取的文本作为消息内容
            message = extracted_text
        
        print(f"处理客户 {customer_id} 消息: {message}")
        
        # 第二步：使用对话流处理消息并生成回复
        reply, need_human = chat_with_dify(customer_id, message)
        
        # 处理回复
        if need_human:
            print(f"客户 {customer_id} 需要转人工")
            transfer_to_human()
            # 消息仍然发送，但之后将由人工接管
            if reply.strip():  # 如果有回复内容
                send_reply(reply)
        else:
            print(f"自动回复客户 {customer_id}: {reply}")
            send_reply(reply)

        ui(locator.aliworkbench.button_接待关闭).click()
        ui(locator.aliworkbench.button_跳转接待中心).click()
        
    except Exception as e:
        print(f"处理客户 {customer_id} 失败: {str(e)}")

def scan_and_process_customers():
    # 检查新的未接待客户
    has_new, new_customer_id = has_new_customer()
    if has_new and new_customer_id:
        print(f"检测到新客户: {new_customer_id}")
        # 点击新客户通知
        ui(locator.aliworkbench.new_message).click()
        # 处理新客户
        handle_customer(
            ui(locator.aliworkbench.new_message),
            new_customer_id
        )

def main():
    # 设置许可证
    cc.config.set_license(CONFIG['clicknium']['license_key'])
    
    print("启动千牛智能AI客服机器人...")
    
    # 点击千牛工作台的旺旺客服按钮，跳转接待中心
    ui(locator.aliworkbench.button_跳转接待中心).click()

    # 清理旧截图
    cleanup_old_screenshots()
    
    check_interval = CONFIG['settings']['check_interval']
    error_retry_interval = CONFIG['settings']['error_retry_interval']
    
    # 运行计数器，用于定期执行清理操作
    run_count = 0
    
    while True:
        try:
            # 扫描并处理客户
            scan_and_process_customers()
            
            # 每10次循环清理一次旧截图
            run_count += 1
            if run_count >= 10:
                cleanup_old_screenshots()
                run_count = 0
            
            # 短暂休眠，避免CPU占用过高
            time.sleep(check_interval)
            
        except Exception as e:
            print(f"运行时错误: {str(e)}")
            time.sleep(error_retry_interval)  # 出错后稍微等待长一些

if __name__ == "__main__":
    main() 