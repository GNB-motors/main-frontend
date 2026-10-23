import { describe, it, expect } from 'vitest';
import {
  buildAttributionView,
  describeCoverage,
  describeGap,
  describeLearned,
  formatExcess,
  formatSupport,
  hasAnythingToShow,
  labelForVerdict,
  toneFor,
  STATUS,
  VERDICTS,
} from './attributionData';

/** A card as the API returns it. */
function card(overrides = {}) {
  return {
    status: STATUS.ATTRIBUTED,
    metric: 'km_per_l',
    headline: 'Machine. The drop follows the truck across drivers.',
    gap: { ours: 3.2, expected: 4, residualPct: -20 },
    learned: {
      learnedFrom: '2026-08-01T00:00:00.000Z',
      learnedUpTo: '2026-09-01T00:00:00.000Z',
      bandAbsResidualPct: 10,
      minDistinctDrivers: 2,
      minDistinctVehicles: 2,
      minDaysPerGroup: 2,
      samples: 480,
    },
    sameSpan: true,
    uncovered: 0,
    parts: [
      {
        key: 'ROAD_LOAD',
        label: 'Road & load',
        verdict: VERDICTS.NOT_MEASURED,
        support: 0,
        excessPct: null,
        why: 'No lane baseline is available for this work.',
        dataPoints: [],
      },
      {
        key: 'MACHINE',
        label: 'Machine',
        verdict: VERDICTS.SUPPORTS,
        support: 3,
        observedGroups: 4,
        excessPct: -22,
        why: 'The drop repeated under 3 of 4 drivers on this truck.',
        dataPoints: [],
        cusum: { cusumS: 5.1, era: 2 },
      },
      {
        key: 'DRIVER',
        label: 'Driver',
        verdict: VERDICTS.INSUFFICIENT_DATA,
        support: 0,
        observedGroups: 1,
        excessPct: null,
        why: 'This truck ran under 1 driver(s); the org needs 2.',
        dataPoints: [],
      },
      {
        key: 'UNEXPLAINED',
        label: 'Unexplained',
        verdict: VERDICTS.SUPPORTS,
        support: 0,
        excessPct: 2,
        why: '2.0% of the gap is not accounted for by any measured part.',
        dataPoints: [],
      },
    ],
    ...overrides,
  };
}

describe('formatExcess — an unmeasured part must never read as zero', () => {
  it('renders null as a dash, NOT as 0%', () => {
    // The whole point: "we did not measure the road" and "the road was fine" are
    // different claims, and 0% would state the second one.
    expect(formatExcess(null)).toBe('—');
    expect(formatExcess(undefined)).toBe('—');
    expect(formatExcess(NaN)).toBe('—');
  });

  it('never produces the string 0% for an unmeasured value', () => {
    for (const v of [null, undefined, NaN, '']) {
      expect(formatExcess(v)).not.toContain('0%');
    }
  });

  it('says which direction a measured excess points', () => {
    expect(formatExcess(-22)).toBe('22.0% below expected');
    expect(formatExcess(8)).toBe('8.0% above expected');
  });

  it('measures a real zero as 0.0%, because that one WAS measured', () => {
    // Distinct from null: the backend measured it and got zero.
    expect(formatExcess(0)).toBe('0.0% above expected');
  });
});

describe('formatSupport', () => {
  it('uses a singular noun for one', () => {
    expect(formatSupport(1, 'driver', 'drivers')).toBe('1 driver');
    expect(formatSupport(3, 'driver', 'drivers')).toBe('3 drivers');
  });

  it('is a dash, not 0, when the count is missing', () => {
    expect(formatSupport(null, 'driver', 'drivers')).toBe('—');
  });
});

describe('toneFor / labelForVerdict — plain language, not enums', () => {
  it('never renders a raw verdict enum to a user', () => {
    for (const v of Object.values(VERDICTS)) {
      expect(labelForVerdict(v)).not.toBe(v);
      expect(labelForVerdict(v).length).toBeGreaterThan(3);
    }
  });

  it('separates unmeasured from insufficient — they are different', () => {
    expect(labelForVerdict(VERDICTS.NOT_MEASURED)).toBe('Not measured');
    expect(labelForVerdict(VERDICTS.INSUFFICIENT_DATA)).toBe('Not enough evidence');
  });

  it('maps an unknown verdict to muted rather than throwing', () => {
    expect(toneFor('WHAT_IS_THIS')).toBe('muted');
    expect(labelForVerdict(undefined)).toBe('Unknown');
  });
});

describe('describeGap', () => {
  it('renders both sides and the residual', () => {
    const g = describeGap({ ours: 3.2, expected: 4, residualPct: -20 });
    expect(g.ours).toBe('3.20 km/L');
    expect(g.expected).toBe('4.00 km/L');
    expect(g.headline).toBe('20.0% below expected');
  });

  it('is null when there is no gap, so the row is not rendered at all', () => {
    expect(describeGap(null)).toBeNull();
    expect(describeGap({ ours: 4, expected: 4, residualPct: null })).toBeNull();
  });

  it('uses the right unit for a litres metric', () => {
    expect(describeGap({ ours: 40, expected: 50, residualPct: -20 }, 'fuel_l').ours).toBe('40.00 L');
  });

  it('does not print a dash in place of a number it cannot read', () => {
    const g = describeGap({ ours: null, expected: 4, residualPct: -20 });
    expect(g.ours).toBe('—');
    expect(g.expected).toBe('4.00 km/L');
  });
});

describe('describeLearned — provenance is always visible', () => {
  it('lists every threshold the card used', () => {
    const l = describeLearned(card().learned);
    expect(l.rows.map((r) => r.label)).toEqual([
      'A gap counts as a gap past',
      'Drivers needed to rule a driver out',
      'Trucks needed to rule a truck out',
      'Cycles needed before a pattern counts',
    ]);
    expect(l.rows[0].value).toBe('10.0%');
    expect(l.samples).toBe(480);
  });

  it('is null when nothing has been learned — the card says so instead', () => {
    expect(describeLearned(null)).toBeNull();
    expect(describeLearned({ bandAbsResidualPct: null })).toBeNull();
  });

  it('shows a dash for a threshold the org has not learned, never a default', () => {
    const l = describeLearned({ bandAbsResidualPct: 10, minDistinctDrivers: null });
    expect(l.rows[1].value).toBe('—');
  });
});

describe('describeCoverage — same-span honesty', () => {
  it('is silent when the span matches', () => {
    expect(describeCoverage({ sameSpan: true, uncovered: 0 })).toBeNull();
  });

  it('is silent when the span is unknown — not an optimistic "all good"', () => {
    expect(describeCoverage({ sameSpan: null, uncovered: null })).toBeNull();
  });

  it('warns when the evidence covers less than the window', () => {
    const c = describeCoverage({ sameSpan: false, uncovered: 3 });
    expect(c.text).toMatch(/3 day/);
    expect(c.text).toMatch(/not counted, not assumed/);
  });
});

describe('buildAttributionView', () => {
  it('keeps a null excess marked as unmeasured on the part itself', () => {
    const v = buildAttributionView(card());
    const road = v.parts.find((p) => p.key === 'ROAD_LOAD');
    expect(road.measured).toBe(false);
    expect(road.excessText).toBe('—');
    const drv = v.parts.find((p) => p.key === 'DRIVER');
    expect(drv.measured).toBe(false);
  });

  it('marks a measured excess as measured, at its own magnitude', () => {
    const v = buildAttributionView(card());
    const machine = v.parts.find((p) => p.key === 'MACHINE');
    expect(machine.measured).toBe(true);
    expect(machine.excessText).toBe('22.0% below expected');
    expect(machine.support).toBe(3);
    expect(machine.observedGroups).toBe(4);
  });

  it('never rescales parts to sum to 100', () => {
    const v = buildAttributionView(card());
    const sum = v.parts.reduce((s, p) => s + (p.measured ? parseFloat(p.excessText) : 0), 0);
    expect(sum).toBe(22 + 2); // 24, exactly what was measured — not 20
  });

  it('surfaces over-attribution', () => {
    const over = card();
    over.parts = over.parts.map((p) =>
      p.key === 'UNEXPLAINED' ? { ...p, overAttributed: true, excessPct: 0 } : p,
    );
    expect(buildAttributionView(over).overAttributed).toBe(true);
  });

  it('carries the CUSUM corroboration through', () => {
    const v = buildAttributionView(card());
    expect(v.parts.find((p) => p.key === 'MACHINE').cusum).toEqual({ cusumS: 5.1, era: 2 });
  });

  it('survives a null card without throwing', () => {
    const v = buildAttributionView(null);
    expect(v.parts).toEqual([]);
    expect(v.tone).toBe('muted');
  });

  it('survives a card with no parts array', () => {
    expect(buildAttributionView({ status: STATUS.NO_GAP }).parts).toEqual([]);
  });

  it('does not upgrade a non-attributed status into a caution tone', () => {
    const v = buildAttributionView(card({ status: STATUS.INSUFFICIENT_DATA }));
    expect(v.tone).toBe('muted');
  });
});

describe('hasAnythingToShow', () => {
  it('is false with no card', () => {
    expect(hasAnythingToShow(null)).toBe(false);
  });

  it('is false when the org has learned nothing yet — the card must not pretend', () => {
    expect(hasAnythingToShow({ status: STATUS.PROFILE_NOT_LEARNED, parts: [] })).toBe(false);
  });

  it('is true for a real card', () => {
    expect(hasAnythingToShow(card())).toBe(true);
  });
});