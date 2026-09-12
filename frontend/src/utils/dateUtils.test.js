import {
  formatDateIST,
  formatDateLongIST,
  formatDateTimeIST,
  formatDateTimeLongIST,
  toISTDateString,
  toISTTimeString,
} from './dateUtils.js';

// 2024-01-15T10:30:00.000Z is 16:00 IST on the same calendar day.
// All expected strings below were verified against V8's en-IN/en-CA/en-GB ICU data.
const T = '2024-01-15T10:30:00.000Z';

describe('dateUtils.js — UTC → IST display formatting', () => {
  it('formatDateIST renders "15 Jan 2024"', () => {
    expect(formatDateIST(T)).toBe('15 Jan 2024');
  });

  it('formatDateLongIST renders "15 January 2024"', () => {
    expect(formatDateLongIST(T)).toBe('15 January 2024');
  });

  it('formatDateTimeIST renders date + 12-hour IST time', () => {
    expect(formatDateTimeIST(T)).toBe('15 Jan 2024, 04:00 pm');
  });

  it('formatDateTimeLongIST renders long month with time', () => {
    expect(formatDateTimeLongIST(T)).toBe('15 January 2024 at 04:00 pm');
  });

  it('toISTDateString extracts the IST calendar date', () => {
    expect(toISTDateString(T)).toBe('2024-01-15');
  });

  it('toISTTimeString extracts the IST wall-clock time', () => {
    expect(toISTTimeString(T)).toBe('16:00:00');
  });

  it('rolls the IST date forward after 18:30 UTC', () => {
    expect(toISTDateString('2024-01-15T18:30:00.000Z')).toBe('2024-01-16');
    expect(formatDateIST('2024-01-15T18:30:00.000Z')).toBe('16 Jan 2024');
  });

  it('handles IST midnight correctly (00:00:00, not 24:00:00)', () => {
    expect(toISTTimeString('2024-01-15T18:30:00.000Z')).toBe('00:00:00');
  });

  describe('edge cases', () => {
    it('empty input', () => {
      expect(formatDateIST('')).toBe('-');
      expect(formatDateLongIST(null)).toBe('-');
      expect(formatDateTimeIST(undefined)).toBe('-');
      expect(formatDateTimeLongIST('')).toBe('-');
      expect(toISTDateString('')).toBeNull();
      expect(toISTTimeString(null)).toBeNull();
    });

    it('unparseable input returns the input for display fns, null for extractors', () => {
      expect(formatDateIST('not-a-date')).toBe('not-a-date');
      expect(formatDateTimeIST('nope')).toBe('nope');
      expect(toISTDateString('nope')).toBeNull();
      expect(toISTTimeString('nope')).toBeNull();
    });
  });
});
