import { describe, it, expect } from 'vitest';
import { formatDuration, WHITELIST } from '../app.js';

describe('app utilities', () => {
  it('formats durations correctly', () => {
    expect(formatDuration(1000)).toBe('0d 0h 0m 1s');
    expect(formatDuration(1000 * 62)).toBe('0d 0h 1m 2s');
    expect(formatDuration(1000 * 3600 * 27 + 1000 * 61)).toBe('1d 3h 1m 1s');
  });

  it('has a whitelist set and resolves addresses', () => {
    expect(WHITELIST.has('0x1111111111111111111111111111111111111111')).toBe(true);
    expect(WHITELIST.has('0x0000000000000000000000000000000000000000')).toBe(false);
  });
});
