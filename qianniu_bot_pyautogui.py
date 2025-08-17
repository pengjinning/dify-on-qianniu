import time
import json
import requests
import os
import glob
import pyperclip
import pyautogui
import cv2
import numpy as np
from datetime import datetime, timedelta
from PIL import Image

# 设置pyautogui安全机制
pyautogui.FAILSAFE = True  # 鼠标移到屏幕左上角会停止
pyautogui.PAUSE = 0.5      # 每次操作间隔

# 创建截图保存目录
SCREENSHOTS_DIR = "screenshots"
TEMPLATES_DIR = "templates"  # 存放模板图片的目录
if not os.path.exists(SCREENSHOTS_DIR):
    os.makedirs(SCREENSHOTS_DIR)
if not os.path.exists(TEMPLATES_DIR):
    os.makedirs(TEMPLATES_DIR)

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

# API请求头
DIFY_HEADERS = {
    "Authorization": f"Bearer {DIFY_API_KEY}",
    "Content-Type": "application/json"
}

DIFY_VISION_HEADERS = {
    "Authorization": f"Bearer {DIFY_VISION_API_KEY}",
    "Content-Type": "application/json"
}

def find_image_on_screen(template_path, confidence=0.8):
    """
    在屏幕上查找模板图片
    返回: (x, y, width, height) 或 None
    """
    try:
        # 截取屏幕
        screenshot = pyautogui.screenshot()
        screenshot_np = np.array(screenshot)
        screenshot_gray = cv2.cvtColor(screenshot_np, cv2.COLOR_RGB2GRAY)
        
        # 读取模板图片
        template = cv2.imread(template_path, 0)
        if template is None:
            print(f"无法读取模板图片: {template_path}")
            return None
            
        # 模板匹配
        result = cv2.matchTemplate(screenshot_gray, template, cv2.TM_CCOEFF_NORMED)
        locations = np.where(result >= confidence)
        
        if len(locations[0]) > 0:
            # 返回第一个匹配位置
            y, x = locations[0][0], locations[1][0]
            h, w = template.shape
            return (x, y, w, h)
        return None
    except Exception as e:
        print(f"图像识别失败: {str(e)}")
        return None

def click_image(template_path, confidence=0.8, timeout=10):
    """
    查找并点击图片
    """
    start_time = time.time()
    while time.time() - start_time < timeout:
        location = find_image_on_screen(template_path, confidence)
        if location:
            x, y, w, h = location
            # 点击图片中心
            center_x = x + w // 2
            center_y = y + h // 2
            pyautogui.click(center_x, center_y)
            print(f"点击了图片 {template_path} 在位置 ({center_x}, {center_y})")
            return True
        time.sleep(0.5)
    
    print(f"未找到图片: {template_path}")
    return False

def capture_screen_area(x, y, width, height, filename):
    """
    截取屏幕指定区域
    """
    try:
        screenshot = pyautogui.screenshot(region=(x, y, width, height))
        screenshot.save(filename)
        print(f"已保存截图: {filename}")
        return filename
    except Exception as e:
        print(f"截图失败: {str(e)}")
        return None

def capture_chat_screenshot(customer_id):
    """
    截取聊天区域并保存为图片
    这里需要根据千牛界面调整坐标
    """
    if not CONFIG['settings'].get('use_screenshot', True):
        return None
        
    try:
        # 先查找聊天窗口区域（需要预先保存聊天窗口的模板图片）
        chat_area = find_image_on_screen(f"{TEMPLATES_DIR}/chat_window.png")
        if chat_area:
            x, y, w, h = chat_area
            # 扩大截图区域以包含更多聊天内容
            expanded_x = max(0, x - 50)
            expanded_y = max(0, y - 50)
            expanded_w = w + 100
            expanded_h = h + 200
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{SCREENSHOTS_DIR}/{customer_id}_{timestamp}.png"
            
            return capture_screen_area(expanded_x, expanded_y, expanded_w, expanded_h, filename)
        else:
            # 如果找不到聊天窗口，使用固定坐标（需要根据实际情况调整）
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{SCREENSHOTS_DIR}/{customer_id}_{timestamp}.png"
            # 这里的坐标需要根据千牛界面实际情况调整
            return capture_screen_area(400, 200, 800, 600, filename)
    except Exception as e:
        print(f"截图失败: {str(e)}")
        return None

def upload_file_to_dify(file_path, customer_id):
    """上传文件到Dify，获取文件ID"""
    if not file_path or not os.path.exists(file_path):
        return None
    
    try:
        headers = {
            "Authorization": f"Bearer {DIFY_VISION_API_KEY}"
        }
        
        with open(file_path, 'rb') as file_object:
            files = {
                'file': (os.path.basename(file_path), file_object, 'image/png')
            }
            
            data = {
                'user': customer_id
            }
            
            response = requests.post(
                DIFY_FILE_UPLOAD_URL, 
                headers=headers,
                files=files,
                data=data
            )
        
        response.raise_for_status()
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
    """使用Dify视觉工作流分析图像内容"""
    if not image_path or not os.path.exists(image_path):
        return None
        
    try:
        file_id = upload_file_to_dify(image_path, customer_id)
        if not file_id:
            print("无法获取文件ID，无法进行图像分析")
            return None
        
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
        
        response = requests.post(
            DIFY_VISION_API_URL,
            json=payload,
            headers=DIFY_VISION_HEADERS
        )
        response.raise_for_status()
        
        result = response.json()
        extracted_text = result.get("data", {}).get("outputs", "")
        print(f"从图片中提取的文本: {extracted_text}")
        
        return extracted_text
    except Exception as e:
        print(f"分析图片失败: {str(e)}")
        return None

def chat_with_dify(customer_id, message):
    """使用Dify对话流处理消息并获取回复"""
    try:
        payload = {
            "inputs": {},
            "query": message,
            "user": customer_id,
            "response_mode": "blocking"
        }
        
        response = requests.post(DIFY_CHAT_API_URL, json=payload, headers=DIFY_HEADERS)
        response.raise_for_status()
        
        result = response.json()
        reply = result.get("answer", "")
        
        # 检查是否需要转人工
        need_human = "需要转人工" in reply or "转人工" in reply
        
        if need_human:
            reply = reply.replace("需要转人工", "").replace("转人工", "").strip()
        
        return reply, need_human
    except Exception as e:
        print(f"调用Dify对话API出错: {str(e)}")
        return "抱歉，系统暂时无法回答您的问题。", True

def transfer_to_human():
    """转交给人工客服处理"""
    try:
        # 点击转人工按钮（需要预先保存转人工按钮的模板图片）
        if click_image(f"{TEMPLATES_DIR}/transfer_button.png"):
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
        # 找到并点击输入框
        if click_image(f"{TEMPLATES_DIR}/input_box.png"):
            time.sleep(0.5)
            # 清空输入框
            pyautogui.hotkey('ctrl', 'a')
            time.sleep(0.2)
            
            # 使用剪贴板粘贴内容（支持中文）
            pyperclip.copy(message)
            pyautogui.hotkey('ctrl', 'v')
            time.sleep(0.5)
            
            # 点击发送按钮
            if click_image(f"{TEMPLATES_DIR}/send_button.png"):
                print(f"发送回复: {message}")
                return True
            else:
                # 如果找不到发送按钮，尝试按Enter键
                pyautogui.press('enter')
                print(f"发送回复: {message}")
                return True
        else:
            print("未找到输入框")
            return False
    except Exception as e:
        print(f"发送消息失败: {str(e)}")
        return False

def has_new_customer():
    """检查是否有新的待接待客户"""
    try:
        # 查找新消息通知图标
        new_message_location = find_image_on_screen(f"{TEMPLATES_DIR}/new_message.png")
        if new_message_location:
            # 生成临时客户ID
            customer_id = f"customer_{int(time.time())}"
            return True, customer_id
        return False, None
    except Exception as e:
        print(f"检查新客户失败: {str(e)}")
        return False, None

def handle_customer(customer_id):
    """处理单个客户的咨询"""
    try:
        print(f"正在处理客户: {customer_id}")
        
        # 点击新消息
        if click_image(f"{TEMPLATES_DIR}/new_message.png"):
            time.sleep(2)  # 等待聊天窗口加载
            
            # 截取聊天区域图片
            image_path = capture_chat_screenshot(customer_id)
            
            if image_path:
                # 分析图片内容
                extracted_text = analyze_image_with_dify(image_path, customer_id)
                
                if not extracted_text:
                    print("无法从图片中提取文本内容")
                    return
                
                message = extracted_text
                print(f"处理客户 {customer_id} 消息: {message}")
                
                # 生成回复
                reply, need_human = chat_with_dify(customer_id, message)
                
                # 处理回复
                if need_human:
                    print(f"客户 {customer_id} 需要转人工")
                    if reply.strip():
                        send_reply(reply)
                    transfer_to_human()
                else:
                    print(f"自动回复客户 {customer_id}: {reply}")
                    send_reply(reply)
                
                # 关闭当前会话（如果有关闭按钮）
                click_image(f"{TEMPLATES_DIR}/close_chat.png", timeout=2)
        
    except Exception as e:
        print(f"处理客户 {customer_id} 失败: {str(e)}")

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

def setup_templates():
    """设置模板图片提示"""
    templates_needed = [
        "chat_window.png",      # 聊天窗口
        "input_box.png",        # 输入框
        "send_button.png",      # 发送按钮
        "new_message.png",      # 新消息通知
        "transfer_button.png",  # 转人工按钮
        "close_chat.png"        # 关闭聊天按钮
    ]
    
    missing_templates = []
    for template in templates_needed:
        if not os.path.exists(f"{TEMPLATES_DIR}/{template}"):
            missing_templates.append(template)
    
    if missing_templates:
        print("=" * 50)
        print("警告：缺少以下模板图片文件，请先截取并保存到 templates 目录：")
        for template in missing_templates:
            print(f"  - {template}")
        print("\n使用方法：")
        print("1. 打开千牛客服界面")
        print("2. 截取各个UI元素的图片")
        print("3. 保存到 templates 目录，文件名如上所示")
        print("4. 图片应该尽量小且包含关键特征")
        print("=" * 50)
        return False
    return True

def main():
    print("启动千牛智能AI客服机器人 (PyAutoGUI版本)...")
    
    # 检查模板图片
    if not setup_templates():
        print("请先设置模板图片后再运行程序")
        return
    
    # 清理旧截图
    cleanup_old_screenshots()
    
    check_interval = CONFIG['settings']['check_interval']
    error_retry_interval = CONFIG['settings']['error_retry_interval']
    
    run_count = 0
    
    print("机器人已启动，开始监控新消息...")
    print("注意：将鼠标移动到屏幕左上角可以紧急停止程序")
    
    while True:
        try:
            # 检查新客户
            has_new, customer_id = has_new_customer()
            if has_new and customer_id:
                print(f"检测到新客户: {customer_id}")
                handle_customer(customer_id)
            
            # 定期清理
            run_count += 1
            if run_count >= 10:
                cleanup_old_screenshots()
                run_count = 0
            
            time.sleep(check_interval)
            
        except pyautogui.FailSafeException:
            print("检测到紧急停止信号，程序退出")
            break
        except Exception as e:
            print(f"运行时错误: {str(e)}")
            time.sleep(error_retry_interval)

if __name__ == "__main__":
    main()
