import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// 使用 vi.hoisted 确保 mock 函数在 vi.mock 之前可用
const { safeExecuteJavaScriptMock } = vi.hoisted(() => ({
  safeExecuteJavaScriptMock: vi.fn(),
}));

vi.mock('../utils.js', () => ({
  safeExecuteJavaScript: safeExecuteJavaScriptMock,
}));

import { AudioAnalyzer } from '../audio-analyzer.js';

describe('AudioAnalyzer', () => {
  let analyzer;
  let mockMainWindow;
  let mockBiliWindow;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    analyzer = new AudioAnalyzer();

    mockMainWindow = {
      isDestroyed: vi.fn(() => false),
      webContents: {
        send: vi.fn(),
      },
    };

    mockBiliWindow = {
      isDestroyed: vi.fn(() => false),
      webContents: {
        executeJavaScript: vi.fn(),
      },
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('setWindows', () => {
    it('应该设置窗口引用', () => {
      analyzer.setWindows(mockMainWindow, mockBiliWindow);

      expect(analyzer.mainWindow).toBe(mockMainWindow);
      expect(analyzer.biliWindow).toBe(mockBiliWindow);
    });
  });

  describe('startPolling', () => {
    it('应该开始轮询', () => {
      analyzer.setWindows(mockMainWindow, mockBiliWindow);

      analyzer.startPolling();

      expect(analyzer.pollInterval).not.toBeNull();
    });

    it('应该停止之前的轮询', () => {
      analyzer.setWindows(mockMainWindow, mockBiliWindow);

      analyzer.startPolling();
      const firstInterval = analyzer.pollInterval;

      analyzer.startPolling();
      const secondInterval = analyzer.pollInterval;

      expect(firstInterval).not.toBe(secondInterval);
    });

    it('应该在窗口不可用时停止轮询', () => {
      safeExecuteJavaScriptMock.mockRejectedValue(new Error('Window not available'));

      analyzer.setWindows(mockMainWindow, mockBiliWindow);
      analyzer.startPolling();

      mockBiliWindow.isDestroyed.mockReturnValue(true);

      vi.advanceTimersByTime(100);

      expect(analyzer.pollInterval).toBeNull();
    });
  });

  describe('stopPolling', () => {
    it('应该停止轮询', () => {
      analyzer.setWindows(mockMainWindow, mockBiliWindow);
      analyzer.startPolling();

      analyzer.stopPolling();

      expect(analyzer.pollInterval).toBeNull();
    });

    it('应该处理未开始轮询的情况', () => {
      expect(() => analyzer.stopPolling()).not.toThrow();
    });
  });

  describe('initAudioAnalyser', () => {
    it('应该初始化音频分析器', async () => {
      safeExecuteJavaScriptMock.mockResolvedValue(undefined);

      await analyzer.initAudioAnalyser(mockBiliWindow);

      expect(safeExecuteJavaScriptMock).toHaveBeenCalledWith(
        mockBiliWindow,
        expect.stringContaining('__audioAnalyser')
      );
    });

    it('应该在窗口不可用时跳过初始化', async () => {
      await analyzer.initAudioAnalyser(null);

      expect(safeExecuteJavaScriptMock).not.toHaveBeenCalled();
    });

    it('应该在窗口已销毁时跳过初始化', async () => {
      mockBiliWindow.isDestroyed.mockReturnValue(true);

      await analyzer.initAudioAnalyser(mockBiliWindow);

      expect(safeExecuteJavaScriptMock).not.toHaveBeenCalled();
    });

    it('应该处理初始化错误', async () => {
      safeExecuteJavaScriptMock.mockRejectedValue(new Error('初始化失败'));

      await expect(analyzer.initAudioAnalyser(mockBiliWindow)).resolves.not.toThrow();
    });
  });
});
