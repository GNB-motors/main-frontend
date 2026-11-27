import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { yesterdayIST } from './bdReportDays';

describe('BD report day (spec 2 / D3)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reads the calendar day in IST, not in UTC', () => {
    // 2 Mar 2026, 00:30 IST — UTC still says 1 Mar.
    vi.setSystemTime(new Date('2026-03-01T19:00:00Z'));
    expect(yesterdayIST()).toBe('2026-03-01');
  });

  it('crosses a month boundary', () => {
    // 1 Mar 2026, 00:30 IST — yesterday is the last day of February.
    vi.setSystemTime(new Date('2026-02-28T19:00:00Z'));
    expect(yesterdayIST()).toBe('2026-02-28');
  });

  it('crosses a year boundary', () => {
    // 1 Jan 2027, 00:30 IST — yesterday is 31 Dec 2026.
    vi.setSystemTime(new Date('2026-12-31T19:00:00Z'));
    expect(yesterdayIST()).toBe('2026-12-31');
  });
});
