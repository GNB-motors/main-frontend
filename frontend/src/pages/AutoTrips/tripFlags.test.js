import { describe, expect, it } from 'vitest';
import { flagLabel, flagReason, flagReasons, staleDetail } from './tripFlags';

// OLD: the server sends no explanation with the flags.
const oldTrip = { status: 'OPEN', flags: ['GPS_GAP'] };

// NEW: the trip stayed open and the server wrote down why.
const staleTrip = {
  status: 'OPEN',
  flags: ['STALE_OPEN'],
  staleReason: {
    code: 'NO_DROP_AFTER_LIMIT',
    detail: 'Open for 26 h while the longest trip on record is 20 h.',
    since: '2026-11-01T04:00:00.000Z',
  },
};

describe('flag reasons', () => {
  it('keeps the old labels when the server says nothing', () => {
    expect(flagLabel('GPS_GAP')).toBe('GPS went quiet on the way');
    expect(flagReason(oldTrip, 'GPS_GAP')).toBe('GPS went quiet on the way');
    expect(staleDetail(oldTrip)).toBeNull();
  });

  it('says the server’s own reason for a trip that stayed open', () => {
    expect(staleDetail(staleTrip)).toBe('Open for 26 h while the longest trip on record is 20 h.');
    expect(flagReason(staleTrip, 'STALE_OPEN')).toBe(staleTrip.staleReason.detail);
  });

  it('keeps a flag’s own label when the stale reason is about another flag', () => {
    expect(flagReason(staleTrip, 'GPS_GAP')).toBe('GPS went quiet on the way');
  });

  it('lists every flag’s reason for a row tooltip', () => {
    expect(flagReasons(staleTrip)).toEqual([staleTrip.staleReason.detail]);
    expect(flagReasons(oldTrip)).toEqual(['GPS went quiet on the way']);
  });

  it('does not call a stale trip “on the road”', () => {
    expect(flagLabel('STALE_OPEN')).toBe('Open longer than usual, no drop yet');
  });
});

describe('a flag the server has no label for', () => {
  it('says the flag in words instead of showing the code', () => {
    expect(flagLabel('SUSPICIOUS_UNLOAD')).toBe('Suspicious unload');
  });

  it('keeps the label for a flag it knows', () => {
    expect(flagLabel('OPEN_AT_DATA_END')).toBe('Still open when the data ended');
  });
});
