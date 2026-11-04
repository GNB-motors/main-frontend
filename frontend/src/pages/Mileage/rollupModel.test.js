import { describe, it, expect } from 'vitest';
import {
  DASH,
  dutyCut,
  ecuCrossCheck,
  expectedBasisText,
  fleetHeadline,
  groupCards,
  kmPerLText,
  learnedGate,
  rankingRows,
  varianceText,
  withheldRows,
  windowText,
} from './rollupModel';

const ROLLUP = {
  basis: 'BILL_CYCLES_SUM_KM_DIV_SUM_LITRES',
  window: { from: '2026-10-01T18:30:00.000Z', to: '2026-10-31T18:30:00.000Z' },
  fleet: {
    vehicles: 12,
    vehiclesPublished: 10,
    cycles: 87,
    km: 12340,
    litres: 2110.5,
    kmPerL: 5.85,
  },
  ecu: {
    source: 'ECU_TILES_WITHIN_COUNTED_CYCLE_SPANS',
    km: 12000,
    litres: 2100,
    kmPerL: 5.71,
    from: null,
    to: null,
  },
  gap: {
    kmPerL: 0.14,
    pctOfEcu: 2.5,
    over: 'Bill minus ECU, both measured over the same counted cycle spans.',
  },
  ecuUncovered: {
    km: 340,
    litres: 10.5,
    note: '340 km and 10.5 L of billed driving fell outside the spans the ECU side covers.',
  },
  duty: { basis: 'OTSU_ON_ORG_MEDIAN_CYCLE_KM', cutKmPerCycle: 180, trucksDescribed: 9 },
  groups: [
    {
      group: 0,
      label: 'Short-haul duty',
      vehicles: 5,
      vehiclesCounted: 4,
      cycles: 30,
      km: 3000,
      litres: 600,
      kmPerL: 5,
      ranked: false,
      excludeNote: 'Not ranked: this group carries 30 cycles, 3,000 km and 600 L.',
      excludedTrucks: [
        {
          registrationNumber: 'WB11L8863',
          reason: 'no completed fill-to-full cycle in this window',
        },
      ],
    },
    {
      group: 1,
      label: 'Long-haul duty',
      vehicles: 7,
      vehiclesCounted: 6,
      cycles: 57,
      km: 9340,
      litres: 1510.5,
      kmPerL: 6.18,
      ranked: true,
      excludeNote: null,
      excludedTrucks: [],
    },
  ],
  ranking: [
    {
      rank: 1,
      dutyGroup: 1,
      registrationNumber: 'WB11L8862',
      model: 'Tata 407',
      cycles: 12,
      km: 4000,
      litres: 640,
      kmPerL: 6.25,
      expectedKmPerL: 6,
      expectedBasis: 'SHRUNK_TO_MODEL_POOLED',
      variancePct: 4.2,
    },
  ],
  withheld: [
    {
      registrationNumber: 'WB11L8863',
      dutyGroup: 0,
      cycles: 1,
      km: 120,
      litres: 30,
      reason: '1 usable cycle against this group’s typical 4',
    },
  ],
  learned: {
    basis: 'LEARNED_PER_DUTY_GROUP_FROM_ORG_DISTRIBUTION',
    groups: {
      0: { minCycles: 4, minKm: 400, minLitres: 90, trucks: 5, source: 'STORED' },
      1: { minCycles: null, minKm: null, minLitres: null, trucks: 0, source: 'NONE' },
    },
    learnedAt: '2026-11-01T00:00:00.000Z',
    source: 'STORED',
  },
};

describe('rollupModel', () => {
  it('gives the fleet figure with the km and litres behind it', () => {
    const headline = fleetHeadline(ROLLUP);
    expect(headline.text).toBe('5.85 km/L');
    expect(headline.reason).toBeNull();
    expect(headline.foot).toContain('12,340 km');
    expect(headline.foot).toContain('2,110.5 L');
    expect(headline.foot).toContain('87 completed cycles');
    expect(headline.trucks).toBe('10 of 12 trucks published');
  });

  it('never shows a bare dash for a fleet figure it does not have', () => {
    const headline = fleetHeadline({
      ...ROLLUP,
      fleet: { ...ROLLUP.fleet, kmPerL: null, cycles: 0 },
    });
    expect(headline.text).toBe(DASH);
    expect(headline.reason).toMatch(/no completed fill-to-full cycle/i);
    expect(headline.foot).toBeNull();
  });

  it('keeps the engine figure separate from the bill figure', () => {
    const ecu = ecuCrossCheck(ROLLUP);
    expect(ecu.text).toBe('5.71 km/L');
    expect(ecu.gapText).toBe('+0.14 km/L');
    expect(ecu.pctText).toBe('+2.5% of the ECU figure');
    expect(ecu.over).toBe(ROLLUP.gap.over);
    expect(ecu.uncoveredNote).toBe(ROLLUP.ecuUncovered.note);
  });

  it('says why there is no engine cross-check', () => {
    const ecu = ecuCrossCheck({ ...ROLLUP, ecu: { kmPerL: null }, gap: { kmPerL: null } });
    expect(ecu.text).toBe(DASH);
    expect(ecu.reason).toMatch(/no ecu tile/i);
    expect(ecu.gapText).toBe(DASH);
    expect(ecu.gapReason).toMatch(/nothing to compare/i);
  });

  it('reports a group that does not clear its own gate, and who is in it', () => {
    const groups = groupCards(ROLLUP);
    expect(groups).toHaveLength(2);
    expect(groups[0].ranked).toBe(false);
    expect(groups[0].excludeNote).toMatch(/not ranked/i);
    expect(groups[0].excluded[0]).toEqual({
      registrationNumber: 'WB11L8863',
      reason: 'no completed fill-to-full cycle in this window',
    });
    expect(groups[1].ranked).toBe(true);
    expect(groups[1].excludeNote).toBeNull();
  });

  it('shows each ranked truck against what it should be doing', () => {
    const rows = rankingRows(ROLLUP);
    expect(rows).toHaveLength(1);
    expect(rows[0].kmPerLText).toBe('6.25 km/L');
    expect(rows[0].expectedText).toBe('6.00 km/L');
    expect(rows[0].varianceText).toBe('+4.2%');
    expect(rows[0].duty).toBe('Long-haul duty');
  });

  it('keeps the reason a truck is held back', () => {
    const withheld = withheldRows(ROLLUP);
    expect(withheld).toHaveLength(1);
    expect(withheld[0].registrationNumber).toBe('WB11L8863');
    expect(withheld[0].reason).toBe('1 usable cycle against this group’s typical 4');
  });

  it('shows what the learned gate asks for, per duty group', () => {
    const gate = learnedGate(ROLLUP);
    expect(gate.rows).toHaveLength(2);
    expect(gate.rows[0].text).toContain('at least 4 cycles');
    expect(gate.rows[0].trucks).toBe(5);
    expect(gate.rows[1].text).toMatch(/no evidence bar/i);
  });

  it('shows the learned duty cut, and says when it is not known', () => {
    expect(dutyCut(ROLLUP).cutText).toBe('180 km per cycle');
    const unknown = dutyCut({ ...ROLLUP, duty: { cutKmPerCycle: null } });
    expect(unknown.cutText).toBe(DASH);
    expect(unknown.cutReason).toMatch(/not known/i);
  });

  it('shows the window the roll-up actually covered', () => {
    expect(windowText(ROLLUP)).toBe('2 Oct 2026 – 1 Nov 2026');
  });

  it('formats a missing number as a dash and a signed difference with its sign', () => {
    expect(kmPerLText(null)).toBe(DASH);
    expect(varianceText(null)).toBe(DASH);
    expect(varianceText(-2.4)).toBe('-2.4%');
    expect(varianceText(4.25)).toBe('+4.3%');
  });

  it('says in words how an expected figure was reached', () => {
    expect(expectedBasisText('SHRUNK_TO_MODEL_POOLED')).toMatch(/pooled figure/);
    expect(expectedBasisText('NO_EVIDENCE')).toBe('no evidence yet');
    expect(expectedBasisText('SOMETHING_NEW')).toBeNull();
  });
});
