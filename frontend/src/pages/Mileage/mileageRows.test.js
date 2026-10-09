import { describe, it, expect } from 'vitest';
import dayjs from 'dayjs';
import {
  REFUEL_CHIPS,
  billCoverage,
  cleanStationName,
  dailyRollup,
  dieselUse,
  drawerFromLiveRow,
  drawerFromReconciliationRow,
  fillExplanation,
  fillVerdict,
  hubRangeFromParams,
  kpisFromSources,
  mapFuelCycleRow,
  mapIntervalRow,
  mapPumpRow,
  mapUnifiedRow,
  mileageBand,
  presetRange,
  pumpHonestyStatus,
  pumpLedgerSummary,
  rangeLabel,
  rangeToParams,
  refuelResult,
  trucksFromModels,
} from './mileageRows';
import { LABELS } from '../../lib/vocabulary';

const slipRow = {
  id: 'log_1',
  source: 'MATCHED',
  verificationStatus: 'FLAGGED',
  vehicleNumber: 'WB25V8040',
  vehicleModel: 'Signa 4825.TK',
  at: '2026-10-01T10:00:00Z',
  slip: {
    litres: 120,
    totalAmount: 11400,
    rate: null,
    location: 'IOCL Dankuni',
    fuelType: 'DIESEL',
    odometerReading: 418920,
    odometerSource: 'FLEETEDGE',
    documentId: 'doc1',
  },
  sensor: { litres: 80, billVarianceL: -40, claimedLitres: 120, billFlag: true },
};

const sensorOnlyRow = {
  id: 'fill_1',
  source: 'SENSOR',
  verificationStatus: 'UNVERIFIED',
  vehicleNumber: '',
  vehicleModel: null,
  at: '2026-10-01T11:30:00Z',
  slip: null,
  sensor: { litres: 65, lat: 22.57, lng: 88.36, fuelPumpName: null },
};

describe('mapUnifiedRow', () => {
  it('turns every backend status into a plain-word result that has a label', () => {
    for (const status of ['VERIFIED', 'UNVERIFIED', 'SLIP_ONLY', 'FLAGGED', 'SENSOR_GLITCH']) {
      expect(LABELS.refuel[refuelResult(status, -1)]).toBeDefined();
    }
  });

  it('says which way a flagged bill is wrong', () => {
    expect(refuelResult('FLAGGED', -40)).toBe('BILL_TOO_HIGH');
    expect(refuelResult('FLAGGED', 12)).toBe('BILL_TOO_LOW');
    expect(refuelResult('FLAGGED', null)).toBe('BILL_TOO_HIGH');
    expect(refuelResult('UNVERIFIED')).toBe('BILL_MISSING');
    expect(refuelResult('SLIP_ONLY')).toBe('NO_TANK_READING');
    expect(refuelResult('SENSOR_GLITCH')).toBe('GAUGE_JUMP');
    expect(refuelResult('SOMETHING_NEW')).toBeNull();
  });

  it('keeps real values and derives the rate from amount ÷ litres', () => {
    const row = mapUnifiedRow(slipRow);
    expect(row.vehicleNo).toBe('WB25V8040');
    expect(row.model).toBe('Signa 4825.TK');
    expect(row.status).toBe('FLAGGED');
    expect(row.slipLitres).toBe(120);
    expect(row.sensorLitres).toBe(80);
    expect(row.location).toBe('IOCL Dankuni');
    expect(row.rate).toEqual({ value: 95, provenance: 'CALCULATED' });
    expect(row.odometerSource).toBe('FLEETEDGE');
  });

  it('invents nothing for a sensor-only row', () => {
    const row = mapUnifiedRow(sensorOnlyRow);
    expect(row.vehicleNo).toBeNull();
    expect(row.model).toBeNull();
    expect(row.location).toBeNull();
    expect(row.coords).toEqual({ lat: 22.57, lng: 88.36 });
    expect(row.rate).toEqual({ value: null, provenance: null });
    expect(row.totalAmount).toBeNull();
    expect(row.odometer).toBeNull();
    expect(row.slipLitres).toBeNull();
  });

  it('a fill inside a named saved place shows that name, linked to the place', () => {
    const row = mapUnifiedRow({
      ...slipRow,
      place: { id: 's1', hubId: 'site:s1', name: 'Dankuni pump', siteType: 'FUEL_PUMP' },
    });
    expect(row.location).toBe('Dankuni pump');
    expect(row.billLocation).toBe('IOCL Dankuni');
    expect(row.place).toEqual({ hubId: 'site:s1', name: 'Dankuni pump', siteType: 'FUEL_PUMP' });
  });

  it('an unnamed saved place keeps the bill text, or the coordinates, and still links', () => {
    const unnamed = { id: 's2', hubId: 'site:s2', name: null, siteType: 'UNKNOWN' };
    expect(mapUnifiedRow({ ...slipRow, place: unnamed }).location).toBe('IOCL Dankuni');
    const sensorOnly = mapUnifiedRow({ ...sensorOnlyRow, place: unnamed });
    expect(sensorOnly.location).toBeNull();
    expect(sensorOnly.coords).toEqual({ lat: 22.57, lng: 88.36 });
    expect(sensorOnly.place.hubId).toBe('site:s2');
  });
});

describe('drawer detail', () => {
  it('a flagged live row shows as flagged with its variance, never as a match', () => {
    const d = drawerFromLiveRow(mapUnifiedRow(slipRow));
    expect(d.result).toBe('BILL_TOO_HIGH');
    expect(d.varianceL).toBe(-40);
    // shown as sent; the hub never derives a bill verdict on the client
    expect(d.variancePct).toBeNull();
    expect(d.bill.documentId).toBe('doc1');
    expect(d.sensor.litres).toBe(80);
  });

  it('a sensor-only row has no bill', () => {
    const d = drawerFromLiveRow(mapUnifiedRow(sensorOnlyRow));
    expect(d.bill).toBeNull();
    expect(d.sensor.litres).toBe(65);
  });

  it('a flagged reconciliation row keeps its status', () => {
    const d = drawerFromReconciliationRow({
      vehicleNumber: 'KA01AB1234',
      status: 'FLAGGED',
      billLitres: 95,
      telemetryLitres: 78,
      varianceL: -17,
      variancePct: -17.89,
    });
    expect(d.result).toBe('BILL_TOO_HIGH');
    expect(d.explanation.lines).toContainEqual(['Allowed', '± 10.0 L']);
    expect(d.bill.litres).toBe(95);
    expect(d.sensor.litres).toBe(78);
    expect(d.varianceL).toBe(-17);
  });
});

describe('mapIntervalRow', () => {
  const interval = {
    _id: 'int1',
    vehicleId: { registrationNumber: 'WB11G0962', model: 'Signa 4825.TK' },
    startDate: '2026-09-18T08:00:00Z',
    endDate: '2026-10-06T16:30:00Z',
    startOdometer: 412400,
    endOdometer: 414850,
    distanceKm: 2450,
    fuelConsumedLiters: 645,
    mileageKmPerL: 3.8,
    fuelCost: 60950,
    fleetEdge: { status: 'COMPUTED' },
  };

  it('reads the backend field names', () => {
    const row = mapIntervalRow(interval);
    expect(row.vehicleNo).toBe('WB11G0962');
    expect(row.model).toBe('Signa 4825.TK');
    expect(row.fuelL).toBe(645);
    expect(row.kmPerL).toBe(3.8);
    expect(row.cost).toBe(60950);
    expect(row.check).toBe('TRACKER_MATCHES');
  });

  it('leaves missing values null instead of filling them in', () => {
    const row = mapIntervalRow({ _id: 'int2', vehicleId: null, fleetEdge: {} });
    expect(row.vehicleNo).toBeNull();
    expect(row.fuelL).toBeNull();
    expect(row.kmPerL).toBeNull();
    expect(row.cost).toBeNull();
    expect(row.distanceKm).toBeNull();
    expect(row.check).toBe('TRACKER_PENDING');
  });

  it('flags from FleetEdge win over the computed status', () => {
    const row = mapIntervalRow({
      ...interval,
      fleetEdge: { status: 'COMPUTED', isFlaggedFuel: true },
    });
    expect(row.check).toBe('TRACKER_DIFFERS');
  });
});

describe('presetRange', () => {
  const now = dayjs('2026-10-08T12:00:00');
  it('defaults to the last 30 days inclusive', () => {
    expect(presetRange('30DAYS', now)).toEqual({ from: '2026-09-09', to: '2026-10-08' });
  });
  it('today is a single day', () => {
    expect(presetRange('TODAY', now)).toEqual({ from: '2026-10-08', to: '2026-10-08' });
  });
});

describe('kpisFromSources', () => {
  it('reconciled % counts only tank rises, and fleet km/L is distance-weighted', () => {
    const k = kpisFromSources({
      feedMeta: { verified: 90, flagged: 6, unverified: 4, slipOnly: 30, totalSpendInr: 500000 },
      modelData: [
        { totalDistanceKm: 4000, totalFuelL: 1000, vehicleCount: 3 },
        { totalDistanceKm: 1000, totalFuelL: 500, vehicleCount: 2 },
      ],
    });
    expect(k.reconciledPct).toBeCloseTo(96, 5);
    expect(k.flagged).toBe(6);
    expect(k.bills).toBe(126);
    expect(k.fleetKmPerL).toBeCloseTo(5000 / 1500, 5);
    expect(k.vehicleCount).toBe(5);
  });

  it('is empty, not zero, without data', () => {
    const k = kpisFromSources({ feedMeta: null, modelData: null });
    expect(k.reconciledPct).toBeNull();
    expect(k.flagged).toBeNull();
    expect(k.fleetKmPerL).toBeNull();
  });
});

describe('PR #142 feed fields', () => {
  const corrected = {
    ...slipRow,
    slip: { ...slipRow.slip, id: 'log1' },
    sensor: {
      litres: 80,
      rawLitres: 76.4,
      correction: 'V2_GAIN',
      gainBills: 12,
      bandL: 6.2,
      billVarianceL: -40,
      billToleranceL: 7.5,
      billFlag: true,
      v1BillVarianceL: -43.6,
      v1BillFlag: true,
    },
  };

  it('puts the maths behind ⓘ: gauge rise, correction, bill gap and allowance', () => {
    const e = fillExplanation(mapUnifiedRow(corrected));
    expect(e.title).toBe('Bill is more than the tank got');
    expect(e.lines).toEqual([
      ['Gauge rose', '76.4 L'],
      ['Corrected to', '80.0 L'],
      ['Correction', 'from 12 bills of this truck'],
      ['Normal error', '± 6.2 L'],
      ['Bill', '120.0 L'],
      ['Tank − bill', '-40.0 L'],
      ['Allowed', '± 7.5 L'],
    ]);
  });

  it('says when the correction is only the fleet average', () => {
    const e = fillExplanation(
      mapUnifiedRow({
        ...sensorOnlyRow,
        sensor: { litres: 157.7, rawLitres: 141.5, gainBills: 0, bandL: 36.1 },
      }),
    );
    expect(e.title).toBe('Diesel went in, no bill');
    expect(e.lines).toContainEqual(['Correction', 'fleet average, no bills for this truck yet']);
  });

  it('keeps the corrected and raw figures apart', () => {
    const row = mapUnifiedRow(corrected);
    expect(row.sensorLitres).toBe(80);
    expect(row.rawLitres).toBe(76.4);
    expect(row.bandL).toBe(6.2);
    expect(row.correction).toBe('V2_GAIN');
    expect(row.billVarianceL).toBe(-40);
    expect(row.billToleranceL).toBe(7.5);
  });

  it('passes the server bill check and the old check through to the drawer', () => {
    const d = drawerFromLiveRow(mapUnifiedRow(corrected));
    expect(d.varianceL).toBe(-40);
    expect(d.billCheck).toEqual({
      toleranceL: 7.5,
      flagged: true,
      v1VarianceL: -43.6,
      v1Flagged: true,
    });
    expect(d.bill.id).toBe('log1');
    expect(d.sensor.rawLitres).toBe(76.4);
  });

  it('a glitch has no corrected litres', () => {
    const row = mapUnifiedRow({
      id: 'fill_9',
      verificationStatus: 'SENSOR_GLITCH',
      litres: null,
      slip: null,
      sensor: { litres: null, rawLitres: 42, correction: 'SENSOR_GLITCH' },
    });
    expect(row.sensorLitres).toBeNull();
    expect(row.rawLitres).toBe(42);
  });
});

describe('rangeToParams', () => {
  it('sends the start and end of the IST day', () => {
    expect(rangeToParams({ from: '2026-10-08', to: '2026-10-08' })).toEqual({
      from: '2026-10-07T18:30:00.000Z',
      to: '2026-10-08T18:29:59.999Z',
    });
  });
});

describe('mapFuelCycleRow', () => {
  it('reads the fuel-cycles fields and turns coverage shares into percents', () => {
    const row = mapFuelCycleRow({
      _id: 'c1',
      registrationNumber: 'WB11J8562',
      open: { source: 'BILL', at: '2026-10-01T04:00:00Z', odo: 100000 },
      close: null,
      km: { odo: 1200 },
      fuel: { bills: 400, ecu: 380, tankDelta: 0 },
      mileage: { tankToTank: 3, ecu: 3.16 },
      coverage: { kmMeasured: 0.92, fuelEcu: null },
      flags: ['RECONCILE_GAP'],
      status: 'OPEN',
    });
    expect(row.km).toBe(1200);
    expect(row.closeAt).toBeNull();
    expect(row.kmPerLTankToTank).toBe(3);
    expect(row.kmPerLEcu).toBe(3.16);
    expect(row.kmCoveragePct).toBeCloseTo(92, 5);
    expect(row.fuelCoveragePct).toBeNull();
    expect(row.flags).toEqual(['RECONCILE_GAP']);
  });
});

describe('dailyRollup', () => {
  it('sums hours per IST day and scores only windows with an expected figure', () => {
    const days = dailyRollup([
      {
        windowFrom: '2026-10-08T03:00:00Z',
        distanceKm: 40,
        actualL: 12,
        expectedL: 10,
        deviationL: 2,
        source: 'REGRESSION',
      },
      {
        windowFrom: '2026-10-08T04:00:00Z',
        distanceKm: 30,
        actualL: 9,
        expectedL: null,
        deviationL: null,
        source: 'NONE',
      },
      {
        windowFrom: '2026-10-09T03:00:00Z',
        distanceKm: 10,
        actualL: 3,
        expectedL: null,
        deviationL: null,
        source: 'NONE',
      },
    ]);
    expect(days).toHaveLength(2);
    expect(days[0]).toMatchObject({
      windows: 2,
      distanceKm: 70,
      actualL: 21,
      expectedL: 10,
      deviationL: 2,
      scored: 1,
    });
    expect(days[0].deviationPct).toBeCloseTo(20, 5);
    expect(days[1].expectedL).toBeNull();
    expect(days[1].deviationPct).toBeNull();
  });
});

describe('pump honesty', () => {
  it('judges a pump only once it has 3 fills', () => {
    expect(pumpHonestyStatus(55.5, 1)).toBe('INSUFFICIENT_DATA');
    expect(pumpHonestyStatus(55.5, 2)).toBe('INSUFFICIENT_DATA');
    expect(pumpHonestyStatus(55.5, 3)).toBe('CHRONIC_SHORTAGE');
  });

  it('grades by short-delivery %, boundaries inclusive', () => {
    expect(pumpHonestyStatus(-2, 5)).toBe('HONEST');
    expect(pumpHonestyStatus(1, 5)).toBe('HONEST');
    expect(pumpHonestyStatus(3, 5)).toBe('RELIABLE');
    expect(pumpHonestyStatus(6, 5)).toBe('SUSPICIOUS');
    expect(pumpHonestyStatus(7.9, 11)).toBe('UNRELIABLE');
    expect(pumpHonestyStatus(10.1, 5)).toBe('CHRONIC_SHORTAGE');
    expect(pumpHonestyStatus(null, 5)).toBe('HONEST');
  });

  it('has a plain-word label for every verdict', () => {
    [
      'HONEST',
      'RELIABLE',
      'SUSPICIOUS',
      'UNRELIABLE',
      'CHRONIC_SHORTAGE',
      'INSUFFICIENT_DATA',
    ].forEach((k) => expect(LABELS.pumpHonesty[k]).toBeDefined());
  });

  it('cleans a dealer name into its oil company and the highway', () => {
    const s = cleanStationName(
      'M/s SHREE NIDHI SALES Dealer of Reliance BP Mobility Limited NH19,TARASHAKTI RICE MILL',
    );
    expect(s.brand).toBe('Reliance BP');
    expect(s.displayName).toBe('Reliance BP Mobility Limited NH19');
    expect(s.location).toBe('NH19');
  });

  it('does not repeat the name as its own location', () => {
    expect(cleanStationName('DANKUNI SUPER SER STN DELHI ROAD')).toEqual({
      displayName: 'DANKUNI SUPER SER STN DELHI ROAD',
      brand: '',
      location: '',
    });
  });

  it('names a missing pump', () => {
    expect(cleanStationName(null).displayName).toBe('Unknown pump');
    expect(cleanStationName('  ').displayName).toBe('Unknown pump');
  });

  it('maps a ledger row and rolls the totals up', () => {
    const rows = [
      {
        pump: 'DANKUNI SUPER SER STN DELHI ROAD',
        fills: 11,
        flaggedFills: 4,
        claimedLitres: 3222,
        actualLitres: 2967.5,
        shortfallLitres: 254.5,
        shortfallPct: 7.9,
        estimatedLossInr: 24181,
        lastFillAt: '2026-10-01T06:00:00Z',
      },
      {
        pump: 'RANI FILLING STATION',
        fills: 1,
        claimedLitres: 341,
        shortfallLitres: 189.3,
        estimatedLossInr: 17982,
      },
    ].map(mapPumpRow);

    expect(rows[0]).toMatchObject({
      fills: 11,
      flaggedFills: 4,
      shortfallPct: 7.9,
      status: 'UNRELIABLE',
    });
    // No shortfallPct from the server: derived from litres.
    expect(rows[1].shortfallPct).toBeCloseTo(55.51, 1);
    expect(rows[1].status).toBe('INSUFFICIENT_DATA');
    expect(pumpLedgerSummary(rows)).toEqual({
      pumps: 2,
      fills: 12,
      shortfallLitres: 443.8,
      lossInr: 42163,
      chronic: 0,
    });
  });
});

describe('hub dates', () => {
  const now = dayjs('2026-10-09T12:00:00');
  const at = (qs) => hubRangeFromParams(new URLSearchParams(qs), now);

  it('defaults to the last 30 days', () => {
    expect(at('')).toEqual({ preset: '30DAYS', range: { from: '2026-09-10', to: '2026-10-09' } });
  });

  it('reads a quick choice, including yesterday and this month', () => {
    expect(at('dates=YESTERDAY').range).toEqual({ from: '2026-10-08', to: '2026-10-08' });
    expect(at('dates=MONTH').range).toEqual({ from: '2026-10-01', to: '2026-10-09' });
  });

  it('picked dates win over a quick choice', () => {
    expect(at('dates=7DAYS&from=2026-08-01&to=2026-08-31')).toEqual({
      preset: null,
      range: { from: '2026-08-01', to: '2026-08-31' },
    });
  });

  it('ignores picked dates that are back to front or not dates', () => {
    expect(at('from=2026-09-30&to=2026-09-01').preset).toBe('30DAYS');
    expect(at('from=yesterday&to=2026-09-01').preset).toBe('30DAYS');
  });

  it('labels the range in words', () => {
    expect(rangeLabel({ from: '2026-10-09', to: '2026-10-09' })).toBe('9 Oct 2026');
    expect(rangeLabel({ from: '2026-09-10', to: '2026-10-09' })).toBe('10 Sep – 9 Oct 2026');
    expect(rangeLabel({ from: '2025-12-20', to: '2026-01-05' })).toBe('20 Dec 2025 – 5 Jan 2026');
  });
});

describe('plain-word verdicts', () => {
  it('bands mileage the way the cycles list always coloured it', () => {
    expect(mileageBand(4.1)).toBe('MILEAGE_GOOD');
    expect(mileageBand(3.6)).toBe('MILEAGE_AVERAGE');
    expect(mileageBand(3.03)).toBe('MILEAGE_LOW');
    expect(mileageBand(null)).toBeNull();
  });

  it('bill coverage and daily diesel use', () => {
    expect(billCoverage(95)).toBe('BILLS_UP_TO_DATE');
    expect(billCoverage(70)).toBe('SOME_BILLS_MISSING');
    expect(billCoverage(0)).toBe('MANY_BILLS_MISSING');
    expect(dieselUse(4)).toBe('USED_NORMAL');
    expect(dieselUse(11)).toBe('USED_EXTRA');
    expect(dieselUse(-8)).toBe('USED_LESS');
    expect(dieselUse(null)).toBeNull();
  });

  it('the drawer opens with what happened and what to do', () => {
    const d = drawerFromLiveRow(mapUnifiedRow({ ...sensorOnlyRow, sensor: { litres: 157.7 } }));
    expect(fillVerdict(d)).toEqual({
      headline: 'About 158 L went into the tank. No bill uploaded yet.',
      next: 'Ask the driver to upload the bill.',
    });
  });

  it('fill chips read the feed counts, gauge jumps kept out of All', () => {
    const m = { verified: 21, flagged: 1, unverified: 81, slipOnly: 61, sensorGlitch: 3 };
    expect(REFUEL_CHIPS.map((c) => c.count(m))).toEqual([164, 21, 1, 81, 61, 3]);
  });
});

describe('trucksFromModels', () => {
  it('flattens the model comparison into trucks, best mileage first', () => {
    const rows = trucksFromModels([
      {
        model: 'Signa',
        vehicles: [{ vehicleId: 'a', vehicleNumber: 'WB1', avgMileage: 3.1, recordCount: 4 }],
      },
      {
        model: 'Prima',
        vehicles: [{ vehicleId: 'b', vehicleNumber: 'WB2', avgMileage: 3.6, recordCount: 2 }],
      },
    ]);
    expect(rows.map((r) => [r.vehicleNo, r.model, r.kmPerL, r.rounds])).toEqual([
      ['WB2', 'Prima', 3.6, 2],
      ['WB1', 'Signa', 3.1, 4],
    ]);
    expect(trucksFromModels(null)).toEqual([]);
  });
});
