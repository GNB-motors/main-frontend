import { describe, it, expect } from 'vitest';
import { formatDurationMin, matchesRegistration } from './idlingConsole.utils.js';

describe('formatDurationMin', () => {
  it('renders sub-hour durations in minutes', () => {
    expect(formatDurationMin(0)).toBe('0 min');
    expect(formatDurationMin(42)).toBe('42 min');
  });

  it('renders hour-plus durations as Xh Ym', () => {
    expect(formatDurationMin(95)).toBe('1h 35m');
  });

  it('drops the minutes part on an exact hour', () => {
    expect(formatDurationMin(120)).toBe('2h');
  });

  it('never goes negative on bad input', () => {
    expect(formatDurationMin(-5)).toBe('0 min');
    expect(formatDurationMin(null)).toBe('0 min');
    expect(formatDurationMin(undefined)).toBe('0 min');
  });
});

describe('matchesRegistration', () => {
  it('matches case-insensitively as a substring', () => {
    expect(matchesRegistration('mh01', 'MH01AB1234')).toBe(true);
    expect(matchesRegistration('ka', 'MH01AB1234')).toBe(false);
  });

  it('treats an empty query as matching everything', () => {
    expect(matchesRegistration('', 'MH01AB1234')).toBe(true);
    expect(matchesRegistration('  ', null)).toBe(true);
  });
});
