import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { exportFilteredReportCsv } from './reportCsvExport';

vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

describe('exportFilteredReportCsv — server export', () => {
  let saved;

  beforeEach(() => {
    saved = [];
    URL.createObjectURL = vi.fn((blob) => {
      saved.push(blob);
      return 'blob:test';
    });
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  it('saves a workbook the server built as-is', async () => {
    const workbook = new Blob([new Uint8Array([0x50, 0x4b, 0x03, 0x04])], { type: XLSX_TYPE });
    await exportFilteredReportCsv({
      fetchExport: async () => workbook,
      filenamePrefix: 'mileage_report',
      extension: 'xlsx',
      showToast: false,
    });
    expect(saved).toHaveLength(1);
    expect(saved[0]).toBe(workbook);
  });

  it('turns a server CSV into a real workbook', async () => {
    const text = 'Vehicle,Km\nWB25R9540,120\n';
    const csv = new Blob([text], { type: 'text/csv' });
    // jsdom's Blob has no text().
    csv.text = async () => text;
    await exportFilteredReportCsv({
      fetchExport: async () => csv,
      filenamePrefix: 'fuel_cycles_report',
      extension: 'xlsx',
      showToast: false,
    });
    expect(saved).toHaveLength(1);
    expect(saved[0]).not.toBe(csv);
    expect(saved[0].type).toBe(XLSX_TYPE);
    const bytes = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(new Uint8Array(reader.result));
      reader.readAsArrayBuffer(saved[0]);
    });
    // A zip (xlsx) starts with "PK".
    expect([bytes[0], bytes[1]]).toEqual([0x50, 0x4b]);
  });
});
