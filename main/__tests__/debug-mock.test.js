// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';

const { mockRegister } = vi.hoisted(() => ({
  mockRegister: vi.fn(() => 'mocked!'),
}));

vi.mock('electron', () => {
  const mockModule = {
    globalShortcut: {
      register: mockRegister,
      unregisterAll: vi.fn(),
    },
    Tray: vi.fn(),
    Menu: { buildFromTemplate: vi.fn() },
    nativeImage: { createFromPath: vi.fn() },
  };
  return {
    default: mockModule,
    ...mockModule,
  };
});

import { globalShortcut } from 'electron';

describe('debug mock', () => {
  it('should mock register', () => {
    const result = globalShortcut.register('test', vi.fn());
    expect(result).toBe('mocked!');
    expect(mockRegister).toHaveBeenCalled();
  });
});
