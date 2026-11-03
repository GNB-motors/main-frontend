import { describe, it, expect } from 'vitest';
import {
  DASH,
  formatAgo,
  formatDuration,
  formatInr,
  formatIst,
  formatKm,
  formatKmh,
  formatL,
  formatNumber,
  formatPct,
  formatProbability,
} from './format';

describe('formatL', () => {
  it('adds litres and keeps one decimal', () => {
    expect(formatL(356.5)).toBe('356.5 L');
  });
  it('drops the decimal on a whole number', () => {
    expect(formatL(120)).toBe('120 L');
  });
  it('is an em dash for an unknown value, never 0', () => {
    expect(formatL(null)).toBe(DASH);
    expect(formatL(undefined)).toBe(DASH);
    expect(formatL(0)).toBe('0 L');
  });
});

describe('formatPct', () => {
  it('adds the percent sign', () => {
    expect(formatPct(60.8)).toBe('60.8%');
    expect(formatPct(98)).toBe('98%');
  });
  it('is an em dash for unknown', () => {
    expect(formatPct(null)).toBe(DASH);
  });
});

describe('formatKm', () => {
  it('groups with Indian digit grouping', () => {
    expect(formatKm(43478)).toBe('43,478 km');
  });
  it('is an em dash for unknown', () => {
    expect(formatKm(null)).toBe(DASH);
  });
});

describe('formatKmh', () => {
  it('adds km/h', () => {
    expect(formatKmh(26)).toBe('26 km/h');
  });
  it('is an em dash for unknown', () => {
    expect(formatKmh(null)).toBe(DASH);
  });
});

describe('formatDuration', () => {
  it('writes hours and minutes', () => {
    expect(formatDuration(130)).toBe('2 h 10 min');
  });
  it('writes minutes alone', () => {
    expect(formatDuration(45)).toBe('45 min');
  });
  it('writes hours alone without a stray "0 min"', () => {
    expect(formatDuration(120)).toBe('2 h');
  });
  it('is an em dash for unknown', () => {
    expect(formatDuration(null)).toBe(DASH);
  });
});

describe('formatIst', () => {
  it('shows the IST wall-clock time', () => {
    // 2026-11-02T18:48:00Z is 2026-11-03 00:18 IST
    expect(formatIst('2026-11-02T18:48:00Z', { withDate: false })).toBe('12:18 am');
  });
  it('adds the date for another day', () => {
    expect(formatIst('2026-09-09T03:40:00Z')).toBe('9 Sep, 9:10 am');
  });
  it('is an em dash for unknown', () => {
    expect(formatIst(null)).toBe(DASH);
  });
});

describe('formatAgo', () => {
  const now = new Date('2026-11-03T04:00:00Z');
  it('writes minutes', () => {
    expect(formatAgo('2026-11-03T03:48:00Z', { now })).toBe('12 min ago');
  });
  it('writes hours', () => {
    expect(formatAgo('2026-11-03T01:00:00Z', { now })).toBe('3 h ago');
  });
  it('writes days', () => {
    expect(formatAgo('2026-11-01T04:00:00Z', { now })).toBe('2 days ago');
  });
  it('is an em dash for unknown', () => {
    expect(formatAgo(null)).toBe(DASH);
  });
});

describe('formatInr', () => {
  it('adds the rupee sign and Indian grouping', () => {
    expect(formatInr(1240)).toBe('₹1,240');
    expect(formatInr(1234567)).toBe('₹12,34,567');
  });
  it('is an em dash for unknown, never ₹0', () => {
    expect(formatInr(null)).toBe(DASH);
    expect(formatInr(0)).toBe('₹0');
  });
});

describe('formatProbability', () => {
  it('prefers the plain count when one is given', () => {
    expect(formatProbability(0.75, { count: 18, total: 24 })).toBe('18 of 24 times');
  });
  it('says likely above 0.6', () => {
    expect(formatProbability(0.8)).toBe('likely');
  });
  it('says possible between 0.3 and 0.6', () => {
    expect(formatProbability(0.45)).toBe('possible');
  });
  it('hides a weak guess instead of printing a number', () => {
    expect(formatProbability(0.2)).toBeNull();
  });
});

describe('formatNumber', () => {
  it('groups with Indian digit grouping', () => {
    expect(formatNumber(4820)).toBe('4,820');
  });
  it('is an em dash for unknown', () => {
    expect(formatNumber(null)).toBe(DASH);
  });
});
