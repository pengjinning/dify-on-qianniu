import axios, { AxiosResponse } from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';
import { ConfigManager } from './config';
import { DifyResponse, FileUploadResponse, ChatResponse } from '../types';

export class ApiClient {
  private config = ConfigManager.getInstance().getDifyConfig();

  /**
   * 上传文件到 Dify
   */
  async uploadFile(filePath: string, customerId: string): Promise<string | null> {
    if (!fs.existsSync(filePath)) {
      console.error(`文件不存在: ${filePath}`);
      return null;
    }

    try {
      const form = new FormData();
      form.append('file', fs.createReadStream(filePath));
      form.append('user', customerId);

      const response: AxiosResponse<FileUploadResponse> = await axios.post(
        this.config.file_upload_url,
        form,
        {
          headers: {
            'Authorization': `Bearer ${this.config.vision_api_key}`,
            ...form.getHeaders()
          }
        }
      );

      const fileId = response.data.id;
      if (fileId) {
        console.log(`文件上传成功，ID: ${fileId}`);
        return fileId;
      } else {
        console.error('上传文件失败：未返回文件ID');
        return null;
      }
    } catch (error) {
      console.error('上传文件失败:', error);
      return null;
    }
  }

  /**
   * 使用 Dify 视觉工作流分析图像
   */
  async analyzeImage(imagePath: string, customerId: string): Promise<string | null> {
    if (!fs.existsSync(imagePath)) {
      console.error(`图片文件不存在: ${imagePath}`);
      return null;
    }

    try {
      // 第一步：上传文件
      const fileId = await this.uploadFile(imagePath, customerId);
      if (!fileId) {
        console.error('无法获取文件ID，无法进行图像分析');
        return null;
      }

      // 第二步：调用视觉工作流
      const payload = {
        inputs: {
          input: {
            transfer_method: 'local_file',
            upload_file_id: fileId,
            type: 'image'
          }
        },
        response_mode: 'blocking',
        user: customerId
      };

      const response: AxiosResponse<DifyResponse> = await axios.post(
        this.config.vision_api_url,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.config.vision_api_key}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const extractedText = response.data.data?.outputs || response.data.answer || '';
      console.log(`从图片中提取的文本: ${extractedText}`);
      return extractedText;
    } catch (error) {
      console.error('分析图片失败:', error);
      return null;
    }
  }

  /**
   * 使用 Dify 对话流处理消息
   */
  async chatWithDify(customerId: string, message: string): Promise<ChatResponse> {
    try {
      const payload = {
        inputs: {},
        query: message,
        user: customerId,
        response_mode: 'blocking'
      };

      const response: AxiosResponse<DifyResponse> = await axios.post(
        this.config.chat_api_url,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.config.api_key}`,
            'Content-Type': 'application/json'
          }
        }
      );

      let reply = response.data.answer || '';
      
      // 检查是否需要转人工
      const needHuman = reply.includes('需要转人工') || reply.includes('转人工');
      
      // 清理回复内容
      if (needHuman) {
        reply = reply.replace(/需要转人工/g, '').replace(/转人工/g, '').trim();
      }

      return {
        reply,
        needHuman
      };
    } catch (error) {
      console.error('调用Dify对话API出错:', error);
      return {
        reply: '抱歉，系统暂时无法回答您的问题。',
        needHuman: true
      };
    }
  }

  /**
   * 检查 API 连接状态
   */
  async checkConnection(): Promise<boolean> {
    try {
      // 尝试发送一个简单的测试请求
      const testPayload = {
        inputs: {},
        query: '测试连接',
        user: 'test_user',
        response_mode: 'blocking'
      };

      await axios.post(
        this.config.chat_api_url,
        testPayload,
        {
          headers: {
            'Authorization': `Bearer ${this.config.api_key}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10秒超时
        }
      );

      console.log('API 连接正常');
      return true;
    } catch (error) {
      console.error('API 连接失败:', error);
      return false;
    }
  }

  /**
   * 批量处理消息（如果有多个客户）
   */
  async batchProcessMessages(messages: Array<{customerId: string, message: string}>): Promise<Array<ChatResponse & {customerId: string}>> {
    const results: Array<ChatResponse & {customerId: string}> = [];

    for (const {customerId, message} of messages) {
      try {
        const response = await this.chatWithDify(customerId, message);
        results.push({
          ...response,
          customerId
        });
        
        // 避免API限流，添加延迟
        await this.sleep(200);
      } catch (error) {
        console.error(`处理客户 ${customerId} 消息失败:`, error);
        results.push({
          reply: '系统错误，请稍后重试',
          needHuman: true,
          customerId
        });
      }
    }

    return results;
  }

  /**
   * 获取 API 使用统计（如果 Dify 支持）
   */
  async getApiStats(): Promise<any> {
    try {
      // 这里需要根据 Dify 的实际 API 文档调整
      const response = await axios.get(
        `${this.config.chat_api_url}/stats`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.api_key}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.warn('获取API统计失败:', error);
      return null;
    }
  }

  /**
   * 延时函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
