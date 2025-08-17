import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron';
import * as path from 'path';
import { QianniuBot } from './bot/qianniu-bot';

class ElectronApp {
  private mainWindow: BrowserWindow | null = null;
  private tray: Tray | null = null;
  private bot: QianniuBot;
  private isDev: boolean;

  constructor() {
    this.bot = new QianniuBot();
    this.isDev = process.argv.includes('--dev');
  }

  /**
   * 初始化应用
   */
  async initialize(): Promise<void> {
    await app.whenReady();
    
    // 创建主窗口
    this.createMainWindow();
    
    // 创建系统托盘
    this.createTray();
    
    // 注册IPC事件
    this.registerIpcHandlers();
    
    // 处理应用事件
    this.handleAppEvents();

    console.log('Electron 应用已启动');
  }

  /**
   * 创建主窗口
   */
  private createMainWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
        webSecurity: true
      },
      title: '千牛智能客服机器人',
      icon: this.getAppIcon(),
      show: this.isDev // 开发模式显示窗口，生产模式隐藏
    });

    // 加载UI页面
    if (this.isDev) {
      // 开发模式：加载本地HTML文件
      const uiPath = path.join(__dirname, '../ui/index.html');
      this.mainWindow.loadFile(uiPath);
      this.mainWindow.webContents.openDevTools();
    } else {
      // 生产模式：加载简单的状态页面
      this.mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';">
          <title>千牛智能客服机器人</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 40px; text-align: center; background: #f5f5f5; }
            .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #333; margin-bottom: 20px; }
            p { color: #666; line-height: 1.6; }
            .status { color: #4CAF50; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🤖 千牛智能客服机器人</h1>
            <p class="status">正在后台运行中...</p>
            <p>请通过系统托盘菜单管理机器人</p>
            <p>右键点击托盘图标可以启动/停止机器人</p>
          </div>
        </body>
        </html>
      `));
    }

    // 窗口关闭时隐藏而不是退出
    this.mainWindow.on('close', (event) => {
      event.preventDefault();
      this.mainWindow?.hide();
    });
  }

  /**
   * 创建系统托盘
   */
  private createTray(): void {
    const trayIcon = this.getAppIcon();
    this.tray = new Tray(trayIcon);
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示主窗口',
        click: () => {
          this.mainWindow?.show();
        }
      },
      {
        label: '启动机器人',
        click: async () => {
          await this.startBot();
        }
      },
      {
        label: '停止机器人',
        click: () => {
          this.stopBot();
        }
      },
      {
        label: '手动检查',
        click: async () => {
          await this.manualCheck();
        }
      },
      { type: 'separator' },
      {
        label: '退出应用',
        click: () => {
          this.quit();
        }
      }
    ]);

    this.tray.setToolTip('千牛智能客服机器人');
    this.tray.setContextMenu(contextMenu);
    
    // 双击托盘图标显示主窗口
    this.tray.on('double-click', () => {
      this.mainWindow?.show();
    });
  }

  /**
   * 注册IPC处理器
   */
  private registerIpcHandlers(): void {
    // 启动机器人
    ipcMain.handle('start-bot', async () => {
      return await this.startBot();
    });

    // 停止机器人
    ipcMain.handle('stop-bot', () => {
      return this.stopBot();
    });

    // 获取机器人状态
    ipcMain.handle('get-bot-status', () => {
      return this.bot.getStatus();
    });

    // 手动检查
    ipcMain.handle('manual-check', async () => {
      return await this.manualCheck();
    });

    // 获取日志（如果实现了日志系统）
    ipcMain.handle('get-logs', () => {
      // TODO: 实现日志获取
      return [];
    });
  }

  /**
   * 处理应用事件
   */
  private handleAppEvents(): void {
    app.on('window-all-closed', (event: any) => {
      // 阻止应用退出，保持后台运行
      event.preventDefault();
    });

    app.on('activate', () => {
      // macOS 上点击dock图标时重新创建窗口
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow();
      } else {
        this.mainWindow?.show();
      }
    });

    // 处理第二次启动
    app.on('second-instance', () => {
      if (this.mainWindow) {
        if (this.mainWindow.isMinimized()) {
          this.mainWindow.restore();
        }
        this.mainWindow.focus();
      }
    });
  }

  /**
   * 启动机器人
   */
  private async startBot(): Promise<{ success: boolean; message: string }> {
    try {
      await this.bot.start();
      this.updateTrayTitle('运行中');
      return { success: true, message: '机器人已启动' };
    } catch (error) {
      console.error('启动机器人失败:', error);
      return { success: false, message: `启动失败: ${error}` };
    }
  }

  /**
   * 停止机器人
   */
  private stopBot(): { success: boolean; message: string } {
    try {
      this.bot.stop();
      this.updateTrayTitle('已停止');
      return { success: true, message: '机器人已停止' };
    } catch (error) {
      console.error('停止机器人失败:', error);
      return { success: false, message: `停止失败: ${error}` };
    }
  }

  /**
   * 手动检查
   */
  private async manualCheck(): Promise<{ success: boolean; message: string }> {
    try {
      await this.bot.manualCheck();
      return { success: true, message: '手动检查完成' };
    } catch (error) {
      console.error('手动检查失败:', error);
      return { success: false, message: `检查失败: ${error}` };
    }
  }

  /**
   * 更新托盘标题
   */
  private updateTrayTitle(status: string): void {
    if (this.tray) {
      this.tray.setToolTip(`千牛智能客服机器人 - ${status}`);
    }
  }

  /**
   * 获取应用图标
   */
  private getAppIcon(): Electron.NativeImage {
    try {
      // 尝试加载自定义图标
      const iconPath = path.join(__dirname, '../assets/icon.png');
      return nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
    } catch (error) {
      // 如果没有图标文件，创建一个简单的默认图标
      return nativeImage.createEmpty();
    }
  }

  /**
   * 退出应用
   */
  private quit(): void {
    this.bot.stop();
    app.quit();
  }
}

// 防止多重启动
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  // 启动应用
  const electronApp = new ElectronApp();
  electronApp.initialize().catch(console.error);
}
