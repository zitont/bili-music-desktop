import { describe, it, expect, vi, beforeEach } from 'vitest';

// 使用 vi.hoisted 确保 mock 函数在 vi.mock 之前可用
const { mockCreateFromPath, mockBuildFromTemplate, mockTrayConstructor } = vi.hoisted(() => ({
  mockCreateFromPath: vi.fn(),
  mockBuildFromTemplate: vi.fn(),
  mockTrayConstructor: vi.fn().mockImplementation(function () {
    this.setToolTip = vi.fn();
    this.setContextMenu = vi.fn();
    this.on = vi.fn();
    this.destroy = vi.fn();
    return this;
  }),
}));

vi.mock('electron', () => ({
  Tray: mockTrayConstructor,
  Menu: {
    buildFromTemplate: mockBuildFromTemplate,
  },
  nativeImage: {
    createFromPath: mockCreateFromPath,
  },
}));

import { TrayManager } from '../tray.js';

describe('TrayManager', () => {
  let manager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new TrayManager();

    mockCreateFromPath.mockReturnValue('mock-icon');
    mockBuildFromTemplate.mockReturnValue('mock-menu');
  });

  describe('createTray', () => {
    it('应该创建系统托盘', () => {
      const handlers = {
        onShowWindow: vi.fn(),
        onPlayPrevious: vi.fn(),
        onTogglePlay: vi.fn(),
        onPlayNext: vi.fn(),
        onQuit: vi.fn(),
      };

      manager.createTray('/path/to/icon.png', handlers);

      expect(mockCreateFromPath).toHaveBeenCalledWith('/path/to/icon.png');
      expect(mockTrayConstructor).toHaveBeenCalled();
      expect(manager.exists()).toBe(true);
    });

    it('应该设置工具提示', () => {
      const handlers = {
        onShowWindow: vi.fn(),
        onPlayPrevious: vi.fn(),
        onTogglePlay: vi.fn(),
        onPlayNext: vi.fn(),
        onQuit: vi.fn(),
      };

      manager.createTray('/path/to/icon.png', handlers);

      expect(manager.tray.setToolTip).toHaveBeenCalledWith('Bili Music');
    });

    it('应该创建上下文菜单', () => {
      const handlers = {
        onShowWindow: vi.fn(),
        onPlayPrevious: vi.fn(),
        onTogglePlay: vi.fn(),
        onPlayNext: vi.fn(),
        onQuit: vi.fn(),
      };

      manager.createTray('/path/to/icon.png', handlers);

      expect(mockBuildFromTemplate).toHaveBeenCalledWith([
        { label: '显示主窗口', click: handlers.onShowWindow },
        { type: 'separator' },
        { label: '上一首', click: handlers.onPlayPrevious },
        { label: '播放/暂停', click: handlers.onTogglePlay },
        { label: '下一首', click: handlers.onPlayNext },
        { type: 'separator' },
        { label: '退出', click: handlers.onQuit },
      ]);
    });

    it('应该注册点击事件', () => {
      const handlers = {
        onShowWindow: vi.fn(),
        onPlayPrevious: vi.fn(),
        onTogglePlay: vi.fn(),
        onPlayNext: vi.fn(),
        onQuit: vi.fn(),
      };

      manager.createTray('/path/to/icon.png', handlers);

      expect(manager.tray.on).toHaveBeenCalledWith('click', handlers.onShowWindow);
    });
  });

  describe('destroy', () => {
    it('应该销毁托盘', () => {
      const handlers = {
        onShowWindow: vi.fn(),
        onPlayPrevious: vi.fn(),
        onTogglePlay: vi.fn(),
        onPlayNext: vi.fn(),
        onQuit: vi.fn(),
      };

      manager.createTray('/path/to/icon.png', handlers);
      const trayInstance = manager.tray;
      manager.destroy();

      expect(trayInstance.destroy).toHaveBeenCalled();
      expect(manager.exists()).toBe(false);
    });

    it('应该处理托盘不存在的情况', () => {
      expect(() => manager.destroy()).not.toThrow();
    });
  });

  describe('exists', () => {
    it('应该返回 true 当托盘存在', () => {
      const handlers = {
        onShowWindow: vi.fn(),
        onPlayPrevious: vi.fn(),
        onTogglePlay: vi.fn(),
        onPlayNext: vi.fn(),
        onQuit: vi.fn(),
      };

      manager.createTray('/path/to/icon.png', handlers);

      expect(manager.exists()).toBe(true);
    });

    it('应该返回 false 当托盘不存在', () => {
      expect(manager.exists()).toBe(false);
    });
  });
});
