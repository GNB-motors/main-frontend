import { describe, expect, it } from 'vitest';
import { coverageNote, isMeasured, sumKnown, toMeasured } from './measured';

describe('isMeasured', () => {
  it('accepts real numbers, including a measured 0', () => {
    expect(isMeasured(0)).toBe(true);
    expect(isMeasured(12.5)).toBe(true);
    expect(isMeasured('42')).toBe(true);
  });

  it('rejects everything Number() would quietly turn into a value', () => {
    [null, undefined, '', '  ', true, false, NaN, Infinity, 'abc', [], {}].forEach((value) => {
      expect(isMeasured(value)).toBe(false);
    });
  });
});

describe('toMeasured', () => {
  it('keeps a measured 0 and returns null for an unknown', () => {
    expect(toMeasured(0)).toBe(0);
    expect(toMeasured('7')).toBe(7);
    expect(toMeasured(null)).toBeNull();
  });
});

describe('sumKnown', () => {
  it('leaves unknowns out and counts them', () => {
    expect(sumKnown([10, null, 5, undefined])).toEqual({ sum: 15, known: 2, unknown: 2, total: 4 });
  });

  it('is null, not 0, when nothing was measured', () => {
    expect(sumKnown([null, undefined]).sum).toBeNull();
    expect(sumKnown([]).sum).toBeNull();
  });

  it('is 0 when the measured values really add up to 0', () => {
    expect(sumKnown([0, null]).sum).toBe(0);
  });
});

describe('coverageNote', () => {
  it('says how many items a figure covers', () => {
    expect(coverageNote(42, 51)).toBe('over 42 of 51 trucks');
    expect(coverageNote(3, 8, 'rows')).toBe('over 3 of 8 rows');
  });

  it('is null when a count is absent, so the old backend prints no "undefined"', () => {
    expect(coverageNote(undefined, 51)).toBeNull();
    expect(coverageNote(42, null)).toBeNull();
  });
});
