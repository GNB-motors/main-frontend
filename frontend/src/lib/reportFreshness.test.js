import { describe, it, expect } from 'vitest';
import { reportDataAge, daysAgoLabel, REPORT_STALE_AFTER_DAYS } from './reportFreshness';

const NOW = new Date('2026-10-01T06:00:00Z').getTime();

describe('reportDataAge', () => {
  it('is "none" when the API has no record in scope', () => {
    expect(reportDataAge(null, NOW)).toEqual({ level: 'none', days: null });
    expect(reportDataAge('not a date', NOW)).toEqual({ level: 'none', days: null });
  });

  it('is fresh below the threshold and stale from it', () => {
    expect(reportDataAge('2026-09-30T06:00:00Z', NOW)).toEqual({ level: 'fresh', days: 1 });
    expect(REPORT_STALE_AFTER_DAYS).toBe(3);
    expect(reportDataAge('2026-09-28T06:00:00Z', NOW)).toEqual({ level: 'stale', days: 3 });
  });

  it('flags the audit case — last bill 2026-09-10 — as stale (20 full days)', () => {
    expect(reportDataAge('2026-09-10T15:18:00Z', NOW)).toEqual({ level: 'stale', days: 20 });
  });

  it('never reports negative age for a future timestamp', () => {
    expect(reportDataAge('2026-10-02T06:00:00Z', NOW).days).toBe(0);
  });
});

describe('daysAgoLabel', () => {
  it('reads naturally', () => {
    expect(daysAgoLabel(0)).toBe('today');
    expect(daysAgoLabel(1)).toBe('1 day ago');
    expect(daysAgoLabel(21)).toBe('21 days ago');
    expect(daysAgoLabel(null)).toBe('');
  });
});
