import { describe, it, expect } from 'vitest';
import { fmtKm, fmtL, fmtPct, notCostedNote, notMeasuredNote } from './tripReportsUtils';

describe('trip report formatters', () => {
  it('writes a dash for a number that was never measured', () => {
    expect(fmtKm(null)).toBe('—');
    expect(fmtL(undefined)).toBe('—');
    expect(fmtPct(null)).toBe('—');
  });

  it('writes a dash for a number that is not a number', () => {
    expect(fmtKm(NaN)).toBe('—');
    expect(fmtL(NaN)).toBe('—');
    expect(fmtPct(NaN)).toBe('—');
  });

  it('still prints a number that was measured', () => {
    expect(fmtKm(12.34)).toBe('12.3 km');
    expect(fmtL(4.567)).toBe('4.57 L');
    expect(fmtPct(12.34)).toBe('12.3%');
  });
});

describe('coverage notes', () => {
  it('counts the rows a total leaves out', () => {
    expect(notMeasuredNote(2)).toBe('2 rows not measured');
    expect(notMeasuredNote(1)).toBe('1 row not measured');
    expect(notCostedNote(3)).toBe('3 rows not costed');
  });

  it('says nothing when every row was counted', () => {
    expect(notMeasuredNote(0)).toBeNull();
    expect(notCostedNote(0)).toBeNull();
    expect(notMeasuredNote(undefined)).toBeNull();
  });
});
