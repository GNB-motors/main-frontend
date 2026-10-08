import { describe, it, expect } from 'vitest';
import dayjs from 'dayjs';
import {
  VERIFICATION_META,
  drawerFromLiveRow,
  drawerFromReconciliationRow,
  kpisFromSources,
  mapIntervalRow,
  mapUnifiedRow,
  presetRange,
} from './mileageRows';

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
  it('maps every backend verification status to a badge', () => {
    for (const status of ['VERIFIED', 'UNVERIFIED', 'SLIP_ONLY', 'FLAGGED']) {
      expect(VERIFICATION_META[status]).toBeDefined();
    }
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
});

describe('drawer detail', () => {
  it('a flagged live row shows as flagged with its variance, never as a match', () => {
    const d = drawerFromLiveRow(mapUnifiedRow(slipRow));
    expect(d.badge.label).toBe('Flagged');
    expect(d.varianceL).toBe(-40);
    expect(d.variancePct).toBeCloseTo(-33.33, 1);
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
    expect(d.badge.label).toBe('Flagged overbilling');
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
    expect(row.audit.label).toBe('Matches telematics');
  });

  it('leaves missing values null instead of filling them in', () => {
    const row = mapIntervalRow({ _id: 'int2', vehicleId: null, fleetEdge: {} });
    expect(row.vehicleNo).toBeNull();
    expect(row.fuelL).toBeNull();
    expect(row.kmPerL).toBeNull();
    expect(row.cost).toBeNull();
    expect(row.distanceKm).toBeNull();
    expect(row.audit.label).toBe('Pending');
  });

  it('flags from FleetEdge win over the computed status', () => {
    const row = mapIntervalRow({
      ...interval,
      fleetEdge: { status: 'COMPUTED', isFlaggedFuel: true },
    });
    expect(row.audit.label).toBe('Flagged');
    expect(row.audit.hint).toMatch(/fuel/);
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
