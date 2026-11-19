import { describe, it, expect } from 'vitest';
import {
  sortReportRows,
  reportQuery,
  FUEL_EXPORT_COLUMNS,
  TRIP_EXPORT_COLUMNS,
} from './consolidatedReportModel';

describe('consolidated report views', () => {
  it('sorts the full population before pagination and always leaves unknown measurements last', () => {
    const rows = [
      { id: 'a', value: null },
      { id: 'b', value: 2 },
      { id: 'c', value: 100 },
      { id: 'd', value: 0 },
    ];
    expect(sortReportRows(rows, 'value', 'desc').map((r) => r.id)).toEqual(['c', 'b', 'd', 'a']);
    expect(sortReportRows(rows, 'value', 'asc').map((r) => r.id)).toEqual(['d', 'b', 'c', 'a']);
    expect(rows[0].id).toBe('a');
  });
  it('passes the same explicit IST period and entity scope to summaries and their evidence', () => {
    expect(
      reportQuery(
        { vehicle: 'v1', driver: 'all', search: ' Truck ', manufacturer: 'TATA' },
        { from: '2026-11-01', to: '2026-11-30' },
        'model',
      ),
    ).toEqual({
      from: '2026-11-01T00:00:00.000+05:30',
      to: '2026-11-30T23:59:59.999+05:30',
      vehicleId: 'v1',
      manufacturer: 'TATA',
      search: 'Truck',
      groupBy: 'model',
    });
  });
  it('exports coverage and distinct fluid/cost measures alongside headline values', () => {
    expect(FUEL_EXPORT_COLUMNS.map((c) => c.key)).toEqual(
      expect.arrayContaining([
        'dieselLitres',
        'defLitres',
        'cycleFuelLitres',
        'excludedCycleCount',
      ]),
    );
    expect(TRIP_EXPORT_COLUMNS.map((c) => c.key)).toEqual(
      expect.arrayContaining([
        'approvedCost',
        'deviationCost',
        'uncostedRecords',
        'partialCostRecords',
      ]),
    );
  });
});
