import * as fs from 'fs';
import * as path from 'path';
import { Config } from '../types';

export class ConfigManager {
  private static instance: ConfigManager;
  private config!: Config;
  private configPath: string;

  private constructor() {
    this.configPath = path.join(process.cwd(), 'config.json');
    this.loadConfig();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private loadConfig(): void {
    try {
      const configData = fs.readFileSync(this.configPath, 'utf-8');
      this.config = JSON.parse(configData);
      console.log('配置文件加载成功');
    } catch (error) {
      console.error('加载配置文件失败:', error);
      throw new Error('无法加载配置文件，请确保config.json文件存在且格式正确');
    }
  }

  public getConfig(): Config {
    return this.config;
  }

  public getDifyConfig() {
    return this.config.dify;
  }

  public getSettings() {
    return this.config.settings;
  }

  public getTemplates() {
    return this.config.templates;
  }

  public reloadConfig(): void {
    this.loadConfig();
  }

  public validateConfig(): boolean {
    const requiredFields = [
      'dify.vision_api_url',
      'dify.chat_api_url', 
      'dify.file_upload_url',
      'dify.api_key',
      'dify.vision_api_key'
    ];

    for (const field of requiredFields) {
      const value = this.getNestedValue(this.config, field);
      if (!value || value === 'your-dify-instance.com' || value.includes('your-')) {
        console.warn(`配置项 ${field} 需要设置正确的值`);
        return false;
      }
    }
    return true;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
