import { screen } from '@nut-tree/nut-js';
import Jimp from 'jimp';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigManager } from './config';
import { Point, Region } from '../types';

export interface MatchResult {
  found: boolean;
  location?: Point;
  region?: Region;
  confidence?: number;
}

export class ImageMatcher {
  private config = ConfigManager.getInstance();
  private templates = this.config.getTemplates();
  private settings = this.config.getSettings();

  /**
   * 在屏幕上查找模板图片
   */
  async findImageOnScreen(templateName: keyof typeof this.templates): Promise<MatchResult> {
    try {
      const templatePath = this.templates[templateName];
      
      if (!fs.existsSync(templatePath)) {
        console.warn(`模板图片不存在: ${templatePath}`);
        return { found: false };
      }

      // 截取当前屏幕
      const screenshotPath = await this.captureScreenshot();
      
      // 进行模板匹配
      const matchResult = await this.matchTemplate(screenshotPath, templatePath);
      
      // 清理临时截图
      this.cleanupTempFile(screenshotPath);
      
      return matchResult;
    } catch (error) {
      console.error(`查找图片失败 (${templateName}):`, error);
      return { found: false };
    }
  }

  /**
   * 等待图片出现在屏幕上
   */
  async waitForImage(
    templateName: keyof typeof this.templates, 
    timeoutMs: number = 10000
  ): Promise<MatchResult> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const result = await this.findImageOnScreen(templateName);
      if (result.found) {
        return result;
      }
      
      // 等待一段时间后重试
      await this.sleep(500);
    }
    
    console.warn(`等待图片超时: ${templateName}`);
    return { found: false };
  }

  /**
   * 查找图片并点击
   */
  async findAndClick(templateName: keyof typeof this.templates): Promise<boolean> {
    const result = await this.findImageOnScreen(templateName);
    
    if (result.found && result.location) {
      // 这里需要结合鼠标控制模块
      console.log(`找到图片 ${templateName}，位置: (${result.location.x}, ${result.location.y})`);
      return true;
    }
    
    return false;
  }

  /**
   * 模板匹配核心算法
   */
  private async matchTemplate(screenshotPath: string, templatePath: string): Promise<MatchResult> {
    try {
      const screenshot = await Jimp.read(screenshotPath);
      const template = await Jimp.read(templatePath);
      
      const screenWidth = screenshot.getWidth();
      const screenHeight = screenshot.getHeight();
      const templateWidth = template.getWidth();
      const templateHeight = template.getHeight();
      
      let bestMatch = {
        x: -1,
        y: -1,
        confidence: 0
      };
      
      // 滑动窗口匹配
      for (let y = 0; y <= screenHeight - templateHeight; y += 2) {
        for (let x = 0; x <= screenWidth - templateWidth; x += 2) {
          const confidence = await this.calculateSimilarity(
            screenshot, template, x, y, templateWidth, templateHeight
          );
          
          if (confidence > bestMatch.confidence) {
            bestMatch = { x, y, confidence };
          }
        }
      }
      
      const threshold = this.settings.confidence_threshold;
      if (bestMatch.confidence >= threshold) {
        return {
          found: true,
          location: { 
            x: bestMatch.x + Math.floor(templateWidth / 2), 
            y: bestMatch.y + Math.floor(templateHeight / 2) 
          },
          region: {
            x: bestMatch.x,
            y: bestMatch.y,
            width: templateWidth,
            height: templateHeight
          },
          confidence: bestMatch.confidence
        };
      }
      
      return { found: false };
    } catch (error) {
      console.error('模板匹配失败:', error);
      return { found: false };
    }
  }

  /**
   * 计算图像相似度
   */
  private async calculateSimilarity(
    screenshot: Jimp, 
    template: Jimp, 
    x: number, 
    y: number, 
    width: number, 
    height: number
  ): Promise<number> {
    let matchingPixels = 0;
    let totalPixels = 0;
    
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const screenPixel = screenshot.getPixelColor(x + dx, y + dy);
        const templatePixel = template.getPixelColor(dx, dy);
        
        totalPixels++;
        
        // 简单的颜色匹配，可以改进为更复杂的算法
        if (this.colorsMatch(screenPixel, templatePixel)) {
          matchingPixels++;
        }
      }
    }
    
    return matchingPixels / totalPixels;
  }

  /**
   * 判断两个颜色是否匹配
   */
  private colorsMatch(color1: number, color2: number, threshold: number = 20): boolean {
    const r1 = (color1 >> 24) & 0xFF;
    const g1 = (color1 >> 16) & 0xFF;
    const b1 = (color1 >> 8) & 0xFF;
    
    const r2 = (color2 >> 24) & 0xFF;
    const g2 = (color2 >> 16) & 0xFF;
    const b2 = (color2 >> 8) & 0xFF;
    
    const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
    return diff <= threshold;
  }

  /**
   * 截取当前屏幕 (临时文件)
   */
  private async captureScreenshot(): Promise<string> {
    const tempPath = path.join('screenshots', `temp_${Date.now()}.png`);
    const screenshot = await screen.grab();
    // 简单实现：将截图保存为临时文件
    fs.writeFileSync(tempPath, await this.imageToBuffer(screenshot));
    return tempPath;
  }

  /**
   * 图像转换为 Buffer (简化实现)
   */
  private async imageToBuffer(image: any): Promise<Buffer> {
    // 这里需要根据实际的 nut.js API 调整
    // 暂时返回空 buffer，实际使用时需要实现
    return Buffer.alloc(0);
  }

  /**
   * 清理临时文件
   */
  private cleanupTempFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.warn(`清理临时文件失败: ${filePath}`, error);
    }
  }

  /**
   * 延时函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
