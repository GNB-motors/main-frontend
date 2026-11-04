import { describe, expect, it } from 'vitest';
import { formatKnownEtaLine, matchKnownEta, plateKey } from './knownEta';

const row = {
  registrationNumber: 'MH 12 AB 1234',
  destination: { placeId: 'p1', label: 'Pune depot', source: 'TRIP_PLAN' },
  p10: '2026-11-04T09:00:00.000Z',
  p50: '2026-11-04T09:30:00.000Z',
  p90: '2026-11-04T10:00:00.000Z',
  issuedAt: '2026-11-04T09:00:00.000Z',
};

describe('known destination ETA', () => {
  it('matches a plate however the fleet typed it', () => {
    expect(plateKey('mh 12 ab 1234')).toBe('MH12AB1234');
    expect(matchKnownEta([row], 'MH12AB1234')?.destination.label).toBe('Pune depot');
    expect(matchKnownEta([row], 'mh12ab1234')?.destination.label).toBe('Pune depot');
    expect(matchKnownEta([row], 'MH12AB9999')).toBeNull();
    expect(matchKnownEta([], 'MH12AB1234')).toBeNull();
  });

  it('shows the destination, the arrival and the band', () => {
    expect(formatKnownEtaLine(row)).toBe('→ Pune depot · ETA 3:00 PM (2:30 PM–3:30 PM)');
  });

  it('never claims an arrival it does not have', () => {
    expect(
      formatKnownEtaLine({ ...row, p10: null, p50: null, p90: null }),
    ).toBe('→ Pune depot · ETA not yet known');
  });

  it('says nothing when the truck has no known destination', () => {
    expect(formatKnownEtaLine(null)).toBeNull();
    expect(formatKnownEtaLine({ ...row, destination: { label: null } })).toBeNull();
  });
});
