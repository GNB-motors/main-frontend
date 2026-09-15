import { describe, it, expect } from 'vitest';
import {
  tileStateFromError,
  mapFleetNowTile,
  mapNeedsTodayTile,
  mapIdlingWasteTile,
  mapFuelSpendTile,
  COST_PER_KM_TILE,
} from './overviewWidgetsLogic';

describe('tileStateFromError', () => {
  it('maps 403 to permission-denied', () => {
    expect(tileStateFromError({ status: 403 }).state).toBe('permission-denied');
  });

  it('maps 404 to not-set-up', () => {
    expect(tileStateFromError({ status: 404 }).state).toBe('not-set-up');
  });

  it('maps 5xx and network failures (no status) to error', () => {
    expect(tileStateFromError({ status: 500 }).state).toBe('error');
    expect(tileStateFromError({ message: 'Network Error' }).state).toBe('error');
    expect(tileStateFromError(null).state).toBe('error');
  });
});

describe('mapFleetNowTile', () => {
  it('counts ACTIVE/PARKED and treats the rest as no signal', () => {
    const rows = [
      { registrationNumber: 'JH02BX1429', state: 'ACTIVE' },
      { registrationNumber: 'JH02BX4980', state: 'ACTIVE' },
      { registrationNumber: 'JH02BX1000', state: 'PARKED' },
      { registrationNumber: 'JH02BX2000', state: 'OFFLINE' },
    ];
    const tile = mapFleetNowTile({ data: rows, error: null });
    expect(tile.state).toBe('normal');
    expect(tile.value).toBe('2');
    expect(tile.unit).toBe('moving');
    expect(tile.subline).toContain('1 parked');
    expect(tile.subline).toContain('1 no signal');
    expect(tile.tone).toBe('ok');
  });

  it('warns when every row is non-active but telemetry exists', () => {
    const tile = mapFleetNowTile({
      data: [{ state: 'PARKED' }, { state: 'OFFLINE' }],
      error: null,
    });
    expect(tile.state).toBe('normal');
    expect(tile.value).toBe('0');
    expect(tile.tone).toBe('warn');
  });

  it('renders no-signal for an org with zero position rows', () => {
    const tile = mapFleetNowTile({ data: [], error: null });
    expect(tile.state).toBe('no-signal');
    expect(tile.value).toBeUndefined();
  });

  it('surfaces errors instead of a fake zero', () => {
    expect(mapFleetNowTile({ data: null, error: { status: 403 } }).state).toBe('permission-denied');
    expect(mapFleetNowTile({ data: null, error: { status: 502 } }).state).toBe('error');
  });
});

describe('mapNeedsTodayTile', () => {
  const both = (approvals, bills) => ({
    approvals: { data: { total: approvals } },
    bills: { data: { total: bills } },
  });

  it('sums the two pending queues', () => {
    const tile = mapNeedsTodayTile({ data: both(3, 2), error: null });
    expect(tile.state).toBe('normal');
    expect(tile.value).toBe('5');
    expect(tile.subline).toContain('3 approvals');
    expect(tile.subline).toContain('2 driver bills');
    expect(tile.tone).toBe('warn');
    expect(tile.cta?.href).toBe('/erp/approvals');
  });

  it('reads zero as a real answer — nothing needs attention', () => {
    const tile = mapNeedsTodayTile({ data: both(0, 0), error: null });
    expect(tile.state).toBe('normal');
    expect(tile.value).toBe('0');
    expect(tile.tone).toBe('ok');
    expect(tile.subline).toBe('Nothing needs your attention');
    expect(tile.cta).toBeUndefined();
  });

  it('surfaces feed failures rather than a partial sum', () => {
    expect(mapNeedsTodayTile({ data: null, error: { status: 403 } }).state).toBe(
      'permission-denied',
    );
    expect(mapNeedsTodayTile({ data: null, error: { status: 500 } }).state).toBe('error');
  });
});

describe('mapIdlingWasteTile', () => {
  it('sums idle hours and waste across per-vehicle rows', () => {
    const rows = [
      { _id: 'JH02BX1429', totalIdleHours: 2.5, totalWasteInr: 3000 },
      { _id: 'JH02BX4980', totalIdleHours: 1, totalWasteInr: 1200 },
    ];
    const tile = mapIdlingWasteTile({ data: rows, error: null });
    expect(tile.state).toBe('normal');
    expect(tile.value).toBe('₹4.2k');
    expect(tile.subline).toContain('3.5 idle hours');
    expect(tile.subline).toContain('2 vehicles');
    expect(tile.tone).toBe('warn');
  });

  it('renders no-signal when the cron-populated feed is empty', () => {
    const tile = mapIdlingWasteTile({ data: [], error: null });
    expect(tile.state).toBe('no-signal');
  });

  it('surfaces errors instead of a fabricated zero', () => {
    expect(mapIdlingWasteTile({ data: null, error: { status: 404 } }).state).toBe('not-set-up');
    expect(mapIdlingWasteTile({ data: null, error: { status: 503 } }).state).toBe('error');
  });
});

describe('mapFuelSpendTile', () => {
  it('renders the totals rollup when bills exist', () => {
    const tile = mapFuelSpendTile({
      data: { totals: { litres: 1240, amountInr: 134500, logCount: 12 } },
      error: null,
    });
    expect(tile.state).toBe('normal');
    expect(tile.value).toBe('₹1.3L');
    expect(tile.subline).toContain('1,240 L');
    expect(tile.subline).toContain('12 bills');
  });

  it('renders no-signal when no bills exist in the window', () => {
    const tile = mapFuelSpendTile({
      data: { totals: { litres: 0, amountInr: 0, logCount: 0 } },
      error: null,
    });
    expect(tile.state).toBe('no-signal');
  });

  it('surfaces errors instead of printing ₹0', () => {
    expect(mapFuelSpendTile({ data: null, error: { status: 403 } }).state).toBe(
      'permission-denied',
    );
    expect(mapFuelSpendTile({ data: null, error: { status: 500 } }).state).toBe('error');
  });
});

describe('COST_PER_KM_TILE', () => {
  it('is not-set-up by design — no endpoint serves fleet cost-per-km', () => {
    expect(COST_PER_KM_TILE.state).toBe('not-set-up');
    expect(COST_PER_KM_TILE.value).toBeUndefined();
  });
});
