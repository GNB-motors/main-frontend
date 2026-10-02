import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { csvTextToXlsxBuffer } from './reportCsvExport';

const readBack = (buffer) => {
  const wb = XLSX.read(buffer, { type: 'array' });
  return wb.Sheets[wb.SheetNames[0]];
};

describe('csvTextToXlsxBuffer', () => {
  const csv = [
    'Start Date,Vehicle,Distance (km),Cost (₹),Driver',
    "08/07/2026,OD02K5567,896,21214,'=1+1",
  ].join('\n');

  it('produces a real workbook, not CSV bytes', () => {
    const sheet = readBack(csvTextToXlsxBuffer(csv));
    expect(sheet.A1.v).toBe('Start Date');
    expect(sheet.D1.v).toBe('Cost (₹)');
  });

  it('keeps dd/mm/yyyy dates as text so they are never read as mm/dd', () => {
    const sheet = readBack(csvTextToXlsxBuffer(csv));
    expect(sheet.A2.t).toBe('s');
    expect(sheet.A2.v).toBe('08/07/2026');
  });

  it('turns plain numbers back into numeric cells', () => {
    const sheet = readBack(csvTextToXlsxBuffer(csv));
    expect(sheet.C2).toMatchObject({ t: 'n', v: 896 });
    expect(sheet.D2).toMatchObject({ t: 'n', v: 21214 });
  });

  it('leaves the server formula-injection guard intact', () => {
    const sheet = readBack(csvTextToXlsxBuffer(csv));
    expect(sheet.E2.t).toBe('s');
    expect(sheet.E2.v).toBe("'=1+1");
  });
});
