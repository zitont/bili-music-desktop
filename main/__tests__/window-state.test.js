import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

// 不模拟 fs，使用真实的临时目录进行测试
describe('窗口状态管理', () => {
  let tempDir;
  let loadWindowState;
  let saveWindowState;
  let getWindowStatePath;

  beforeEach(async () => {
    // 创建临时目录
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'window-state-test-'));

    // 动态导入模块
    const module = await import('../window-state.js');
    loadWindowState = module.loadWindowState;
    saveWindowState = module.saveWindowState;
    getWindowStatePath = module.getWindowStatePath;
  });

  afterEach(() => {
    // 清理临时目录
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('getWindowStatePath', () => {
    it('应该返回正确的路径', () => {
      const result = getWindowStatePath('/user/data');
      expect(result).toBe(path.join('/user/data', 'window-state.json'));
    });
  });

  describe('loadWindowState', () => {
    it('应该返回默认状态当文件不存在时', () => {
      const state = loadWindowState(tempDir);

      expect(state).toEqual({
        width: 1100,
        height: 730,
        x: undefined,
        y: undefined,
        isMaximized: false,
      });
    });

    it('应该从文件加载保存的状态', () => {
      const savedState = {
        width: 1200,
        height: 800,
        x: 100,
        y: 200,
        isMaximized: true,
      };

      const statePath = getWindowStatePath(tempDir);
      fs.writeFileSync(statePath, JSON.stringify(savedState));

      const state = loadWindowState(tempDir);

      expect(state).toEqual(savedState);
    });

    it('应该合并默认值当文件缺少字段时', () => {
      const partialState = { width: 1200 };

      const statePath = getWindowStatePath(tempDir);
      fs.writeFileSync(statePath, JSON.stringify(partialState));

      const state = loadWindowState(tempDir);

      expect(state.width).toBe(1200);
      expect(state.height).toBe(730);
      expect(state.isMaximized).toBe(false);
    });

    it('应该处理无效的 JSON', () => {
      const statePath = getWindowStatePath(tempDir);
      fs.writeFileSync(statePath, 'invalid json');

      const state = loadWindowState(tempDir);

      expect(state).toEqual({
        width: 1100,
        height: 730,
        x: undefined,
        y: undefined,
        isMaximized: false,
      });
    });
  });

  describe('saveWindowState', () => {
    it('应该保存窗口状态到文件', () => {
      const mockWindow = {
        isDestroyed: vi.fn(() => false),
        isMaximized: vi.fn(() => false),
        getBounds: vi.fn(() => ({ width: 1200, height: 800, x: 100, y: 200 })),
      };

      saveWindowState(mockWindow, tempDir);

      const statePath = getWindowStatePath(tempDir);
      expect(fs.existsSync(statePath)).toBe(true);

      const savedData = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
      expect(savedData).toEqual({
        width: 1200,
        height: 800,
        x: 100,
        y: 200,
        isMaximized: false,
      });
    });

    it('应该保存正常边界当窗口最大化时', () => {
      const mockWindow = {
        isDestroyed: vi.fn(() => false),
        isMaximized: vi.fn(() => true),
        getNormalBounds: vi.fn(() => ({ width: 1100, height: 730, x: 50, y: 50 })),
      };

      saveWindowState(mockWindow, tempDir);

      const statePath = getWindowStatePath(tempDir);
      const savedData = JSON.parse(fs.readFileSync(statePath, 'utf-8'));

      expect(savedData).toEqual({
        width: 1100,
        height: 730,
        x: 50,
        y: 50,
        isMaximized: true,
      });
    });

    it('应该跳过保存当窗口已销毁时', () => {
      const mockWindow = {
        isDestroyed: vi.fn(() => true),
      };

      saveWindowState(mockWindow, tempDir);

      const statePath = getWindowStatePath(tempDir);
      expect(fs.existsSync(statePath)).toBe(false);
    });

    it('应该处理窗口为 null', () => {
      saveWindowState(null, tempDir);

      const statePath = getWindowStatePath(tempDir);
      expect(fs.existsSync(statePath)).toBe(false);
    });
  });
});
