import { describe, it, expect } from 'vitest';
import { compareSap, verdictView, canEditSap, sheetCsv } from './sapModel';
import { laneRow } from '../Reports/reports/laneKmReportUtils';
import { autoTripSchema } from '../../schemas/autoTrip.schema';
describe('SAP comparisons', () => {
  it('uses inclusive tolerance boundaries and distinguishes missing km from under SAP', () => {
    expect(compareSap(110, 100).verdict).toBe('WITHIN');
    expect(compareSap(90, 100).verdict).toBe('WITHIN');
    expect(compareSap(111, 100)).toMatchObject({ verdict: 'OVER', deltaPct: 11, deltaKm: 11 });
    expect(compareSap(88, 100).verdict).toBe('UNDER');
    for (const actual of [null, undefined, 0, 9])
      expect(compareSap(actual, 100).verdict).toBe('NO_KM');
    expect(compareSap(100, null).verdict).toBe('NO_KM');
    expect(verdictView({ verdict: 'WITHIN' }, 15).text).toBe('Within 15%');
    expect(verdictView({ verdict: 'UNDER', deltaPct: -12 }).text).toBe('−12%');
  });
  it('allows only the two SAP editor roles', () => {
    expect(canEditSap('OWNER')).toBe(true);
    expect(canEditSap('MANAGER')).toBe(true);
    for (const role of ['SUPER_ADMIN', 'USER', 'DRIVER', undefined])
      expect(canEditSap(role)).toBe(false);
  });
  it('compares GPS rather than refuel cycles and obeys server verdict and policy', () => {
    const row = {
      id: 'lane',
      fromLabel: 'OCL',
      toLabel: 'TOWN',
      sapValues: [100, 200],
      gps: { medianLadenKm: 105, n: 10, trucks: 3 },
      register: { medianKm: 400, n: 50 },
      verdict: 'WITHIN',
    };
    expect(laneRow(row)).toMatchObject({
      id: 'lane',
      gpsKm: 105,
      measuredKm: 400,
      trips: 10,
      trucks: 3,
      verdict: 'MATCHES',
      extraTotal: 0,
    });
    expect(laneRow({ ...row, multiValuePolicy: 'MAX', verdict: 'UNDER' })).toMatchObject({
      verdict: 'UNDER_SAP',
      extraTotal: 0,
    });
    expect(
      laneRow({ ...row, gps: { medianLadenKm: null, n: 0 }, verdict: 'NO_GPS' }),
    ).toMatchObject({ verdict: 'THIN', extraTotal: null });
  });
  it('accepts old trips and retains SAP, return and v5 economics', () => {
    expect(autoTripSchema.safeParse({ _id: 'old' }).success).toBe(true);
    expect(
      autoTripSchema.parse({
        _id: 'new',
        km: { return: 80 },
        sap: { status: 'MATCHED', sapKm: 100, oneWay: { verdict: 'WITHIN' } },
        roleEconomics: { return: { km: 80 } },
      }),
    ).toMatchObject({
      km: { return: 80 },
      sap: { sapKm: 100 },
      roleEconomics: { return: { km: 80 } },
    });
  });
  it('reads CSV text and converts only the first workbook sheet', async () => {
    expect(
      await sheetCsv({ name: 'sheet.csv', text: async () => 'FROM,TO,SAP\nA,B,20' }),
    ).toContain('A,B,20');
    const XLSX = await import('xlsx');
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      book,
      XLSX.utils.aoa_to_sheet([
        ['FROM', 'TO', 'SAP'],
        ['A', 'B', 20],
      ]),
      'first',
    );
    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([['WRONG']]), 'second');
    const csv = await sheetCsv({
      name: 'sheet.xlsx',
      arrayBuffer: async () => XLSX.write(book, { type: 'array', bookType: 'xlsx' }),
    });
    expect(csv).toContain('FROM,TO,SAP');
    expect(csv).toContain('A,B,20');
    expect(csv).not.toContain('WRONG');
    await expect(sheetCsv({ name: 'bad.pdf' })).rejects.toThrow('CSV or XLSX');
  });
});
