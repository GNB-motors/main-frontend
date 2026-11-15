import { describe, expect, it } from 'vitest';
import { YEAR_NOT_CONFIRMED, billDateInfo, formatBillDate } from './billDates';

describe('bill dates', () => {
  it('writes a date the bill really carries', () => {
    expect(formatBillDate('2026-11-01')).toBe('1 Nov 2026');
    expect(formatBillDate('2026-11-01T00:00:00Z')).toBe('1 Nov 2026');
    expect(formatBillDate('01/11/2026')).toBe('1 Nov 2026');
    expect(formatBillDate('2 Nov 2026')).toBe('2 Nov 2026');
  });

  it('never guesses a year that is not on the bill', () => {
    const info = billDateInfo('2 Nov');
    expect(info.text).toBe('2 Nov');
    expect(info.yearWarning).toBe(YEAR_NOT_CONFIRMED);
    expect(info.yearWarning).toBe('year not confirmed — check the bill');
  });

  it('says nothing about the year when the bill gives one', () => {
    expect(billDateInfo('2026-11-02')).toEqual({ text: '2 Nov 2026', yearWarning: '' });
  });

  it('has nothing to say about a missing date', () => {
    expect(formatBillDate(null)).toBe('');
    expect(formatBillDate('')).toBe('');
    expect(billDateInfo(undefined)).toEqual({ text: '', yearWarning: '' });
  });
});
