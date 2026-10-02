import { describe, it, expect } from 'vitest';
import {
  toIST,
  formatRelativeIST,
  formatDateRange,
  formatClockIST,
  formatDateTimeIST,
  fmtLitres,
  fmtKm,
  fmtDuration,
  IST_ZONE,
} from './formatIST';

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

describe('formatDateTimeIST', () => {
  it('returns em-dash for invalid or empty input', () => {
    expect(formatDateTimeIST(null)).toBe('—');
    expect(formatDateTimeIST('')).toBe('—');
  });

  it('formats datetime correctly in IST', () => {
    const formatted = formatDateTimeIST('2026-08-15T00:00:00Z');
    expect(formatted).toBe('15 Aug 26, 05:30 AM');
  });
});

describe('fmtLitres', () => {
  it('handles null and invalid input', () => {
    expect(fmtLitres(null)).toBe('—');
    expect(fmtLitres(undefined)).toBe('—');
    expect(fmtLitres(NaN)).toBe('—');
  });

  it('formats numeric values with L suffix and 2 decimals', () => {
    expect(fmtLitres(150)).toBe('150.00 L');
    expect(fmtLitres(242.223)).toBe('242.22 L');
  });
});

describe('fmtKm', () => {
  it('handles null and invalid input', () => {
    expect(fmtKm(null)).toBe('—');
  });

  it('formats kilometres with km suffix and 1 decimal', () => {
    expect(fmtKm(614.58)).toBe('614.6 km');
  });
});

describe('fmtDuration', () => {
  it('returns null for invalid inputs', () => {
    expect(fmtDuration(null, null)).toBeNull();
    expect(fmtDuration('2026-08-10', '2026-08-09')).toBeNull();
  });

  it('formats hours and days', () => {
    const from = '2026-08-01T00:00:00Z';
    const to = '2026-08-03T04:30:00Z';
    expect(fmtDuration(from, to)).toBe('2d 4h');
  });
});
