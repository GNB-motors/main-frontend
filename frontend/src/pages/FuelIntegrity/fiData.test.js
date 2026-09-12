import { describe, it, expect } from 'vitest';
import {
  computeRisk,
  buildEvents,
  eventMatchesFilters,
  buildChartData,
  buildDrillChartData,
  buildAffected,
  buildRiskVehicles,
  buildChipDefs,
  buildBanner,
  RISK_RANK,
} from './fiData';

describe('computeRisk', () => {
  it('flags any siphon-suspected loss as Critical', () => {
    expect(computeRisk({ siphonSuspectedLossL: 0.5 })).toBe('Critical');
  });

  it('ranks heavy flag counts as High', () => {
    expect(computeRisk({ defFlagCount: 15 })).toBe('High');
    expect(computeRisk({ billFlagCount: 3 })).toBe('High');
  });

  it('ranks moderate flag counts as Medium', () => {
    expect(computeRisk({ defFlagCount: 5 })).toBe('Medium');
    expect(computeRisk({ billFlagCount: 1 })).toBe('Medium');
  });

  it('ranks a single DEF flag as Low', () => {
    expect(computeRisk({ defFlagCount: 1 })).toBe('Low');
  });

  it('treats a clean vehicle as Healthy', () => {
    expect(computeRisk({})).toBe('Healthy');
    expect(computeRisk({ defFlagCount: 0, billFlagCount: 0, siphonSuspectedLossL: 0 })).toBe(
      'Healthy',
    );
  });
});

describe('buildEvents', () => {
  const fills = [
    {
      _id: 'f1',
      registrationNumber: 'WB25A0001',
      litres: 50,
      at: '2026-08-10T06:00:00Z',
      confirmationStatus: 'CONFIRMED',
    },
  ];
  const windows = [
    {
      _id: 'w1',
      registrationNumber: 'WB25A0001',
      siphonSuspected: true,
      unaccountedLossL: 12,
      windowFrom: '2026-08-11T00:00:00Z',
      windowTo: '2026-08-12T00:00:00Z',
      defRatioFlag: true,
      defToFuelRatioPct: 7,
    },
    { _id: 'w2', registrationNumber: 'WB25A0002', siphonSuspected: false, defRatioFlag: false },
  ];

  it('merges fills, losses and DEF flags, newest first', () => {
    const events = buildEvents(fills, windows, 95);
    expect(events.map((e) => e.kind)).toEqual(['loss', 'def', 'fill']);
    expect(events.map((e) => e.id)).toEqual(['loss-w1', 'def-w1', 'fill-f1']);
  });

  it('estimates INR values from the fuel price', () => {
    const events = buildEvents(fills, windows, 100);
    const fill = events.find((e) => e.kind === 'fill');
    const loss = events.find((e) => e.kind === 'loss');
    expect(fill.inr).toBe(5000);
    expect(loss.inr).toBe(1200);
    expect(loss.confidence).toBeUndefined();
  });

  it('skips windows without flags', () => {
    const events = buildEvents([], windows, 95);
    expect(events.every((e) => e.vehicle === 'WB25A0001')).toBe(true);
  });
});

describe('eventMatchesFilters', () => {
  const fill = { kind: 'fill', confirmationStatus: 'ESTIMATED', billFlag: false };
  const loss = { kind: 'loss' };
  const def = { kind: 'def' };
  const flaggedFill = { kind: 'fill', confirmationStatus: 'CONFIRMED', billFlag: true };

  it('passes everything on the default filters', () => {
    expect(eventMatchesFilters(loss, {})).toBe(true);
  });

  it('filters by event type', () => {
    expect(eventMatchesFilters(def, { eventType: 'def' })).toBe(true);
    expect(eventMatchesFilters(loss, { eventType: 'def' })).toBe(false);
  });

  it('status filter only matches fills with that status', () => {
    expect(eventMatchesFilters(fill, { statusFilter: 'ESTIMATED' })).toBe(true);
    expect(eventMatchesFilters(flaggedFill, { statusFilter: 'ESTIMATED' })).toBe(false);
    expect(eventMatchesFilters(loss, { statusFilter: 'ESTIMATED' })).toBe(false);
  });

  it('chip filters', () => {
    expect(eventMatchesFilters(loss, { chip: 'needs-review' })).toBe(true);
    expect(eventMatchesFilters(def, { chip: 'needs-review' })).toBe(true);
    expect(eventMatchesFilters(fill, { chip: 'needs-review' })).toBe(true);
    expect(eventMatchesFilters(flaggedFill, { chip: 'needs-review' })).toBe(true);
    expect(eventMatchesFilters(flaggedFill, { chip: 'bill' })).toBe(true);
    expect(eventMatchesFilters(fill, { chip: 'bill' })).toBe(false);
    expect(eventMatchesFilters(loss, { chip: 'def' })).toBe(false);
    expect(eventMatchesFilters(loss, { chip: 'loss' })).toBe(true);
  });
});

describe('buildChartData', () => {
  it('buckets volume, loss, events and DEF counts by IST day', () => {
    const fills = [
      { at: '2026-08-10T20:00:00Z', litres: 40 }, // 01:30 IST on 11 Aug
      { at: '2026-08-11T02:00:00Z', litres: 30 }, // 07:30 IST on 11 Aug
    ];
    const windows = [
      {
        windowTo: '2026-08-12T00:00:00Z',
        siphonSuspected: true,
        unaccountedLossL: 5.04,
        defRatioFlag: true,
      },
    ];
    const data = buildChartData(fills, windows);
    expect(data).toHaveLength(2);
    const [d11, d12] = data;
    expect(d11.day).toBe('11 Aug');
    expect(d11.volume).toBe(70);
    expect(d11.events).toBe(2);
    expect(d11.loss).toBe(0);
    expect(d12.day).toBe('12 Aug');
    expect(d12.loss).toBe(5);
    expect(d12.events).toBe(1);
    expect(d12.def).toBe(1);
  });

  it('sorts buckets chronologically and ignores timestamps it cannot parse', () => {
    const data = buildChartData([{ at: null, litres: 10 }], []);
    expect(data).toHaveLength(0);
  });
});

describe('buildDrillChartData', () => {
  const fills = [
    { registrationNumber: 'A', at: '2026-08-10T06:00:00Z', litres: 20 },
    { registrationNumber: 'B', at: '2026-08-10T06:00:00Z', litres: 99 },
  ];
  const windows = [
    {
      registrationNumber: 'A',
      windowTo: '2026-08-11T00:00:00Z',
      siphonSuspected: true,
      unaccountedLossL: 3.33,
    },
    {
      registrationNumber: 'A',
      windowTo: '2026-08-11T00:00:00Z',
      siphonSuspected: false,
      unaccountedLossL: 50,
    },
  ];

  it('buckets only the selected vehicle and only suspected losses', () => {
    const data = buildDrillChartData(fills, windows, 'A');
    expect(data).toHaveLength(2);
    const lossDay = data.find((d) => d.day === '11 Aug');
    expect(lossDay.loss).toBe(3.3);
    const fillDay = data.find((d) => d.day === '10 Aug');
    expect(fillDay.fills).toBe(20);
  });
});

describe('buildAffected', () => {
  it('keeps only vehicles with anomalies, top 5 by count', () => {
    const vehicles = [
      { registrationNumber: 'A', defFlagCount: 2, billFlagCount: 1 },
      { registrationNumber: 'B', defFlagCount: 0, billFlagCount: 0 },
      { registrationNumber: 'C', defFlagCount: 9, billFlagCount: 0 },
      ...['D', 'E', 'F', 'G'].map((reg) => ({
        registrationNumber: reg,
        defFlagCount: 1,
        billFlagCount: 0,
      })),
    ];
    const { list, max } = buildAffected(vehicles);
    expect(list).toHaveLength(5);
    expect(list[0].reg).toBe('C');
    expect(list[0].anomalies).toBe(9);
    expect(max).toBe(9);
    expect(list.some((v) => v.reg === 'B')).toBe(false);
  });

  it('defaults max to 1 when no vehicle has anomalies', () => {
    expect(buildAffected([])).toEqual({ list: [], max: 1 });
  });
});

describe('buildRiskVehicles', () => {
  it('sorts by risk rank, then DEF flag count', () => {
    const vehicles = [
      { registrationNumber: 'HEALTHY', defFlagCount: 0, billFlagCount: 0 },
      { registrationNumber: 'CRIT', siphonSuspectedLossL: 1, defFlagCount: 0 },
      { registrationNumber: 'MED', defFlagCount: 5 },
      { registrationNumber: 'HIGH', billFlagCount: 3 },
    ];
    const sorted = buildRiskVehicles(vehicles);
    expect(sorted.map((v) => v.registrationNumber)).toEqual(['CRIT', 'HIGH', 'MED', 'HEALTHY']);
    expect(RISK_RANK[sorted[0].risk]).toBeGreaterThan(RISK_RANK[sorted[3].risk]);
  });
});

describe('buildChipDefs', () => {
  it('counts each facet over the merged events', () => {
    const events = [
      { kind: 'fill', confirmationStatus: 'CONFIRMED', billFlag: false },
      { kind: 'fill', confirmationStatus: 'ESTIMATED', billFlag: true },
      { kind: 'loss' },
      { kind: 'def' },
    ];
    const defs = buildChipDefs(events);
    const byKey = Object.fromEntries(defs.map((d) => [d.key, d.count]));
    expect(byKey.all).toBe(4);
    expect(byKey['needs-review']).toBe(3);
    expect(byKey.def).toBe(1);
    expect(byKey.bill).toBe(1);
    expect(byKey.loss).toBe(1);
  });
});

describe('buildBanner', () => {
  it('is critical when there is unexplained loss', () => {
    const b = buildBanner(12, 3, 95);
    expect(b.state).toBe('crit');
    expect(b.msg).toContain('12 L');
    expect(b.msg).toContain('₹1,140');
  });

  it('warns on bill mismatches when there is no loss', () => {
    const b = buildBanner(0, 2, 95);
    expect(b.state).toBe('warn');
    expect(b.msg).toBe('2 bill mismatches require review.');
    expect(buildBanner(0, 1, 95).msg).toBe('1 bill mismatch require review.');
  });

  it('is ok when clean', () => {
    expect(buildBanner(0, 0, 95).state).toBe('ok');
  });
});
