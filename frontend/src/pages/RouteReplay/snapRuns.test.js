import { describe, it, expect } from 'vitest';
import { snappedRuns } from './snapRuns.js';

const s = (lat, lng) => ({ lat, lng, provenance: 'snapped' });
const m = (lat, lng) => ({ lat, lng, provenance: 'measured' });

describe('snappedRuns', () => {
  it('splits the snapped overlay at every dropped (measured) entry', () => {
    // The off-corridor detour fix (measured, in the middle) must break the
    // dashed overlay into two runs — never a straight dashed bridge across a
    // stretch the truck drove off-corridor.
    const runs = snappedRuns([s(1, 1), s(1, 2), m(2, 1), s(3, 1), s(3, 2)]);
    expect(runs).toHaveLength(2);
    expect(runs[0]).toEqual([
      { lat: 1, lng: 1 },
      { lat: 1, lng: 2 },
    ]);
    expect(runs[1]).toEqual([
      { lat: 3, lng: 1 },
      { lat: 3, lng: 2 },
    ]);
  });

  it('keeps consecutive snapped fixes in one run', () => {
    const runs = snappedRuns([s(1, 1), s(1, 2), s(1, 3)]);
    expect(runs).toHaveLength(1);
    expect(runs[0]).toHaveLength(3);
  });

  it('drops runs of a single fix — nothing to draw between one point and itself', () => {
    expect(snappedRuns([m(0, 0), s(1, 1), m(2, 2)])).toEqual([]);
  });

  it('tolerates junk input', () => {
    expect(snappedRuns(null)).toEqual([]);
    expect(snappedRuns(undefined)).toEqual([]);
    expect(snappedRuns([])).toEqual([]);
  });
});
