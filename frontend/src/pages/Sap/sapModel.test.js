import { describe, it, expect } from 'vitest';
import { verdictView, canEditSap, sheetCsv, hintText, SAP_REASONS } from './sapModel';
import { autoTripSchema } from '../../schemas/autoTrip.schema';
describe('SAP model', () => {
  it('turns a verdict into a pill', () => {
    expect(verdictView({ verdict: 'WITHIN' }, 15).text).toBe('Within 15%');
    expect(verdictView({ verdict: 'UNDER', deltaPct: -12 }).text).toBe('−12%');
    expect(verdictView({ verdict: 'OVER', deltaPct: 7.5 })).toEqual({
      tone: 'over',
      text: '+7.5%',
    });
    expect(verdictView({ verdict: 'NO_KM' }).tone).toBe('none');
  });
  it('allows only the two SAP editor roles', () => {
    expect(canEditSap('OWNER')).toBe(true);
    expect(canEditSap('MANAGER')).toBe(true);
    for (const role of ['SUPER_ADMIN', 'USER', 'DRIVER', undefined])
      expect(canEditSap(role)).toBe(false);
  });
  it('explains every no-SAP reason, old snapshots included', () => {
    for (const s of ['NO_DROP', 'NO_PLACE', 'NO_ROUTE_SAP', 'NO_LANE', 'DROP_UNNAMED'])
      expect(SAP_REASONS[s]).toBeTruthy();
  });
  it('words the road hint, and says nothing without a road', () => {
    expect(hintText(null, 212)).toBeNull();
    expect(hintText({ shortestOneWayKm: null }, 212)).toBeNull();
    expect(hintText({ shortestOneWayKm: 207 }, null)).toBe('Shortest truck road: 207 km one way.');
    expect(hintText({ shortestOneWayKm: 207, suggestion: { basis: 'ONE_WAY' } }, 212)).toBe(
      'Shortest truck road: 207 km one way. 212 km looks like one way.',
    );
    expect(
      hintText(
        {
          shortestOneWayKm: 150,
          suggestion: { basis: 'ROUND_TRIP', belowShortest: true, shortfallKm: 20 },
        },
        280,
      ),
    ).toContain('20 km below the shortest road');
    expect(hintText({ shortestOneWayKm: 207, suggestion: { basis: 'UNKNOWN' } }, 300)).toContain(
      'neither close to one way nor to round trip',
    );
  });
  it('accepts old trips and the route-based SAP snapshot', () => {
    expect(autoTripSchema.safeParse({ _id: 'old', sap: { status: 'NO_LANE' } }).success).toBe(true);
    expect(
      autoTripSchema.parse({
        _id: 'new',
        km: { return: 80 },
        sap: {
          status: 'MATCHED',
          sapKm: 100,
          basis: 'ROUND_TRIP',
          comparison: { verdict: 'WITHIN' },
          verdict: 'WITHIN',
        },
      }),
    ).toMatchObject({ km: { return: 80 }, sap: { sapKm: 100, basis: 'ROUND_TRIP' } });
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
    expect(csv).toContain('A,B,20');
    expect(csv).not.toContain('WRONG');
    await expect(sheetCsv({ name: 'bad.pdf' })).rejects.toThrow('CSV or XLSX');
  });
});
