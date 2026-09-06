import { describe, it, expect } from 'vitest';
import { escapeCsvCell, cellValue, metaRows } from './exportTable';

describe('escapeCsvCell', () => {
  it('passes plain values through', () => {
    expect(escapeCsvCell('WB25W1040')).toBe('WB25W1040');
    expect(escapeCsvCell(42)).toBe('42');
  });

  it('quotes cells containing commas, quotes or newlines', () => {
    expect(escapeCsvCell('a,b')).toBe('"a,b"');
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvCell('line1\nline2')).toBe('"line1\nline2"');
  });

  it('maps null/undefined to empty string', () => {
    expect(escapeCsvCell(null)).toBe('');
    expect(escapeCsvCell(undefined)).toBe('');
  });
});

describe('cellValue', () => {
  it('returns numbers for number/currency types', () => {
    expect(cellValue('1234.5', 'number')).toBe(1234.5);
    expect(cellValue(482350, 'currency')).toBe(482350);
  });

  it('returns null for non-numeric number input — never NaN on the sheet', () => {
    expect(cellValue('abc', 'number')).toBeNull();
    expect(cellValue('', 'currency')).toBeNull();
  });

  it('returns Dates for date types and null for garbage', () => {
    const d = cellValue('2026-09-06', 'date');
    expect(d).toBeInstanceOf(Date);
    expect(Number.isNaN(d.getTime())).toBe(false);
    expect(cellValue('not a date', 'date')).toBeNull();
  });

  it('stringifies text and preserves 0 as a real value', () => {
    expect(cellValue(0, 'number')).toBe(0);
    expect(cellValue('ACTIVE', 'text')).toBe('ACTIVE');
  });

  it('returns null for absent values of any type', () => {
    expect(cellValue(null, 'text')).toBeNull();
    expect(cellValue(undefined, 'number')).toBeNull();
  });
});

describe('metaRows', () => {
  it('emits one row per filter plus generation time and a separator', () => {
    const rows = metaRows({
      filters: [{ label: 'Period', value: '1–7 Sep' }, { label: 'Status', value: 'Moving' }],
      generatedAt: new Date('2026-09-06T10:00:00+05:30'),
    });
    expect(rows[0][0]).toBe('Period: 1–7 Sep');
    expect(rows[1][0]).toBe('Status: Moving');
    expect(rows[2][0]).toMatch(/^Generated: .* IST$/);
    expect(rows[3]).toEqual(['']);
  });

  it('emits nothing for empty meta', () => {
    expect(metaRows()).toEqual([]);
    expect(metaRows({})).toEqual([]);
  });

  it('skips malformed filters and invalid dates', () => {
    const rows = metaRows({ filters: [null, { value: 'no label' }, { label: 'OK', value: null }], generatedAt: 'garbage' });
    expect(rows).toEqual([['OK: —']]);
  });
});
