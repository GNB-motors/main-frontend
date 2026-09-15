import { describe, it, expect } from 'vitest';
import { toIST, formatRelativeIST, formatDateRange, formatClockIST, IST_ZONE } from './formatIST';

describe('toIST', () => {
  it('returns null for empty input', () => {
    expect(toIST(null)).toBeNull();
    expect(toIST('')).toBeNull();
    expect(toIST(undefined)).toBeNull();
  });

  it('converts a UTC instant into the IST zone', () => {
    const d = toIST('2026-08-15T00:00:00Z');
    expect(d.format('YYYY-MM-DD HH:mm')).toBe('2026-08-15 05:30');
    expect(d.format('Z')).toBe('+05:30');
    expect(IST_ZONE).toBe('Asia/Kolkata');
  });
});

describe('formatRelativeIST', () => {
  it('returns null when there is no timestamp', () => {
    expect(formatRelativeIST(null)).toBeNull();
  });

  it('returns a dayjs relative string for a timestamp', () => {
    const out = formatRelativeIST('2020-01-01T00:00:00Z');
    expect(typeof out).toBe('string');
    expect(out.length).toBeGreaterThan(0);
  });
});

describe('formatDateRange', () => {
  it('renders an em-dash for missing endpoints', () => {
    expect(formatDateRange(null, null)).toBe('— → —');
    expect(formatDateRange('', '')).toBe('— → —');
  });

  it('formats both endpoints in IST', () => {
    expect(formatDateRange('2026-08-01T00:00:00Z', '2026-08-10T00:00:00Z')).toBe(
      '01 Aug 26 → 10 Aug 26',
    );
  });
});

describe('formatClockIST', () => {
  it('returns null for empty input', () => {
    expect(formatClockIST(null)).toBeNull();
  });

  it('formats the IST wall-clock time', () => {
    expect(formatClockIST('2026-08-15T00:00:00Z')).toBe('05:30');
  });
});
