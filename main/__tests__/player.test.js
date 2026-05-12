import { describe, it, expect, vi, beforeEach } from 'vitest';

// 使用 vi.hoisted 确保 mock 函数在 vi.mock 之前可用
const { safeExecuteJavaScriptMock } = vi.hoisted(() => ({
  safeExecuteJavaScriptMock: vi.fn(),
}));

vi.mock('../utils.js', () => ({
  safeExecuteJavaScript: safeExecuteJavaScriptMock,
  WINDOW_LOAD_TIMEOUT: 30000,
}));

import {
  getVideoCurrentTime,
  setPlayerVolume,
  getVideoDuration,
  controlPlayback,
} from '../player.js';

describe('播放控制', () => {
  let mockBiliWindow;

  beforeEach(() => {
    vi.clearAllMocks();
    mockBiliWindow = {
      isDestroyed: vi.fn(() => false),
      webContents: {
        executeJavaScript: vi.fn(),
      },
    };
  });

  describe('getVideoCurrentTime', () => {
    it('应该获取当前播放时间', async () => {
      safeExecuteJavaScriptMock.mockResolvedValue(120);

      const result = await getVideoCurrentTime(mockBiliWindow, undefined);

      expect(result).toBe(120);
      expect(safeExecuteJavaScriptMock).toHaveBeenCalledWith(
        mockBiliWindow,
        expect.stringContaining('videoDom.currentTime')
      );
    });

    it('应该设置播放时间', async () => {
      safeExecuteJavaScriptMock.mockResolvedValue(60);

      const result = await getVideoCurrentTime(mockBiliWindow, 60);

      expect(result).toBe(60);
      expect(safeExecuteJavaScriptMock).toHaveBeenCalledWith(
        mockBiliWindow,
        expect.stringContaining('60')
      );
    });

    it('应该在窗口不可用时抛出错误', async () => {
      await expect(getVideoCurrentTime(null, 0)).rejects.toThrow(
        'Bili window is not available'
      );
    });

    it('应该在窗口已销毁时抛出错误', async () => {
      mockBiliWindow.isDestroyed.mockReturnValue(true);

      await expect(getVideoCurrentTime(mockBiliWindow, 0)).rejects.toThrow(
        'Bili window is not available'
      );
    });
  });

  describe('setPlayerVolume', () => {
    it('应该设置音量', async () => {
      safeExecuteJavaScriptMock.mockResolvedValue(0.8);

      const result = await setPlayerVolume(mockBiliWindow, 0.8);

      expect(result).toBe(0.8);
      expect(safeExecuteJavaScriptMock).toHaveBeenCalledWith(
        mockBiliWindow,
        expect.stringContaining('0.8')
      );
    });

    it('应该限制音量范围在 0-1', async () => {
      safeExecuteJavaScriptMock.mockResolvedValue(1);

      const result = await setPlayerVolume(mockBiliWindow, 1.5);

      expect(result).toBe(1);
    });

    it('应该在窗口不可用时返回 null', async () => {
      const result = await setPlayerVolume(null, 0.5);

      expect(result).toBeNull();
    });

    it('应该在窗口已销毁时返回 null', async () => {
      mockBiliWindow.isDestroyed.mockReturnValue(true);

      const result = await setPlayerVolume(mockBiliWindow, 0.5);

      expect(result).toBeNull();
    });
  });

  describe('getVideoDuration', () => {
    it('应该获取视频时长', async () => {
      safeExecuteJavaScriptMock.mockResolvedValue(300);

      const result = await getVideoDuration(mockBiliWindow);

      expect(result).toBe(300);
      expect(safeExecuteJavaScriptMock).toHaveBeenCalledWith(
        mockBiliWindow,
        expect.stringContaining('videoDom.duration')
      );
    });

    it('应该在窗口不可用时抛出错误', async () => {
      await expect(getVideoDuration(null)).rejects.toThrow(
        'Bili window is not available'
      );
    });

    it('应该在窗口已销毁时抛出错误', async () => {
      mockBiliWindow.isDestroyed.mockReturnValue(true);

      await expect(getVideoDuration(mockBiliWindow)).rejects.toThrow(
        'Bili window is not available'
      );
    });
  });

  describe('controlPlayback', () => {
    it('应该执行播放操作', async () => {
      safeExecuteJavaScriptMock.mockResolvedValue(true);

      const result = await controlPlayback(mockBiliWindow, 'play');

      expect(result).toBe(true);
      expect(safeExecuteJavaScriptMock).toHaveBeenCalledWith(
        mockBiliWindow,
        expect.stringContaining('player.play()')
      );
    });

    it('应该执行暂停操作', async () => {
      safeExecuteJavaScriptMock.mockResolvedValue(true);

      const result = await controlPlayback(mockBiliWindow, 'pause');

      expect(result).toBe(true);
      expect(safeExecuteJavaScriptMock).toHaveBeenCalledWith(
        mockBiliWindow,
        expect.stringContaining('player.pause()')
      );
    });

    it('应该在窗口不可用时返回 false', async () => {
      const result = await controlPlayback(null, 'play');

      expect(result).toBe(false);
    });

    it('应该在窗口已销毁时返回 false', async () => {
      mockBiliWindow.isDestroyed.mockReturnValue(true);

      const result = await controlPlayback(mockBiliWindow, 'play');

      expect(result).toBe(false);
    });

    it('应该在执行失败时返回 false', async () => {
      safeExecuteJavaScriptMock.mockRejectedValue(new Error('执行失败'));

      const result = await controlPlayback(mockBiliWindow, 'play');

      expect(result).toBe(false);
    });
  });
});
