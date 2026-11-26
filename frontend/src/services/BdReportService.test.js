import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from '../utils/axiosConfig';
import {
  BdReportService,
  BD_REPORT_MANAGER_ROLES,
  filenameFromDisposition,
} from './BdReportService';

vi.mock('../utils/axiosConfig', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

describe('BD report service (spec 2 / D3)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('asks for one kind and unwraps the standard envelope', async () => {
    const rows = [{ _id: 'r1', kind: 'OIL', day: '2026-11-25', rows: 10, flagged: 0 }];
    apiClient.get.mockResolvedValue({ data: { data: rows } });

    await expect(BdReportService.list('OIL')).resolves.toEqual(rows);
    expect(apiClient.get).toHaveBeenCalledWith('/api/bd-reports', {
      params: { kind: 'OIL' },
      signal: undefined,
    });
  });

  it('returns an empty list when the body is not an array', async () => {
    apiClient.get.mockResolvedValue({ data: { data: null } });
    await expect(BdReportService.list('DEF')).resolves.toEqual([]);
  });

  it('builds one day of one kind', async () => {
    apiClient.post.mockResolvedValue({ data: { data: { _id: 'r2' } } });

    await expect(BdReportService.build({ day: '2026-11-25', kind: 'DEF' })).resolves.toEqual({
      _id: 'r2',
    });
    expect(apiClient.post).toHaveBeenCalledWith('/api/bd-reports/build', {
      day: '2026-11-25',
      kind: 'DEF',
    });
  });

  it('throws a typed error when the list fails', async () => {
    apiClient.get.mockRejectedValue({ response: { status: 500, data: { message: 'boom' } } });
    await expect(BdReportService.list('OIL')).rejects.toThrow(/boom|server|error/i);
  });
});

describe('BD report download (spec 2 / D6)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requests the file as a blob and takes the name from Content-Disposition', async () => {
    const blob = new Blob(['xlsx']);
    apiClient.get.mockResolvedValue({
      data: blob,
      headers: { 'content-disposition': 'attachment; filename="bd-oil-2026-11-25.xlsx"' },
    });

    const result = await BdReportService.download('r1', { fallbackName: 'fallback.xlsx' });
    expect(apiClient.get).toHaveBeenCalledWith('/api/bd-reports/r1/download', {
      responseType: 'blob',
      signal: undefined,
    });
    expect(result.blob).toBe(blob);
    expect(result.fileName).toBe('bd-oil-2026-11-25.xlsx');
  });

  it('falls back to the report fileName when the server sends no header', async () => {
    apiClient.get.mockResolvedValue({ data: new Blob(['xlsx']), headers: {} });
    const result = await BdReportService.download('r1', { fallbackName: 'bd-def.xlsx' });
    expect(result.fileName).toBe('bd-def.xlsx');
  });

  it('reads the RFC 5987 file name form', () => {
    expect(
      filenameFromDisposition("attachment; filename*=UTF-8''bd%20oil.xlsx"),
    ).toBe('bd oil.xlsx');
    expect(filenameFromDisposition(null)).toBeNull();
    expect(filenameFromDisposition('attachment')).toBeNull();
  });
});

describe('BD report roles (spec 2 / D2)', () => {
  it('names the manager+ roles the app already uses', () => {
    expect(BD_REPORT_MANAGER_ROLES).toEqual(['OWNER', 'MANAGER']);
  });
});
