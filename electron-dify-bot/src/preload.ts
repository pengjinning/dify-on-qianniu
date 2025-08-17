import { contextBridge, ipcRenderer } from 'electron';

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 机器人控制
  startBot: () => ipcRenderer.invoke('start-bot'),
  stopBot: () => ipcRenderer.invoke('stop-bot'),
  getBotStatus: () => ipcRenderer.invoke('get-bot-status'),
  manualCheck: () => ipcRenderer.invoke('manual-check'),
  
  // 日志相关
  getLogs: () => ipcRenderer.invoke('get-logs'),
  
  // 事件监听
  onBotStatusChange: (callback: (status: any) => void) => {
    ipcRenderer.on('bot-status-changed', (event, status) => callback(status));
  },
  
  onLogUpdate: (callback: (log: any) => void) => {
    ipcRenderer.on('log-update', (event, log) => callback(log));
  }
});

// 类型定义
declare global {
  interface Window {
    electronAPI: {
      startBot: () => Promise<{ success: boolean; message: string }>;
      stopBot: () => Promise<{ success: boolean; message: string }>;
      getBotStatus: () => Promise<{ isRunning: boolean; runCount: number }>;
      manualCheck: () => Promise<{ success: boolean; message: string }>;
      getLogs: () => Promise<any[]>;
      onBotStatusChange: (callback: (status: any) => void) => void;
      onLogUpdate: (callback: (log: any) => void) => void;
    };
  }
}
