import { describe, it, expect } from 'vitest';
import { formatMileageDate, generateMileagePageNumbers } from './mileageTrackingLogic';

describe('formatMileageDate', () => {
  it('returns a dash for a missing date', () => {
    expect(formatMileageDate(null)).toBe('-');
    expect(formatMileageDate(undefined)).toBe('-');
  });

  it('formats a real date without throwing', () => {
    expect(formatMileageDate('2026-03-05T10:00:00.000Z')).not.toBe('-');
  });
});

describe('generateMileagePageNumbers', () => {
  it('lists every page when there are 5 or fewer', () => {
    expect(generateMileagePageNumbers(5, 3)).toEqual([1, 2, 3, 4, 5]);
  });

  it('windows around the current page with ellipses once there are more than 5', () => {
    expect(generateMileagePageNumbers(10, 5)).toEqual([1, '...', 4, 5, 6, '...', 10]);
  });

  it('has no leading ellipsis near the start and no trailing one near the end', () => {
    expect(generateMileagePageNumbers(10, 2)).toEqual([1, 2, 3, '...', 10]);
    expect(generateMileagePageNumbers(10, 9)).toEqual([1, '...', 8, 9, 10]);
  });
});
