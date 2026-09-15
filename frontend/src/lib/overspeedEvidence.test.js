import { describe, it, expect } from 'vitest';
import { eventLine, totalOverMinutes, comparisonLine, sourcesDisagree } from './overspeedEvidence';

describe('eventLine', () => {
  it('reads "78 km/h for 6 minutes" — speed, duration', () => {
    expect(eventLine({ maxSpeedKmh: 78.4, durationSec: 360 })).toBe('78 km/h for 6 minutes');
    expect(eventLine({ maxSpeedKmh: 82, durationSec: 60 })).toBe('82 km/h for 1 minute');
  });

  it('returns null for absent or degenerate events — never a bare number', () => {
    expect(eventLine(null)).toBeNull();
    expect(eventLine({})).toBeNull();
    expect(eventLine({ maxSpeedKmh: 'fast', durationSec: 100 })).toBeNull();
    expect(eventLine({ maxSpeedKmh: 80, durationSec: 30 })).toBeNull(); // <1 min renders as nothing
  });
});

describe('totalOverMinutes', () => {
  it('sums durations across events', () => {
    expect(totalOverMinutes([{ durationSec: 360 }, { durationSec: 60 }])).toBe(7);
    expect(totalOverMinutes([])).toBe(0);
    expect(totalOverMinutes(null)).toBe(0);
  });
});

describe('comparisonLine', () => {
  it('shows both sources with provenance, never averaged', () => {
    expect(comparisonLine([{ durationSec: 1320 }, {}, {}, {}], [1, 2, 3]))
      .toBe('Our calculation: 4 events, 22 min over. device-reported: 3 events.');
  });

  it('works with only our calculation', () => {
    expect(comparisonLine([{ durationSec: 600 }], [])).toBe('Our calculation: 1 event, 10 min over.');
  });

  it('returns null when neither source has anything', () => {
    expect(comparisonLine([], [])).toBeNull();
    expect(comparisonLine(null, null)).toBeNull();
  });
});

describe('sourcesDisagree', () => {
  it('flags material disagreement (default 2x)', () => {
    expect(sourcesDisagree([1, 2, 3, 4], [1])).toBe(true);
    expect(sourcesDisagree([1, 2, 3], [1, 2])).toBe(false);
  });

  it('needs both sources present', () => {
    expect(sourcesDisagree([], [1, 2, 3])).toBe(false);
    expect(sourcesDisagree([1, 2, 3], [])).toBe(false);
  });
});
