import { describe, it, expect } from 'vitest';
import {
  formatNumber,
  formatCurrency,
  formatDate,
  toStartOfDayIso,
  toEndOfDayIso,
} from './mileageIntervalReportUtils';

describe('mileageIntervalReportUtils', () => {
  describe('formatNumber', () => {
    it('formats numbers using en-IN locale', () => {
      expect(formatNumber(12500)).toBe('12,500');
      expect(formatNumber(12500.55, 1)).toBe('12,500.6');
      expect(formatNumber(null)).toBe('—');
      expect(formatNumber(undefined)).toBe('—');
      expect(formatNumber('abc')).toBe('—');
    });
  });

  describe('formatCurrency', () => {
    it('formats Indian rupee currency', () => {
      expect(formatCurrency(25000)).toBe('₹25,000');
      expect(formatCurrency(null)).toBe('—');
      expect(formatCurrency(undefined)).toBe('—');
    });
  });

  describe('formatDate (Asia/Kolkata)', () => {
    it('formats UTC timestamp in IST', () => {
      expect(formatDate(null)).toBe('—');
      expect(formatDate(undefined)).toBe('—');
      expect(formatDate('2026-09-06T12:00:00Z')).toBe('06 Sep 2026');
    });
  });

  describe('ISO day boundaries', () => {
    it('toStartOfDayIso produces start-of-day ISO', () => {
      expect(toStartOfDayIso('')).toBeUndefined();
      expect(toStartOfDayIso(null)).toBeUndefined();
      const start = toStartOfDayIso('2026-09-06');
      expect(new Date(start).getDate()).toBe(6);
    });

    it('toEndOfDayIso produces end-of-day ISO', () => {
      expect(toEndOfDayIso('')).toBeUndefined();
      expect(toEndOfDayIso(null)).toBeUndefined();
      const end = toEndOfDayIso('2026-09-06');
      expect(new Date(end).getDate()).toBe(6);
    });
  });
});
