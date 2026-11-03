import { describe, it, expect } from 'vitest';
import { effectiveFreshness } from './freshness';

describe('effectiveFreshness', () => {
  it('keeps Live for a reading up to five minutes old', () => {
    expect(effectiveFreshness('live', 0)).toBe('live');
    expect(effectiveFreshness('live', 5)).toBe('live');
    expect(effectiveFreshness('live', null)).toBe('live');
  });

  it('never calls a 54-minute-old report live', () => {
    expect(effectiveFreshness('live', 54)).toBe('recent');
  });

  it('leaves the other states alone', () => {
    expect(effectiveFreshness('stale', 2)).toBe('stale');
    expect(effectiveFreshness(null, 2)).toBe('never');
  });
});
