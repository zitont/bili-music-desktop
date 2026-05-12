import { describe, it, expect, vi } from 'vitest';
import {
  WINDOW_LOAD_TIMEOUT,
  safeExecuteJavaScript,
  isSafeUrl,
  formatMemorySize,
} from '../utils.js';

describe('工具函数', () => {
  describe('WINDOW_LOAD_TIMEOUT', () => {
    it('应该定义超时时间', () => {
      expect(WINDOW_LOAD_TIMEOUT).toBe(30000);
    });
  });

  describe('safeExecuteJavaScript', () => {
    it('应该执行 JavaScript 并返回结果', async () => {
      const mockWindow = {
        isDestroyed: vi.fn(() => false),
        webContents: {
          executeJavaScript: vi.fn(() => Promise.resolve('result')),
        },
      };

      const result = await safeExecuteJavaScript(mockWindow, 'test code');

      expect(result).toBe('result');
      expect(mockWindow.webContents.executeJavaScript).toHaveBeenCalledWith('test code');
    });

    it('应该在窗口已销毁时拒绝', async () => {
      const mockWindow = {
        isDestroyed: vi.fn(() => true),
      };

      await expect(safeExecuteJavaScript(mockWindow, 'test code')).rejects.toThrow(
        'Window is not available'
      );
    });

    it('应该在窗口为 null 时拒绝', async () => {
      await expect(safeExecuteJavaScript(null, 'test code')).rejects.toThrow(
        'Window is not available'
      );
    });

    it('应该在执行超时时拒绝', async () => {
      const mockWindow = {
        isDestroyed: vi.fn(() => false),
        webContents: {
          executeJavaScript: vi.fn(() => new Promise(() => {})), // 永不 resolve
        },
      };

      await expect(
        safeExecuteJavaScript(mockWindow, 'test code', 100)
      ).rejects.toThrow('Execute JavaScript timeout');
    }, 200);

    it('应该在执行失败时拒绝', async () => {
      const mockWindow = {
        isDestroyed: vi.fn(() => false),
        webContents: {
          executeJavaScript: vi.fn(() => Promise.reject(new Error('执行失败'))),
        },
      };

      await expect(safeExecuteJavaScript(mockWindow, 'test code')).rejects.toThrow('执行失败');
    });
  });

  describe('isSafeUrl', () => {
    it('应该接受 https URL', () => {
      expect(isSafeUrl('https://example.com')).toBe(true);
    });

    it('应该接受 http URL', () => {
      expect(isSafeUrl('http://example.com')).toBe(true);
    });

    it('应该拒绝非字符串', () => {
      expect(isSafeUrl(null)).toBe(false);
      expect(isSafeUrl(undefined)).toBe(false);
      expect(isSafeUrl(123)).toBe(false);
    });

    it('应该拒绝 javascript: URL', () => {
      expect(isSafeUrl('javascript:alert(1)')).toBe(false);
    });

    it('应该拒绝 data: URL', () => {
      expect(isSafeUrl('data:text/html,<h1>test</h1>')).toBe(false);
    });

    it('应该拒绝空字符串', () => {
      expect(isSafeUrl('')).toBe(false);
    });
  });

  describe('formatMemorySize', () => {
    it('应该格式化 0 字节', () => {
      expect(formatMemorySize(0)).toBe('0 GB');
    });

    it('应该格式化 1 GB', () => {
      const oneGB = 1024 * 1024 * 1024;
      expect(formatMemorySize(oneGB)).toBe('1 GB');
    });

    it('应该格式化 2.5 GB', () => {
      const twoPointFiveGB = 2.5 * 1024 * 1024 * 1024;
      expect(formatMemorySize(twoPointFiveGB)).toBe('2.5 GB');
    });

    it('应该四舍五入到两位小数', () => {
      const size = 1.23456 * 1024 * 1024 * 1024;
      expect(formatMemorySize(size)).toBe('1.23 GB');
    });
  });
});
