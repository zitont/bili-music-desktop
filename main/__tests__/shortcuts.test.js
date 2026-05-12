// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

// 使用 vi.hoisted 确保 mock 函数在 vi.mock 之前可用
const { mockRegister, mockUnregisterAll } = vi.hoisted(() => ({
  mockRegister: vi.fn(),
  mockUnregisterAll: vi.fn(),
}));

vi.mock('electron', () => ({
  globalShortcut: {
    register: mockRegister,
    unregisterAll: mockUnregisterAll,
  },
}));

import { ShortcutManager } from '../shortcuts.js';

describe('ShortcutManager', () => {
  let manager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new ShortcutManager();
  });

  describe('registerMediaKeys', () => {
    it('应该注册媒体键', () => {
      mockRegister.mockReturnValue(true);

      const handlers = {
        onTogglePlay: vi.fn(),
        onPlayPrevious: vi.fn(),
        onPlayNext: vi.fn(),
      };

      manager.registerMediaKeys(handlers);

      expect(mockRegister).toHaveBeenCalledTimes(3);
      expect(mockRegister).toHaveBeenCalledWith('MediaPlayPause', handlers.onTogglePlay);
      expect(mockRegister).toHaveBeenCalledWith('MediaNextTrack', handlers.onPlayNext);
      expect(mockRegister).toHaveBeenCalledWith('MediaPreviousTrack', handlers.onPlayPrevious);
    });

    it('应该记录注册成功的快捷键', () => {
      mockRegister.mockReturnValue(true);

      manager.registerMediaKeys({
        onTogglePlay: vi.fn(),
        onPlayPrevious: vi.fn(),
        onPlayNext: vi.fn(),
      });

      expect(manager.getRegisteredCount()).toBe(3);
    });

    it('应该处理注册失败', () => {
      mockRegister.mockReturnValue(false);

      manager.registerMediaKeys({
        onTogglePlay: vi.fn(),
        onPlayPrevious: vi.fn(),
        onPlayNext: vi.fn(),
      });

      expect(manager.getRegisteredCount()).toBe(0);
    });
  });

  describe('registerDevToolsKeys', () => {
    it('应该注册开发工具快捷键当未打包时', () => {
      mockRegister.mockReturnValue(true);

      const handlers = {
        onOpenDevTools: vi.fn(),
      };

      manager.registerDevToolsKeys(false, handlers);

      expect(mockRegister).toHaveBeenCalledWith('Ctrl+Shift+D', handlers.onOpenDevTools);
    });

    it('应该跳过注册当已打包时', () => {
      const handlers = {
        onOpenDevTools: vi.fn(),
      };

      manager.registerDevToolsKeys(true, handlers);

      expect(mockRegister).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('应该注册单个快捷键', () => {
      mockRegister.mockReturnValue(true);
      const callback = vi.fn();

      const result = manager.register('Ctrl+A', callback);

      expect(result).toBe(true);
      expect(mockRegister).toHaveBeenCalledWith('Ctrl+A', callback);
      expect(manager.isRegistered('Ctrl+A')).toBe(true);
    });

    it('应该处理注册失败', () => {
      mockRegister.mockReturnValue(false);
      const callback = vi.fn();

      const result = manager.register('Ctrl+A', callback);

      expect(result).toBe(false);
      expect(manager.isRegistered('Ctrl+A')).toBe(false);
    });

    it('应该处理注册错误', () => {
      mockRegister.mockImplementation(() => {
        throw new Error('注册失败');
      });
      const callback = vi.fn();

      const result = manager.register('Ctrl+A', callback);

      expect(result).toBe(false);
    });
  });

  describe('unregisterAll', () => {
    it('应该注销所有快捷键', () => {
      mockRegister.mockReturnValue(true);

      manager.register('Ctrl+A', vi.fn());
      manager.register('Ctrl+B', vi.fn());

      manager.unregisterAll();

      expect(mockUnregisterAll).toHaveBeenCalled();
      expect(manager.getRegisteredCount()).toBe(0);
    });
  });

  describe('isRegistered', () => {
    it('应该返回 true 当快捷键已注册', () => {
      mockRegister.mockReturnValue(true);

      manager.register('Ctrl+A', vi.fn());

      expect(manager.isRegistered('Ctrl+A')).toBe(true);
    });

    it('应该返回 false 当快捷键未注册', () => {
      expect(manager.isRegistered('Ctrl+A')).toBe(false);
    });
  });

  describe('getRegisteredCount', () => {
    it('应该返回注册的快捷键数量', () => {
      mockRegister.mockReturnValue(true);

      manager.register('Ctrl+A', vi.fn());
      manager.register('Ctrl+B', vi.fn());
      manager.register('Ctrl+C', vi.fn());

      expect(manager.getRegisteredCount()).toBe(3);
    });

    it('应该返回 0 当没有注册快捷键', () => {
      expect(manager.getRegisteredCount()).toBe(0);
    });
  });
});
