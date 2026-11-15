import { describe, it, expect } from 'vitest';
import {
  BILL_TYPES,
  POLL_INTERVAL_MS,
  POLL_TIMEOUT_MS,
  buildBillFormData,
  candidateRows,
  isAutoMatch,
  matchSentence,
  needsChoice,
  shouldKeepPolling,
} from './billPhotoModel';

describe('BILL_TYPES', () => {
  it('offers a diesel slip and a service bill', () => {
    expect(BILL_TYPES.map((t) => t.label)).toEqual(['Diesel slip', 'Service bill']);
  });
});

describe('buildBillFormData', () => {
  it('sends pages and the client id', () => {
    const file = new File(['x'], 'slip.jpg', { type: 'image/jpeg' });
    const form = buildBillFormData(file, 'client-1');
    expect(form.get('pages')).toBe(file);
    expect(form.get('clientId')).toBe('client-1');
    expect(buildBillFormData(file, 'client-1', 'WB01').get('vehicleHint')).toBe('WB01');
    expect(form.has('vehicleHint')).toBe(false);
  });
});

describe('matchSentence', () => {
  it('says which truck and why', () => {
    expect(
      matchSentence({
        registrationNumber: 'WB11F6762',
        score: 0.94,
        reasons: ['at the pump at 14:05', 'fill 212 L'],
      }),
    ).toBe('Matched to WB11F6762 (at the pump at 14:05, fill 212 L)');
  });

  it('says just the truck when there are no reasons', () => {
    expect(matchSentence({ registrationNumber: 'WB11F6762' })).toBe('Matched to WB11F6762');
  });

  it('is null without a truck', () => {
    expect(matchSentence(null)).toBeNull();
  });
});

describe('candidateRows', () => {
  it('lists the candidates best first', () => {
    const rows = candidateRows({
      decision: 'ASK',
      candidates: [
        { registrationNumber: 'WB01', score: 0.4, reasons: ['a'] },
        { registrationNumber: 'WB02', score: 0.9, reasons: ['b'] },
      ],
    });
    expect(rows.map((r) => r.registrationNumber)).toEqual(['WB02', 'WB01']);
  });

  it('is empty for no candidates', () => {
    expect(candidateRows({ decision: 'ASK' })).toEqual([]);
  });
});

describe('isAutoMatch / needsChoice', () => {
  it('knows when the backend is sure', () => {
    expect(isAutoMatch({ decision: 'AUTO' })).toBe(true);
    expect(needsChoice({ decision: 'AUTO' })).toBe(false);
  });

  it('knows when the owner has to choose', () => {
    expect(needsChoice({ decision: 'ASK' })).toBe(true);
    expect(isAutoMatch({ decision: 'ASK' })).toBe(false);
  });
});

describe('shouldKeepPolling', () => {
  it('stops when the answer arrives', () => {
    expect(
      shouldKeepPolling({ startedAt: 0, now: 1000, decision: 'AUTO' }),
    ).toBe(false);
  });

  it('stops when the request failed', () => {
    expect(shouldKeepPolling({ startedAt: 0, now: 1000, failed: true })).toBe(false);
  });

  it('keeps polling inside the window', () => {
    expect(shouldKeepPolling({ startedAt: 0, now: POLL_INTERVAL_MS, decision: null })).toBe(true);
  });

  it('stops after the timeout', () => {
    expect(
      shouldKeepPolling({ startedAt: 0, now: POLL_TIMEOUT_MS + 1, decision: null }),
    ).toBe(false);
  });

  it('polls every two seconds for thirty', () => {
    expect(POLL_INTERVAL_MS).toBe(2000);
    expect(POLL_TIMEOUT_MS).toBe(30000);
  });
});
