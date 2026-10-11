import { describe, it, expect } from 'vitest';
import { BILL_VERDICT, billCheckView } from './billCheck';

describe('billCheckView', () => {
  it('names every backend verdict with a word and a tone', () => {
    for (const v of [
      'CONFIRMED',
      'WAITING_FOR_BILL',
      'INCONCLUSIVE',
      'CONTRADICTED',
      'TELEMETRY_CLEARED',
      'NO_BILLS',
    ]) {
      expect(BILL_VERDICT[v].label).toBeTruthy();
      expect(['critical', 'caution', 'ok', 'inert']).toContain(BILL_VERDICT[v].tone);
    }
  });

  it('a confirmed loss is critical and keeps its reason; a contradicted one is ok', () => {
    expect(billCheckView({ verdict: 'CONFIRMED', reason: '329 km on 360 L' })).toEqual({
      verdict: 'CONFIRMED',
      label: 'Bill confirms loss',
      tone: 'critical',
      reason: '329 km on 360 L',
    });
    expect(billCheckView({ verdict: 'CONTRADICTED' })).toMatchObject({ tone: 'ok', reason: null });
  });

  it('nothing to show without a known verdict', () => {
    expect(billCheckView(null)).toBeNull();
    expect(billCheckView({})).toBeNull();
    expect(billCheckView({ verdict: 'SOMETHING_NEW' })).toBeNull();
  });
});
