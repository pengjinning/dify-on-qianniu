import { mouse, keyboard, Key, Button, Point } from '@nut-tree/nut-js';
import { ConfigManager } from './config';

export class MouseKeyboardController {
  private config = ConfigManager.getInstance().getSettings();

  constructor() {
    // 移除剪贴板初始化，使用更简单的方法
  }

  /**
   * 点击指定位置
   */
  async click(point: Point): Promise<boolean> {
    try {
      await mouse.setPosition(point);
      await this.sleep(this.config.click_delay);
      await mouse.leftClick();
      console.log(`点击位置: (${point.x}, ${point.y})`);
      return true;
    } catch (error) {
      console.error('点击失败:', error);
      return false;
    }
  }

  /**
   * 双击指定位置
   */
  async doubleClick(point: Point): Promise<boolean> {
    try {
      await mouse.setPosition(point);
      await this.sleep(this.config.click_delay);
      await mouse.doubleClick(Button.LEFT);
      console.log(`双击位置: (${point.x}, ${point.y})`);
      return true;
    } catch (error) {
      console.error('双击失败:', error);
      return false;
    }
  }

  /**
   * 右键点击
   */
  async rightClick(point: Point): Promise<boolean> {
    try {
      await mouse.setPosition(point);
      await this.sleep(this.config.click_delay);
      await mouse.rightClick();
      console.log(`右键点击位置: (${point.x}, ${point.y})`);
      return true;
    } catch (error) {
      console.error('右键点击失败:', error);
      return false;
    }
  }

  /**
   * 拖拽操作
   */
  async drag(from: Point, to: Point): Promise<boolean> {
    try {
      await mouse.setPosition(from);
      await mouse.pressButton(Button.LEFT);
      await mouse.setPosition(to);
      await mouse.releaseButton(Button.LEFT);
      console.log(`拖拽从 (${from.x}, ${from.y}) 到 (${to.x}, ${to.y})`);
      return true;
    } catch (error) {
      console.error('拖拽失败:', error);
      return false;
    }
  }

  /**
   * 输入文本（使用键盘直接输入）
   */
  async typeText(text: string): Promise<boolean> {
    try {
      // 使用 @nut-tree/nut-js 的 type 方法，它对中文支持较好
      await keyboard.type(text);
      console.log(`输入文本: ${text}`);
      return true;
    } catch (error) {
      console.error('输入文本失败:', error);
      return false;
    }
  }

  /**
   * 按下单个按键
   */
  async pressKey(key: Key): Promise<boolean> {
    try {
      await keyboard.pressKey(key);
      await keyboard.releaseKey(key);
      console.log(`按下按键: ${key}`);
      return true;
    } catch (error) {
      console.error('按键失败:', error);
      return false;
    }
  }

  /**
   * 按下组合键
   */
  async pressKeys(keys: Key[]): Promise<boolean> {
    try {
      // 按下所有键
      for (const key of keys) {
        await keyboard.pressKey(key);
      }
      
      await this.sleep(100);
      
      // 释放所有键（逆序）
      for (let i = keys.length - 1; i >= 0; i--) {
        await keyboard.releaseKey(keys[i]);
      }
      
      console.log(`按下组合键: ${keys.join('+')}`);
      return true;
    } catch (error) {
      console.error('组合键失败:', error);
      return false;
    }
  }

  /**
   * 清空输入框（全选+删除）
   */
  async clearInput(): Promise<boolean> {
    try {
      await this.pressKeys([Key.LeftCmd, Key.A]); // 全选
      await this.sleep(100);
      await this.pressKey(Key.Delete); // 删除
      console.log('清空输入框');
      return true;
    } catch (error) {
      console.error('清空输入框失败:', error);
      return false;
    }
  }

  /**
   * 发送回车键
   */
  async pressEnter(): Promise<boolean> {
    return await this.pressKey(Key.Return);
  }

  /**
   * 发送退格键
   */
  async pressBackspace(): Promise<boolean> {
    return await this.pressKey(Key.Backspace);
  }

  /**
   * 发送ESC键
   */
  async pressEscape(): Promise<boolean> {
    return await this.pressKey(Key.Escape);
  }

  /**
   * 获取鼠标当前位置
   */
  async getMousePosition(): Promise<Point> {
    return await mouse.getPosition();
  }

  /**
   * 移动鼠标到指定位置（不点击）
   */
  async moveMouse(point: Point): Promise<boolean> {
    try {
      await mouse.setPosition(point);
      return true;
    } catch (error) {
      console.error('移动鼠标失败:', error);
      return false;
    }
  }

  /**
   * 滚动鼠标滚轮
   */
  async scroll(direction: 'up' | 'down', clicks: number = 3): Promise<boolean> {
    try {
      const scrollDirection = direction === 'up' ? 1 : -1;
      for (let i = 0; i < clicks; i++) {
        await mouse.scrollUp(scrollDirection);
        await this.sleep(50);
      }
      console.log(`滚动鼠标 ${direction} ${clicks} 次`);
      return true;
    } catch (error) {
      console.error('滚动鼠标失败:', error);
      return false;
    }
  }

  /**
   * 延时函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
