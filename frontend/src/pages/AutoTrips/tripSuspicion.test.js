import { describe, expect, it } from 'vitest';
import {
  SUSPICIOUS_UNLOAD_FLAG,
  SUSPICIOUS_UNLOAD_LABEL,
  SUSPICIOUS_UNLOAD_REASON,
  isSuspiciousUnload,
  suspiciousDropPoint,
} from './tripSuspicion';

// OLD backend: the flag does not exist yet.
const oldTrip = { status: 'COMPLETE', flags: [], drop: { lat: 25.5, lng: 83.9 } };

// NEW backend: the engine inferred a drop that is not a known delivery point.
const newTrip = {
  status: 'NEEDS_REVIEW',
  flags: [SUSPICIOUS_UNLOAD_FLAG],
  drop: { lat: 25.5, lng: 83.9, source: 'INFERRED_TURNAROUND' },
};

describe('isSuspiciousUnload', () => {
  it('is false for a trip the server did not flag', () => {
    expect(isSuspiciousUnload(oldTrip)).toBe(false);
    expect(isSuspiciousUnload({})).toBe(false);
    expect(isSuspiciousUnload(null)).toBe(false);
  });

  it('is true when the server flagged the drop', () => {
    expect(isSuspiciousUnload(newTrip)).toBe(true);
  });
});

describe('suspiciousDropPoint', () => {
  it('pins the trip’s own drop when the trip is flagged', () => {
    expect(suspiciousDropPoint(newTrip)).toEqual({ lat: 25.5, lng: 83.9 });
  });

  it('pins nothing for a trip the old backend did not flag', () => {
    expect(suspiciousDropPoint(oldTrip)).toBeNull();
    expect(suspiciousDropPoint({ flags: [] })).toBeNull();
  });

  it('pins nothing when the flagged trip has no drop coordinates', () => {
    expect(suspiciousDropPoint({ flags: [SUSPICIOUS_UNLOAD_FLAG] })).toBeNull();
    expect(
      suspiciousDropPoint({ flags: [SUSPICIOUS_UNLOAD_FLAG], drop: { lat: null, lng: 83.9 } }),
    ).toBeNull();
    expect(
      suspiciousDropPoint({ flags: [SUSPICIOUS_UNLOAD_FLAG], drop: { lat: 25.5, lng: null } }),
    ).toBeNull();
  });
});

describe('the wording', () => {
  it('says a person should look, and never accuses anyone of theft', () => {
    expect(SUSPICIOUS_UNLOAD_LABEL).toBe('Suspicious unload');
    expect(SUSPICIOUS_UNLOAD_REASON).toMatch(/a person should look/i);
    expect(`${SUSPICIOUS_UNLOAD_LABEL} ${SUSPICIOUS_UNLOAD_REASON}`.toLowerCase()).not.toMatch(
      /theft|stolen|steal|siphon|thief/,
    );
  });
});
