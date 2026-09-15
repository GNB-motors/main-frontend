import { describe, it, expect } from 'vitest';
import {
  formatServiceDate,
  formatServiceCurrency,
  formatServiceKm,
} from './serviceIntelligenceFormat';

describe('formatServiceDate', () => {
  it('returns an em dash for a missing or invalid date', () => {
    expect(formatServiceDate(null)).toBe('—');
    expect(formatServiceDate(undefined)).toBe('—');
    expect(formatServiceDate('not-a-date')).toBe('—');
  });

  it('formats a date as "DD Mon YYYY"', () => {
    expect(formatServiceDate('2026-03-05T10:00:00.000Z')).toBe('05 Mar 2026');
  });
});

describe('formatServiceCurrency', () => {
  it('returns an em dash for a missing amount', () => {
    expect(formatServiceCurrency(null)).toBe('—');
    expect(formatServiceCurrency(undefined)).toBe('—');
  });

  it('formats a number as INR with up to 2 decimal places', () => {
    expect(formatServiceCurrency(1500)).toBe('₹1,500');
    expect(formatServiceCurrency(1500.5)).toBe('₹1,500.5');
  });
});

describe('formatServiceKm', () => {
  it('returns an em dash for a missing value', () => {
    expect(formatServiceKm(null)).toBe('—');
    expect(formatServiceKm(undefined)).toBe('—');
  });

  it('formats a number as "N,NNN km"', () => {
    expect(formatServiceKm(45000)).toBe('45,000 km');
  });
});
