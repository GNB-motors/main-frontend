import { describe, it, expect } from 'vitest';
import { toContractWindow, normaliseWindowsPayload } from './fuelWindows';

describe('toContractWindow', () => {
  it('keeps the readings the window already carries', () => {
    const w = toContractWindow({
      _id: 'w1',
      registrationNumber: 'WB11L8862',
      windowFrom: '2026-09-14T00:00:00Z',
      windowTo: '2026-10-06T00:00:00Z',
      fillsLitres: 690,
      engineBurnL: 640,
      tankDeltaL: 10,
    });
    expect(w.id).toBe('w1');
    expect(w.registrationNumber).toBe('WB11L8862');
    expect(w.startAt).toBe('2026-09-14T00:00:00Z');
    expect(w.endAt).toBe('2026-10-06T00:00:00Z');
    expect(w.fuelUsedL).toBe(690);
    expect(w.engineBurnL).toBe(640);
    expect(w.tankDeltaL).toBe(10);
  });

  it('says we cannot tell yet when the backend has not judged the window', () => {
    const w = toContractWindow({ _id: 'w1' });
    expect(w.verdict).toBe('NOT_ENOUGH_DATA');
    expect(w.verdictWhy.text).toMatch(/not been checked/i);
    expect(w.parkedDropL).toBeNull();
  });

  it('keeps the verdict the backend sent', () => {
    const w = toContractWindow({
      _id: 'w1',
      verdict: 'UNEXPLAINED_WHILE_PARKED',
      parkedDropL: 281.4,
    });
    expect(w.verdict).toBe('UNEXPLAINED_WHILE_PARKED');
    expect(w.parkedDropL).toBe(281.4);
  });
});

describe('normaliseWindowsPayload', () => {
  it('maps the live records envelope onto the contract envelope', () => {
    const payload = normaliseWindowsPayload({
      records: [{ _id: 'w1', registrationNumber: 'WB11L8862' }],
      total: 12,
    });
    expect(payload.items).toHaveLength(1);
    expect(payload.records).toHaveLength(1);
    expect(payload.total).toBe(12);
    expect(payload.totals.windows).toBe(12);
  });

  it('reads the contract envelope as it is', () => {
    const payload = normaliseWindowsPayload({
      items: [{ id: 'w1', registrationNumber: 'WB11L8862' }],
      totals: { parkedDropL: 12, windows: 1 },
    });
    expect(payload.records).toHaveLength(1);
    expect(payload.totals.parkedDropL).toBe(12);
  });

  it('copes with an empty answer', () => {
    const payload = normaliseWindowsPayload(null);
    expect(payload.items).toEqual([]);
    expect(payload.total).toBe(0);
  });
});
