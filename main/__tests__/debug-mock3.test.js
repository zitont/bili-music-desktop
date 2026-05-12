// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';

const { mockRegister } = vi.hoisted(() => ({
  mockRegister: vi.fn(() => true),
}));

vi.mock('electron', () => {
  const mockModule = {
    globalShortcut: {
      register: mockRegister,
      unregisterAll: vi.fn(),
    },
  };
  return {
    default: mockModule,
    ...mockModule,
  };
});

// 导入被测模块 - 它内部会 require('electron')
import { ShortcutManager } from '../shortcuts.js';

describe('debug require interception', () => {
  it('should intercept require("electron") in shortcuts.js', () => {
    const manager = new ShortcutManager();
    manager.register('Ctrl+A', vi.fn());
    expect(mockRegister).toHaveBeenCalledWith('Ctrl+A', expect.any(Function));
  });
});
