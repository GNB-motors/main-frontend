import { describe, it, expect } from 'vitest';
import {
  comparisonParams,
  rowStatus,
  toReconciliationRow,
  varianceText,
} from './reconciliationModel';

describe('comparisonParams', () => {
  it('sends only keys the comparisons API accepts', () => {
    expect(comparisonParams({ page: 2, limit: 10, search: '', status: 'all' })).toEqual({
      page: 2,
      limit: 10,
    });
  });

  it('trims search and maps the flagged tab to flaggedOnly', () => {
    expect(comparisonParams({ page: 1, limit: 10, search: ' WB11 ', status: 'flagged' })).toEqual({
      page: 1,
      limit: 10,
      search: 'WB11',
      flaggedOnly: 'true',
    });
  });
});

describe('rowStatus', () => {
  it('reads flagged first, then review, else clean', () => {
    expect(rowStatus({ isFlagged: true, status: 'PENDING_REVIEW' })).toBe('FLAGGED');
    expect(rowStatus({ isFlagged: false, status: 'PENDING_REVIEW' })).toBe('REVIEW');
    expect(rowStatus({ isFlagged: false, status: 'COMPLETED' })).toBe('CLEAN');
  });
});

describe('toReconciliationRow', () => {
  const task = {
    _id: 't1',
    vehicleNumber: 'WB25K4011',
    fromDate: '2026-10-05T04:00:00Z',
    toDate: '2026-10-07T06:15:00Z',
    billFuelConsumed: 95,
    fleetEdgeFuelConsumed: 78,
    variance: 17, // bill − telematics on the backend
    variancePercent: 21.79,
    isFlagged: true,
    status: 'COMPLETED',
    flagReason: 'possible overbilling',
  };

  it('flips the variance so negative means billed more than measured', () => {
    const row = toReconciliationRow(task);
    expect(row).toMatchObject({
      vehicleNumber: 'WB25K4011',
      billDate: task.toDate,
      billLitres: 95,
      telemetryLitres: 78,
      varianceL: -17,
      variancePct: -21.79,
      status: 'FLAGGED',
    });
    expect(row.task).toBe(task);
  });

  it('derives the variance when the backend left it empty, and the plate from the vehicle', () => {
    const row = toReconciliationRow({
      billFuelConsumed: 100,
      fleetEdgeFuelConsumed: 96,
      vehicleId: { registrationNumber: 'WB11G0962' },
    });
    expect(row.varianceL).toBe(-4);
    expect(row.vehicleNumber).toBe('WB11G0962');
  });

  it('keeps unknowns as null instead of inventing values', () => {
    const row = toReconciliationRow({ _id: 'x' });
    expect(row).toMatchObject({
      vehicleNumber: null,
      billLitres: null,
      telemetryLitres: null,
      varianceL: null,
      variancePct: null,
    });
  });
});

describe('varianceText', () => {
  it('prints signed litres and percent', () => {
    expect(varianceText({ varianceL: -17, variancePct: -21.79 })).toBe('-17.0 L (-21.8%)');
    expect(varianceText({ varianceL: 2.5, variancePct: 3.2 })).toBe('+2.5 L (+3.2%)');
    expect(varianceText({ varianceL: -1, variancePct: null })).toBe('-1.0 L');
    expect(varianceText({ varianceL: null })).toBe('—');
  });
});
