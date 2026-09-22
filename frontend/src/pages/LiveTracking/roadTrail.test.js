import { describe, it, expect } from 'vitest';
import { segmentStyle, segmentsToPolylines, gradeSummary, GRADE_COLOR } from './roadTrail';

describe('segmentStyle', () => {
  it('colours by grade and flags estimated straight hops', () => {
    expect(segmentStyle({ grade: 'OVERSPEED', provenance: 'google' })).toEqual({
      color: GRADE_COLOR.OVERSPEED,
      estimated: false,
    });
    expect(segmentStyle({ grade: 'NORMAL', provenance: 'straight' })).toEqual({
      color: GRADE_COLOR.NORMAL,
      estimated: true,
    });
  });
});

describe('segmentsToPolylines', () => {
  const seg = (grade, provenance, path) => ({ grade, provenance, path });

  it('merges consecutive same-grade segments into one run without duplicating the shared vertex', () => {
    const runs = segmentsToPolylines([
      seg('NORMAL', 'corridor', [
        { lat: 1, lng: 1 },
        { lat: 2, lng: 2 },
      ]),
      seg('NORMAL', 'corridor', [
        { lat: 2, lng: 2 },
        { lat: 3, lng: 3 },
      ]),
    ]);
    expect(runs).toHaveLength(1);
    expect(runs[0].path).toEqual([
      { lat: 1, lng: 1 },
      { lat: 2, lng: 2 },
      { lat: 3, lng: 3 },
    ]);
  });

  it('splits runs when the grade changes', () => {
    const runs = segmentsToPolylines([
      seg('NORMAL', 'corridor', [
        { lat: 1, lng: 1 },
        { lat: 2, lng: 2 },
      ]),
      seg('OVERSPEED', 'corridor', [
        { lat: 2, lng: 2 },
        { lat: 3, lng: 3 },
      ]),
    ]);
    expect(runs).toHaveLength(2);
    expect(runs[0].grade).toBe('NORMAL');
    expect(runs[1].grade).toBe('OVERSPEED');
  });

  it('separates estimated (straight) from measured even at the same grade', () => {
    const runs = segmentsToPolylines([
      seg('NORMAL', 'corridor', [
        { lat: 1, lng: 1 },
        { lat: 2, lng: 2 },
      ]),
      seg('NORMAL', 'straight', [
        { lat: 2, lng: 2 },
        { lat: 3, lng: 3 },
      ]),
    ]);
    expect(runs).toHaveLength(2);
    expect(runs[0].estimated).toBe(false);
    expect(runs[1].estimated).toBe(true);
  });

  it('skips degenerate segments', () => {
    expect(segmentsToPolylines([{ grade: 'NORMAL', path: [{ lat: 1, lng: 1 }] }])).toEqual([]);
  });
});

describe('gradeSummary', () => {
  it('reports total, estimated split and grade breakdown', () => {
    const s = gradeSummary({
      kmByGrade: { OVERSPEED: 10, SLOW: 4 },
      measuredKm: 90,
      estimatedKm: 10,
    });
    expect(s).toContain('100 km');
    expect(s).toContain('10 km estimated');
    expect(s).toContain('10 km overspeed');
    expect(s).toContain('4 km slow');
  });
});
