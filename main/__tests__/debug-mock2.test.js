// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';

const { safeExecuteJavaScriptMock } = vi.hoisted(() => ({
  safeExecuteJavaScriptMock: vi.fn(() => 'mocked!'),
}));

vi.mock('../utils.js', () => {
  const mockModule = {
    safeExecuteJavaScript: safeExecuteJavaScriptMock,
    WINDOW_LOAD_TIMEOUT: 30000,
    isSafeUrl: vi.fn(),
    formatMemorySize: vi.fn(),
  };
  return {
    default: mockModule,
    ...mockModule,
  };
});

import { safeExecuteJavaScript, WINDOW_LOAD_TIMEOUT } from '../utils.js';

describe('debug utils mock', () => {
  it('should mock safeExecuteJavaScript', () => {
    const result = safeExecuteJavaScript({}, 'test');
    expect(result).toBe('mocked!');
  });

  it('should have WINDOW_LOAD_TIMEOUT', () => {
    expect(WINDOW_LOAD_TIMEOUT).toBe(30000);
  });
});
