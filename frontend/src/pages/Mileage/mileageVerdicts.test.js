import { describe, it, expect } from 'vitest';
import {
  MILEAGE_VERDICTS,
  DEF_BAND,
  KMPL_DROP_LIMIT,
  verdictOf,
  kmPerLTone,
  defPctTone,
  defBandCaption,
  isReconciled,
  rowsOf,
} from './mileageVerdicts';

describe('verdictOf', () => {
  it('names each verdict in plain words, never as an accusation', () => {
    expect(verdictOf({ verdict: 'ADDS_UP' }).label).toBe('Adds up');
    expect(verdictOf({ verdict: 'UNEXPLAINED' }).label).toBe("Doesn't add up");
    expect(verdictOf({ verdict: 'LOW_KMPL' }).label).toBe('Low km/L');
    expect(verdictOf({ verdict: 'MISSING_BILL' }).label).toBe('Bill missing');
    expect(verdictOf({ verdict: 'NOT_ENOUGH_DATA' }).label).toBe('Not enough data');
  });

  it('tones a bad round as something to act on and a good round as good', () => {
    expect(verdictOf({ verdict: 'ADDS_UP' }).tone).toBe('good');
    expect(verdictOf({ verdict: 'UNEXPLAINED' }).tone).toBe('act');
    expect(verdictOf({ verdict: 'LOW_KMPL' }).tone).toBe('watch');
  });

  it('says we cannot tell when the verdict is missing or unknown', () => {
    expect(verdictOf(null).label).toBe('Not enough data');
    expect(verdictOf({}).label).toBe('Not enough data');
    expect(verdictOf({ verdict: 'SOMETHING_NEW' }).label).toBe('Not enough data');
    expect(verdictOf({ verdict: 'SOMETHING_NEW' }).tone).toBe('info');
  });

  it('never speaks an accusation', () => {
    Object.values(MILEAGE_VERDICTS).forEach((v) => {
      expect(v.label.toLowerCase()).not.toMatch(/siphon|theft|stolen|steal/);
    });
  });
});

describe('kmPerLTone', () => {
  it('is good at or above the usual km/L', () => {
    expect(kmPerLTone(3.4, 3.2)).toBe('good');
    expect(kmPerLTone(3.2, 3.2)).toBe('good');
  });

  it('is act only when the truck is more than a tenth below its usual', () => {
    expect(kmPerLTone(3.2 * (1 - KMPL_DROP_LIMIT), 3.2)).toBeNull();
    expect(kmPerLTone(3.2 * (1 - KMPL_DROP_LIMIT) - 0.01, 3.2)).toBe('act');
  });

  it('says nothing when there is no usual to compare with', () => {
    expect(kmPerLTone(3.4, null)).toBeNull();
    expect(kmPerLTone(null, 3.2)).toBeNull();
    expect(kmPerLTone(3.4, 0)).toBeNull();
  });
});

describe('defPctTone', () => {
  it('watches DEF use outside the 3–6% band only', () => {
    expect(defPctTone(4.3)).toBeNull();
    expect(defPctTone(3)).toBeNull();
    expect(defPctTone(6)).toBeNull();
    expect(defPctTone(1.7)).toBe('watch');
    expect(defPctTone(8)).toBe('watch');
  });

  it('says nothing when DEF was never measured', () => {
    expect(defPctTone(null)).toBeNull();
  });

  it('reads the band the row carries', () => {
    expect(defPctTone(2, { min: 1, max: 3 })).toBeNull();
    expect(defPctTone(2, { min: 3, max: 6 })).toBe('watch');
  });
});

describe('defBandCaption', () => {
  it('names the band the row carries', () => {
    expect(defBandCaption()).toBe('normal 3–6% of diesel');
    expect(defBandCaption({ min: 2, max: 5 })).toBe('normal 2–5% of diesel');
  });
});

describe('isReconciled', () => {
  it('is true only for a cycle checked against the oil report', () => {
    expect(isReconciled({ source: 'RECONCILED_REGISTER' })).toBe(true);
    expect(isReconciled({ source: 'TELEMETRY' })).toBe(false);
    expect(isReconciled(null)).toBe(false);
  });
});

describe('rowsOf', () => {
  it('reads the contract key and the older hub keys', () => {
    expect(rowsOf({ items: [{ a: 1 }] })).toEqual([{ a: 1 }]);
    expect(rowsOf({ trucks: [{ b: 2 }] })).toEqual([{ b: 2 }]);
    expect(rowsOf({ cycles: [{ c: 3 }] })).toEqual([{ c: 3 }]);
    expect(rowsOf(null)).toEqual([]);
    expect(rowsOf({})).toEqual([]);
  });
});

describe('DEF_BAND', () => {
  it('is the 3–6% of diesel a BS-VI truck uses', () => {
    expect(DEF_BAND).toEqual({ min: 3, max: 6 });
  });
});
