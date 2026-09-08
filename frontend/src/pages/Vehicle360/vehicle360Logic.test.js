import { describe, it, expect } from 'vitest';
import {
  riskLamp,
  hasDefLedgerData,
  READING,
  normalizeUnit,
  readingOf,
  fuelReading,
  defReading,
  serviceState,
  serviceHeadline,
  documentSummary,
  statusChips,
  coverageSources,
  daysSince,
  distanceInWindow,
  buildDueItems,
  buildSignals,
} from './vehicle360Logic';

describe('riskLamp', () => {
  it('maps OVERDUE/DUE_SOON to their lamp classes and anything else to ok', () => {
    expect(riskLamp('OVERDUE')).toBe('lamp--critical');
    expect(riskLamp('DUE_SOON')).toBe('lamp--caution');
    expect(riskLamp('FINE')).toBe('lamp--ok');
    expect(riskLamp(undefined)).toBe('lamp--ok');
  });
});

describe('hasDefLedgerData', () => {
  it('is false for a missing balance', () => {
    expect(hasDefLedgerData(null)).toBe(false);
    expect(hasDefLedgerData(undefined)).toBe(false);
  });

  it('is false for an all-zero balance with no flags', () => {
    expect(hasDefLedgerData({ claimedAdblueL: 0, telemetryDefL: 0, expectedBalanceL: 0 })).toBe(
      false,
    );
  });

  it('is true when any figure is non-zero', () => {
    expect(hasDefLedgerData({ claimedAdblueL: 5, telemetryDefL: 0, expectedBalanceL: 0 })).toBe(
      true,
    );
  });

  it('is true when there are flags even if every figure is zero', () => {
    expect(
      hasDefLedgerData({ claimedAdblueL: 0, telemetryDefL: 0, expectedBalanceL: 0, flagCount: 2 }),
    ).toBe(true);
    expect(hasDefLedgerData({ flags: ['MISMATCH'] })).toBe(true);
  });
});

describe('normalizeUnit', () => {
  it('keeps litres and percent, and rejects units it cannot interpret', () => {
    expect(normalizeUnit('litres')).toBe('litres');
    expect(normalizeUnit('percent')).toBe('%');
    expect(normalizeUnit('%')).toBe('%');
    expect(normalizeUnit('unit')).toBeNull();
    expect(normalizeUnit(undefined)).toBeNull();
  });
});

describe('readingOf', () => {
  it('is OK for a usable number with an interpretable unit', () => {
    expect(readingOf(42, 'litres')).toEqual({ state: READING.OK, unit: 'litres', value: 42 });
    // A percentage reading is displayable — the old code discarded these.
    expect(readingOf(35, 'percent')).toEqual({ state: READING.OK, unit: '%', value: 35 });
  });

  it('treats zero as a real reading, not missing data', () => {
    expect(readingOf(0, 'litres')).toEqual({ state: READING.OK, unit: 'litres', value: 0 });
  });

  it('is NO_DATA when the unit is known but no value arrived', () => {
    expect(readingOf(null, 'litres').state).toBe(READING.NO_DATA);
    expect(readingOf(undefined, 'litres').state).toBe(READING.NO_DATA);
  });

  it('is NO_UNIT when the sensor unit is uninterpretable, whatever the value', () => {
    expect(readingOf(90, 'unit').state).toBe(READING.NO_UNIT);
    expect(readingOf(90, undefined).state).toBe(READING.NO_UNIT);
  });

  it('reads fuel and DEF off a health object', () => {
    expect(fuelReading({ primaryFuelLevel: 60, fuelLevelUnit: 'litres' }).value).toBe(60);
    expect(defReading({ defLevel: 12, defLevelUnit: 'percent' }).unit).toBe('%');
    expect(fuelReading(undefined).state).toBe(READING.NO_UNIT);
  });
});

describe('serviceState', () => {
  it('reports no forecast when the prediction is absent', () => {
    expect(serviceState(null)).toEqual({ level: 'none', label: 'No forecast' });
  });

  it('turns negative backend figures into positive magnitudes plus an overdue flag', () => {
    const svc = serviceState({
      risk: 'OVERDUE',
      kmUntilDue: -3353,
      daysUntilDue: -8,
      projectedServiceDueDate: '2026-08-29',
      basis: 'ODO_TREND',
    });
    expect(svc).toMatchObject({
      level: 'critical',
      label: 'Overdue',
      overdue: true,
      km: 3353,
      days: 8,
      projectedAt: '2026-08-29',
    });
  });

  it('flags overdue from a negative figure even when risk says otherwise', () => {
    expect(serviceState({ risk: 'FINE', kmUntilDue: -10 }).overdue).toBe(true);
  });

  it('maps DUE_SOON to a warning and healthy figures to on-schedule', () => {
    expect(serviceState({ risk: 'DUE_SOON', kmUntilDue: 900 })).toMatchObject({
      level: 'warn',
      label: 'Due soon',
      overdue: false,
      km: 900,
    });
    expect(serviceState({ risk: 'FINE', kmUntilDue: 8000 })).toMatchObject({
      level: 'ok',
      label: 'On schedule',
      overdue: false,
    });
  });
});

describe('serviceHeadline', () => {
  const km = (v) => `${v} km`;
  const num = (v) => String(v);

  it('prefers distance and states the direction', () => {
    expect(serviceHeadline(serviceState({ risk: 'OVERDUE', kmUntilDue: -3353 }), km, num)).toBe(
      '3353 km overdue',
    );
    expect(serviceHeadline(serviceState({ risk: 'FINE', kmUntilDue: 900 }), km, num)).toBe(
      '900 km left',
    );
  });

  it('falls back to days, then to the label, then to a dash', () => {
    expect(serviceHeadline(serviceState({ risk: 'OVERDUE', daysUntilDue: -8 }), km, num)).toBe(
      '8 days overdue',
    );
    expect(serviceHeadline(serviceState({ risk: 'FINE' }), km, num)).toBe('On schedule');
    expect(serviceHeadline(serviceState(null), km, num)).toBe('—');
  });
});

describe('documentSummary', () => {
  const now = new Date('2026-09-08T00:00:00Z').getTime();

  it('counts nothing for an empty or missing list', () => {
    expect(documentSummary([], now)).toEqual({
      total: 0,
      expired: 0,
      expiring: 0,
      needsAttention: 0,
    });
    expect(documentSummary(undefined, now).total).toBe(0);
  });

  it('splits expired from expiring-soon and ignores docs with no expiry', () => {
    const summary = documentSummary(
      [
        { docType: 'RC', expiryDate: '2026-08-01' }, // expired
        { docType: 'Insurance', expiryDate: '2026-09-20' }, // expiring within 30d
        { docType: 'Fitness', expiryDate: '2027-01-04' }, // far future
        { docType: 'Permit' }, // no expiry recorded
      ],
      now,
    );
    expect(summary).toEqual({ total: 4, expired: 1, expiring: 1, needsAttention: 2 });
  });
});

describe('statusChips', () => {
  it('leads with service severity, then availability, then motion', () => {
    const chips = statusChips({
      fleetMaster: { status: 'AVAILABLE' },
      livePosition: { speed: 0 },
      prediction: { risk: 'OVERDUE', kmUntilDue: -3353 },
    });
    expect(chips.map((c) => c.id)).toEqual(['service', 'availability', 'motion']);
    expect(chips[0]).toMatchObject({ tone: 'crit', label: 'Service overdue' });
    expect(chips[1].label).toBe('available');
    expect(chips[2].label).toBe('parked');
  });

  it('shows speed when the vehicle is moving', () => {
    const chips = statusChips({ livePosition: { speed: 41.6 } });
    expect(chips.find((c) => c.id === 'motion').label).toBe('moving · 42 km/h');
  });

  it('omits chips it has no data for, and skips service when on schedule', () => {
    expect(statusChips({})).toEqual([]);
    expect(statusChips({ prediction: { risk: 'FINE', kmUntilDue: 9000 } })).toEqual([]);
  });
});

describe('daysSince', () => {
  const now = new Date('2026-09-08T12:00:00Z').getTime();

  it('counts whole days and floors at zero', () => {
    expect(daysSince('2026-09-01T12:00:00Z', now)).toBe(7);
    expect(daysSince('2026-09-08T11:00:00Z', now)).toBe(0);
    expect(daysSince('2026-09-09T12:00:00Z', now)).toBe(0); // future clamps
  });

  it('is null for a missing or unparseable timestamp', () => {
    expect(daysSince(null, now)).toBeNull();
    expect(daysSince('not-a-date', now)).toBeNull();
  });
});

describe('distanceInWindow', () => {
  it('is the gap between the first and last odometer reading', () => {
    expect(distanceInWindow([{ odo: 56000 }, { odo: 56200 }, { odo: 56588 }])).toBe(588);
  });

  it('needs two readings — one tells you nothing about movement', () => {
    expect(distanceInWindow([{ odo: 56588 }])).toBeNull();
    expect(distanceInWindow([])).toBeNull();
    expect(distanceInWindow(undefined)).toBeNull();
  });

  it('ignores gaps with no odometer value', () => {
    expect(distanceInWindow([{ odo: 100 }, { odo: null }, { odo: 250 }])).toBe(150);
  });

  it('reports a parked truck as zero rather than negative on a counter reset', () => {
    expect(distanceInWindow([{ odo: 500 }, { odo: 500 }])).toBe(0);
    expect(distanceInWindow([{ odo: 500 }, { odo: 100 }])).toBe(0);
  });
});

describe('buildDueItems', () => {
  const now = new Date('2026-09-08T00:00:00Z').getTime();

  it('is empty when nothing is outstanding', () => {
    const items = buildDueItems(
      {
        prediction: { risk: 'FINE', kmUntilDue: 9000 },
        documents: [{ docType: 'RC', expiryDate: '2027-06-01' }],
        health: { pulledAt: '2026-09-08T00:00:00Z' },
      },
      now,
    );
    expect(items).toEqual([]);
  });

  it('leads with overdue service, and flags missing documents and silent telemetry', () => {
    const items = buildDueItems(
      {
        prediction: { risk: 'OVERDUE', kmUntilDue: -3997, daysUntilDue: -10 },
        documents: [],
        health: { pulledAt: '2026-08-08T00:00:00Z' },
      },
      now,
    );
    expect(items.map((i) => i.id)).toEqual(['service', 'documents', 'telemetry']);
    expect(items[0]).toMatchObject({ tone: 'red' });
    expect(items[0].title).toContain('3997 km overdue');
    expect(items[2].title).toBe('Telemetry silent 31 days');
  });
});

describe('buildSignals', () => {
  const now = new Date('2026-09-08T00:00:00Z').getTime();

  it('marks a signal amber once telemetry has gone quiet', () => {
    const signals = buildSignals(
      { canOdo: 56588, pulledAt: '2026-08-08T00:00:00Z' },
      { latitude: 22.5 },
      now,
    );
    const odo = signals.find((s) => s.name === 'Odometer (CAN)');
    expect(odo).toMatchObject({ tone: 'amber' });
    expect(odo.state).toContain('silent 31 days');
  });

  it('reports an uninterpretable sensor unit as grey, not as a reading', () => {
    const signals = buildSignals(
      { primaryFuelLevel: 90, pulledAt: '2026-09-08T00:00:00Z' },
      {},
      now,
    );
    expect(signals.find((s) => s.name === 'Fuel level')).toEqual({
      name: 'Fuel level',
      tone: 'grey',
      state: 'unit not reported by the sensor',
    });
  });

  it('never invents a sensor the payload has no field for', () => {
    const names = buildSignals({}, {}, now).map((s) => s.name);
    expect(names).not.toContain('Tyre pressure');
    expect(names).not.toContain('Brake fluid');
  });
});

describe('coverageSources', () => {
  it('lists only the sources that actually know the vehicle', () => {
    expect(
      coverageSources({ inFleetMaster: true, inFleetEdge: false, hasLiveStatus: true }),
    ).toEqual(['Fleet master', 'Live status']);
    expect(coverageSources(null)).toEqual([]);
  });
});
