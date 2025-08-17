import { screen } from '@nut-tree/nut-js';
import Jimp from 'jimp';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigManager } from './config';

export class ScreenshotManager {
  private config = ConfigManager.getInstance().getSettings();
  private screenshotsDir = 'screenshots';

  constructor() {
    this.ensureDirectoryExists(this.screenshotsDir);
  }

  /**
   * 截取全屏截图
   */
  async captureFullScreen(): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = path.join(this.screenshotsDir, `fullscreen_${timestamp}.png`);
      
      const screenshot = await screen.grab();
      // 简化实现：直接写入文件（需要根据实际API调整）
      const buffer = Buffer.alloc(0); // 占位符，实际需要实现图像转换
      fs.writeFileSync(filename, buffer);
      
      console.log(`全屏截图已保存: ${filename}`);
      return filename;
    } catch (error) {
      console.error('全屏截图失败:', error);
      throw error;
    }
  }

  /**
   * 截取指定区域截图
   */
  async captureRegion(x: number, y: number, width: number, height: number, customerId: string): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = path.join(this.screenshotsDir, `${customerId}_${timestamp}.png`);
      
      const screenshot = await screen.grab();
      // 简化实现：创建空文件作为占位符
      const buffer = Buffer.alloc(0);
      fs.writeFileSync(filename, buffer);
      
      console.log(`区域截图已保存: ${filename}`);
      return filename;
    } catch (error) {
      console.error('区域截图失败:', error);
      throw error;
    }
  }

  /**
   * 截取聊天窗口区域 (需要先找到聊天窗口位置)
   */
  async captureChatWindow(customerId: string): Promise<string | null> {
    if (!this.config.use_screenshot) {
      return null;
    }

    try {
      // 暂时使用固定区域，实际使用时需要动态识别
      return await this.captureRegion(400, 200, 800, 600, customerId);
    } catch (error) {
      console.error('截取聊天窗口失败:', error);
      return null;
    }
  }

  /**
   * 清理过期截图
   */
  async cleanupOldScreenshots(): Promise<void> {
    if (!this.config.cleanup_screenshots) {
      return;
    }

    try {
      const files = fs.readdirSync(this.screenshotsDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.cleanup_after_days);

      for (const file of files) {
        if (file.endsWith('.png')) {
          const filePath = path.join(this.screenshotsDir, file);
          const stats = fs.statSync(filePath);
          
          if (stats.birthtime < cutoffDate) {
            fs.unlinkSync(filePath);
            console.log(`已清理过期截图: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('清理截图失败:', error);
    }
  }

  /**
   * 比较两张图片的相似度 (简单像素比较)
   */
  async compareImages(image1Path: string, image2Path: string): Promise<number> {
    try {
      const img1 = await Jimp.read(image1Path);
      const img2 = await Jimp.read(image2Path);

      if (img1.getWidth() !== img2.getWidth() || img1.getHeight() !== img2.getHeight()) {
        return 0; // 尺寸不同，相似度为0
      }

      let diffPixels = 0;
      const totalPixels = img1.getWidth() * img1.getHeight();

      img1.scan(0, 0, img1.getWidth(), img1.getHeight(), (x: number, y: number, idx: number) => {
        const pixel1 = img1.getPixelColor(x, y);
        const pixel2 = img2.getPixelColor(x, y);
        
        if (pixel1 !== pixel2) {
          diffPixels++;
        }
      });

      const similarity = 1 - (diffPixels / totalPixels);
      return similarity;
    } catch (error) {
      console.error('图片比较失败:', error);
      return 0;
    }
  }

  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}
