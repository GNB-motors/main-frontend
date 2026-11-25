import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import exportTable, { buildTableFile } from './exportTable';

/** The bytes of a blob, so two files can be compared exactly. */
const readBytes = (blob) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result));
    reader.readAsArrayBuffer(blob);
  });

const input = (format) => ({
  rows: [
    { reg: 'WB25W1040', amount: 1200, note: '=1+1' },
    { reg: 'OD02K5567', amount: 900, note: 'plain' },
  ],
  columns: [
    { key: 'reg', label: 'Vehicle' },
    { key: 'amount', label: 'Amount', type: 'currency' },
    { key: 'note', label: 'Note' },
  ],
  filename: 'fuel-spend',
  format,
  meta: {
    filters: [{ label: 'Period', value: '1–7 Sep' }],
    generatedAt: new Date('2026-09-06T10:00:00.000Z'),
  },
});

describe('exportTable — buildTableFile (spec 1)', () => {
  let downloaded;

  beforeEach(() => {
    downloaded = [];
    URL.createObjectURL = vi.fn((blob) => {
      downloaded.push(blob);
      return 'blob:test';
    });
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  it('spec 1: buildTableFile returns the same CSV bytes and filename exportTable downloads', async () => {
    const file = await buildTableFile(input('csv'));
    const result = await exportTable(input('csv'));

    expect(result).toEqual({ format: 'csv', rows: 2 });
    expect(downloaded).toHaveLength(1);
    expect(file.filename).toBe('fuel-spend-2026-09-06.csv');
    expect(file.rows).toBe(2);
    expect(file.blob.type).toBe('text/csv;charset=utf-8');
    expect(await readBytes(file.blob)).toEqual(await readBytes(downloaded[0]));

    // `ignoreBOM: true` keeps the BOM in the decoded text (the default strips it).
    const text = new TextDecoder('utf-8', { ignoreBOM: true }).decode(
      await readBytes(file.blob),
    );
    // The BOM Excel needs to read a UTF-8 CSV.
    expect(text.charCodeAt(0)).toBe(0xfeff);
    expect(text).toContain('Vehicle,Amount,Note');
    // Formula neutralisation survives the split into its own builder.
    expect(text).toContain("'=1+1");
  });

  it('spec 1: buildTableFile returns the same workbook bytes exportTable downloads', async () => {
    const file = await buildTableFile(input('xlsx'));
    const result = await exportTable(input('xlsx'));

    expect(result).toEqual({ format: 'xlsx', rows: 2 });
    expect(downloaded).toHaveLength(1);
    expect(file.filename).toBe('fuel-spend-2026-09-06.xlsx');
    expect(file.blob.type).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(await readBytes(file.blob)).toEqual(await readBytes(downloaded[0]));
  });

  it('spec 1: a table with no rows is still a file', async () => {
    const file = await buildTableFile({
      rows: [],
      columns: [{ key: 'reg', label: 'Vehicle' }],
      filename: 'empty',
    });
    expect(file.rows).toBe(0);
    expect(file.filename).toBe(`empty-${new Date().toISOString().slice(0, 10)}.xlsx`);
  });
});
