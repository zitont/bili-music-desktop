import { describe, it, expect } from 'vitest';

describe('示例测试', () => {
  it('应该通过基础断言', () => {
    expect(1 + 1).toBe(2);
  });

  it('应该验证字符串操作', () => {
    const str = 'Bili Music Desktop';
    expect(str).toContain('Music');
    expect(str.length).toBeGreaterThan(0);
  });
});
