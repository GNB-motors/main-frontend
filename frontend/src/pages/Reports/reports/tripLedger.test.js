import { describe, it, expect } from 'vitest';
import {
  formatLedgerCurrency,
  formatLedgerDate,
  formatLedgerWeight,
  formatProfitLabel,
  extractDriverOptions,
  extractVehicleOptions,
  extractRouteOptions,
  filterLedgerRows,
  paginateRows,
  computeProfitBounds,
  renderPageItems,
  LEDGER_EXPORT_COLUMNS,
  mapLedgerRowForExport,
  ledgerExportMeta,
} from './tripLedger';

describe('formatters', () => {
  it('formatLedgerCurrency formats numbers en-IN, dash otherwise', () => {
    expect(formatLedgerCurrency(123456)).toBe('₹1,23,456');
    expect(formatLedgerCurrency('x')).toBe('-');
    expect(formatLedgerCurrency(null)).toBe('-');
  });

  it('formatLedgerDate formats via dayjs, dash for empty', () => {
    expect(formatLedgerDate('2026-08-15')).toBe('15 Aug 2026');
    expect(formatLedgerDate(null)).toBe('-');
  });

  it('formatLedgerWeight appends kg', () => {
    expect(formatLedgerWeight(1500)).toBe('1,500 kg');
    expect(formatLedgerWeight(undefined)).toBe('-');
  });

  it('formatProfitLabel compacts thousands', () => {
    expect(formatProfitLabel(500)).toBe('₹500');
    expect(formatProfitLabel(1500)).toBe('₹1.5K');
    expect(formatProfitLabel(-2300)).toBe('₹-2.3K');
    expect(formatProfitLabel(null)).toBe('');
  });
});

describe('option extraction', () => {
  it('extracts sorted driver names, dropping blanks', () => {
    expect(
      extractDriverOptions([
        { firstName: 'Zed', lastName: '' },
        { firstName: 'Asha', lastName: 'Singh' },
        { firstName: '', lastName: '' },
      ]),
    ).toEqual(['Asha Singh', 'Zed']);
  });

  it('extracts sorted vehicle registrations', () => {
    expect(
      extractVehicleOptions([{ registrationNumber: 'MH-02' }, { registrationNumber: 'KA-01' }, {}]),
    ).toEqual(['KA-01', 'MH-02']);
  });

  it('extracts unique sorted routes', () => {
    const rows = [
      { route: { name: 'B' } },
      { route: { name: 'A' } },
      { route: { name: 'B' } },
      { route: null },
    ];
    expect(extractRouteOptions(rows)).toEqual(['A', 'B']);
  });
});

const rows = [
  {
    _id: '1',
    driver: { fullName: 'Asha' },
    vehicle: { registrationNumber: 'KA-01' },
    route: { name: 'R1' },
    performance: { netProfit: 100 },
  },
  {
    _id: '2',
    driver: { fullName: 'Ram' },
    vehicle: { registrationNumber: 'MH-02' },
    route: { name: 'R2' },
    performance: { netProfit: -500 },
  },
  {
    _id: '3',
    driver: { fullName: 'Asha' },
    vehicle: { registrationNumber: 'KA-01' },
    route: { name: 'R1' },
    performance: { netProfit: 5000 },
  },
];

describe('filterLedgerRows', () => {
  it('returns everything with defaults', () => {
    expect(filterLedgerRows(rows, {})).toHaveLength(3);
    expect(filterLedgerRows(null, {})).toEqual([]);
  });

  it('filters by driver / vehicle / route', () => {
    expect(filterLedgerRows(rows, { selectedDriver: 'Asha' })).toHaveLength(2);
    expect(filterLedgerRows(rows, { selectedVehicle: 'MH-02' })).toHaveLength(1);
    expect(filterLedgerRows(rows, { selectedRoute: 'R2' })).toHaveLength(1);
  });

  it('filters by profit range window', () => {
    expect(filterLedgerRows(rows, { profitRange: [0, 200] }).map((r) => r._id)).toEqual(['1']);
    expect(filterLedgerRows(rows, { profitRange: [-1000, 10000] })).toHaveLength(3);
  });

  it('combines filters', () => {
    expect(
      filterLedgerRows(rows, { selectedDriver: 'Asha', profitRange: [2000, 6000] }).map(
        (r) => r._id,
      ),
    ).toEqual(['3']);
  });
});

describe('paginateRows', () => {
  const list = Array.from({ length: 25 }, (_, i) => i + 1);
  it('slices the current page', () => {
    expect(paginateRows(list, 1, 10)).toHaveLength(10);
    expect(paginateRows(list, 3, 10)).toEqual([21, 22, 23, 24, 25]);
    expect(paginateRows(list, 4, 10)).toEqual([]);
  });
});

describe('computeProfitBounds', () => {
  it('returns min/max of netProfit', () => {
    expect(computeProfitBounds(rows)).toEqual({ min: -500, max: 5000 });
  });

  it('returns null for empty data', () => {
    expect(computeProfitBounds([])).toBeNull();
    expect(computeProfitBounds(null)).toBeNull();
  });
});

describe('renderPageItems', () => {
  it('keeps first/last and current ± 1', () => {
    expect(renderPageItems(1, 3)).toEqual([1, 2, 3]);
    expect(renderPageItems(1, 10)).toEqual([1, 2, '...', 10]);
    expect(renderPageItems(5, 10)).toEqual([1, '...', 4, 5, 6, '...', 10]);
    expect(renderPageItems(10, 10)).toEqual([1, '...', 9, 10]);
  });
});

describe('export mapping', () => {
  it('has typed numeric/currency columns so sheets total correctly', () => {
    expect(LEDGER_EXPORT_COLUMNS.map((c) => c.type || 'text')).toEqual([
      'text',
      'text',
      'text',
      'text',
      'text',
      'number',
      'currency',
      'currency',
      'currency',
      'number',
    ]);
  });

  it('maps rows with fallbacks', () => {
    const out = mapLedgerRowForExport({
      tripNumber: 'T-1',
      tripDate: '2026-08-15T00:00:00Z',
      driver: { fullName: 'Asha' },
      vehicle: { registrationNumber: 'KA-01' },
      route: { name: 'R1' },
      weights: { netWeight: 100 },
      performance: { totalRevenue: 1000, totalExpense: 400, netProfit: 600, profitMargin: 12.345 },
    });
    expect(out).toEqual({
      tripNumber: 'T-1',
      tripDate: '15/08/2026',
      driver: 'Asha',
      vehicle: 'KA-01',
      route: 'R1',
      netWeight: 100,
      revenue: 1000,
      expense: 400,
      profit: 600,
      margin: 12.35,
    });
  });

  it('maps empty rows without crashing', () => {
    const out = mapLedgerRowForExport({});
    expect(out.tripNumber).toBe('-');
    expect(out.netWeight).toBeNull();
    expect(out.margin).toBeNull();
  });
});

describe('ledgerExportMeta', () => {
  it('describes active filters only', () => {
    const meta = ledgerExportMeta({
      selectedDriver: 'Asha',
      selectedVehicle: 'all',
      selectedRoute: 'R1',
      profitRange: [0, 100],
      minProfit: -10,
      maxProfit: 200,
    });
    expect(meta.filters).toEqual([
      { label: 'Driver', value: 'Asha' },
      { label: 'Route', value: 'R1' },
      { label: 'Profit range', value: '₹0 - ₹100' },
    ]);
  });

  it('omits the default profit window', () => {
    const meta = ledgerExportMeta({ profitRange: [-10, 200], minProfit: -10, maxProfit: 200 });
    expect(meta.filters).toEqual([]);
  });
});
