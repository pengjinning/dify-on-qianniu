import { ConfigManager } from './config';
import { ScreenshotManager } from './screenshot';
import { ImageMatcher, MatchResult } from './image-matcher';
import { MouseKeyboardController } from './mouse-keyboard';
import { ApiClient } from './api-client';
import * as fs from 'fs';

export class QianniuBot {
  private config: ConfigManager;
  private screenshotManager: ScreenshotManager;
  private imageMatcher: ImageMatcher;
  private mouseKeyboard: MouseKeyboardController;
  private apiClient: ApiClient;
  private isRunning: boolean = false;
  private runCount: number = 0;

  constructor() {
    this.config = ConfigManager.getInstance();
    this.screenshotManager = new ScreenshotManager();
    this.imageMatcher = new ImageMatcher();
    this.mouseKeyboard = new MouseKeyboardController();
    this.apiClient = new ApiClient();
  }

  /**
   * 启动机器人
   */
  async start(): Promise<void> {
    console.log('启动千牛智能AI客服机器人 (Electron版本)...');
    
    // 验证配置
    if (!this.config.validateConfig()) {
      console.error('配置验证失败，请检查 config.json 文件');
      return;
    }

    // 检查模板图片
    if (!this.validateTemplates()) {
      console.error('请先设置模板图片后再运行程序');
      return;
    }

    // 检查 API 连接
    const apiConnected = await this.apiClient.checkConnection();
    if (!apiConnected) {
      console.warn('API 连接失败，但程序将继续运行');
    }

    // 清理旧截图
    await this.screenshotManager.cleanupOldScreenshots();

    console.log('机器人已启动，开始监控新消息...');
    console.log('按 Ctrl+C 停止程序');

    this.isRunning = true;
    await this.mainLoop();
  }

  /**
   * 停止机器人
   */
  stop(): void {
    console.log('正在停止机器人...');
    this.isRunning = false;
  }

  /**
   * 主循环
   */
  private async mainLoop(): Promise<void> {
    const settings = this.config.getSettings();

    while (this.isRunning) {
      try {
        // 检查新客户
        const hasNew = await this.checkForNewCustomers();
        if (hasNew) {
          await this.handleNewCustomer();
        }

        // 定期清理
        this.runCount++;
        if (this.runCount >= 10) {
          await this.screenshotManager.cleanupOldScreenshots();
          this.runCount = 0;
        }

        // 等待下一次检查
        await this.sleep(settings.check_interval);

      } catch (error) {
        console.error('运行时错误:', error);
        await this.sleep(settings.error_retry_interval);
      }
    }

    console.log('机器人已停止');
  }

  /**
   * 检查是否有新客户
   */
  private async checkForNewCustomers(): Promise<boolean> {
    try {
      const result = await this.imageMatcher.findImageOnScreen('new_message');
      return result.found;
    } catch (error) {
      console.error('检查新客户失败:', error);
      return false;
    }
  }

  /**
   * 处理新客户
   */
  private async handleNewCustomer(): Promise<void> {
    const customerId = this.generateCustomerId();
    console.log(`检测到新客户: ${customerId}`);

    try {
      // 1. 点击新消息通知
      const newMessageResult = await this.imageMatcher.findImageOnScreen('new_message');
      if (newMessageResult.found && newMessageResult.location) {
        await this.mouseKeyboard.click(newMessageResult.location);
        await this.sleep(2000); // 等待聊天窗口加载
      }

      // 2. 截取聊天内容
      const screenshot = await this.screenshotManager.captureChatWindow(customerId);
      if (!screenshot) {
        console.error('无法截取聊天内容');
        return;
      }

      // 3. 分析聊天内容
      const extractedText = await this.apiClient.analyzeImage(screenshot, customerId);
      if (!extractedText) {
        console.error('无法提取聊天文本');
        return;
      }

      console.log(`客户 ${customerId} 消息: ${extractedText}`);

      // 4. 生成回复
      const chatResponse = await this.apiClient.chatWithDify(customerId, extractedText);
      
      // 5. 发送回复
      if (chatResponse.reply.trim()) {
        await this.sendReply(chatResponse.reply);
      }

      // 6. 检查是否需要转人工
      if (chatResponse.needHuman) {
        console.log(`客户 ${customerId} 需要转人工`);
        await this.transferToHuman();
      }

      // 7. 关闭当前会话
      await this.closeCurrentChat();

    } catch (error) {
      console.error(`处理客户 ${customerId} 失败:`, error);
    }
  }

  /**
   * 发送回复
   */
  private async sendReply(message: string): Promise<boolean> {
    try {
      // 1. 找到并点击输入框
      const inputBoxResult = await this.imageMatcher.findImageOnScreen('input_box');
      if (!inputBoxResult.found || !inputBoxResult.location) {
        console.error('未找到输入框');
        return false;
      }

      await this.mouseKeyboard.click(inputBoxResult.location);
      await this.sleep(500);

      // 2. 清空输入框
      await this.mouseKeyboard.clearInput();

      // 3. 输入回复内容
      await this.mouseKeyboard.typeText(message);
      await this.sleep(500);

      // 4. 点击发送按钮
      const sendButtonResult = await this.imageMatcher.findImageOnScreen('send_button');
      if (sendButtonResult.found && sendButtonResult.location) {
        await this.mouseKeyboard.click(sendButtonResult.location);
        console.log(`发送回复: ${message}`);
        return true;
      } else {
        // 如果找不到发送按钮，尝试按回车键
        await this.mouseKeyboard.pressEnter();
        console.log(`发送回复 (回车键): ${message}`);
        return true;
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      return false;
    }
  }

  /**
   * 转交给人工客服
   */
  private async transferToHuman(): Promise<boolean> {
    try {
      const transferButtonResult = await this.imageMatcher.findImageOnScreen('transfer_button');
      if (transferButtonResult.found && transferButtonResult.location) {
        await this.mouseKeyboard.click(transferButtonResult.location);
        console.log('已转交给人工客服');
        return true;
      } else {
        console.warn('未找到转人工按钮');
        return false;
      }
    } catch (error) {
      console.error('转人工失败:', error);
      return false;
    }
  }

  /**
   * 关闭当前聊天
   */
  private async closeCurrentChat(): Promise<boolean> {
    try {
      const closeChatResult = await this.imageMatcher.findImageOnScreen('close_chat');
      if (closeChatResult.found && closeChatResult.location) {
        await this.mouseKeyboard.click(closeChatResult.location);
        console.log('已关闭当前聊天');
        return true;
      }
      return false;
    } catch (error) {
      console.error('关闭聊天失败:', error);
      return false;
    }
  }

  /**
   * 验证模板图片是否存在
   */
  private validateTemplates(): boolean {
    const templates = this.config.getTemplates();
    const missingTemplates: string[] = [];

    for (const [name, path] of Object.entries(templates)) {
      if (!fs.existsSync(path)) {
        missingTemplates.push(`${name}: ${path}`);
      }
    }

    if (missingTemplates.length > 0) {
      console.error('缺少以下模板图片文件:');
      missingTemplates.forEach(template => console.error(`  - ${template}`));
      console.error('\n请截取对应的UI元素并保存到指定路径');
      return false;
    }

    return true;
  }

  /**
   * 生成客户ID
   */
  private generateCustomerId(): string {
    return `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 延时函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取运行状态
   */
  getStatus(): { isRunning: boolean; runCount: number } {
    return {
      isRunning: this.isRunning,
      runCount: this.runCount
    };
  }

  /**
   * 手动触发一次客户检查 (调试用)
   */
  async manualCheck(): Promise<void> {
    console.log('手动触发客户检查...');
    const hasNew = await this.checkForNewCustomers();
    if (hasNew) {
      await this.handleNewCustomer();
    } else {
      console.log('没有检测到新客户');
    }
  }
}
