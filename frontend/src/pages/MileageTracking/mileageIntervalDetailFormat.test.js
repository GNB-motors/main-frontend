import { describe, it, expect } from 'vitest';
import { fmt, fmtDate, fmtDateShort, getVarianceMeta } from './mileageIntervalDetailFormat';

describe('fmt', () => {
  it('returns an em dash for null/undefined', () => {
    expect(fmt(null)).toBe('—');
    expect(fmt(undefined)).toBe('—');
  });

  it('formats a number to the given decimals, with an optional unit', () => {
    expect(fmt(12.3456, 2)).toBe('12.35');
    expect(fmt(12.3456, 1, 'km')).toBe('12.3 km');
  });

  it('does not treat 0 as missing', () => {
    expect(fmt(0, 2, 'L')).toBe('0.00 L');
  });
});

describe('fmtDate / fmtDateShort', () => {
  it('return an em dash for a missing date', () => {
    expect(fmtDate(null)).toBe('—');
    expect(fmtDateShort(null)).toBe('—');
  });

  it('format a real date without throwing', () => {
    expect(fmtDate('2026-03-05T10:00:00.000Z')).not.toBe('—');
    expect(fmtDateShort('2026-03-05T10:00:00.000Z')).not.toBe('—');
  });
});

describe('getVarianceMeta', () => {
  it('returns the neutral dash state for a missing percentage', () => {
    expect(getVarianceMeta(null).label).toBe('—');
    expect(getVarianceMeta(undefined).color).toBe('#6b7280');
  });

  it('is "normal" (green) at or under 10%', () => {
    expect(getVarianceMeta(10).color).toBe('#15803d');
    expect(getVarianceMeta(-10).color).toBe('#15803d');
  });

  it('is "review" (amber) between 10% and 50%', () => {
    expect(getVarianceMeta(30).color).toBe('#c56200');
    expect(getVarianceMeta(-50).color).toBe('#c56200');
  });

  it('is "flagged" (red) beyond 50%', () => {
    expect(getVarianceMeta(51).color).toBe('#b91c1c');
    expect(getVarianceMeta(-75).color).toBe('#b91c1c');
  });

  it('prefixes a positive variance with a plus sign', () => {
    expect(getVarianceMeta(5).label).toBe('+5.0%');
    expect(getVarianceMeta(-5).label).toBe('-5.0%');
  });
});
