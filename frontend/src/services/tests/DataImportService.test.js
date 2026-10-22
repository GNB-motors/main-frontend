import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../utils/axiosConfig', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));

import apiClient from '../../utils/axiosConfig';
import DataImportService from '../DataImportService';

const file = new File(['Truck No,From Dt\n'], 'pairings.csv', { type: 'text/csv' });

const report = {
  dryRun: true,
  counts: { rowsRead: 2, rowsReady: 1, rowsRejected: 1, rowsConflicted: 0 },
  unmappedColumns: [{ header: 'Remarks', rowsWithValue: 1 }],
  rejected: [{ line: 3, code: 'DRIVER_NOT_FOUND', detail: '999' }],
  conflicts: [],
};

describe('DataImportService — dry run and apply are different calls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiClient.post.mockResolvedValue({ data: { status: 'success', data: report } });
    apiClient.get.mockResolvedValue({ data: { status: 'success', data: [] } });
  });

  it('the preview goes to /preview and returns the report', async () => {
    const res = await DataImportService.preview({ file, entity: 'ASSIGNMENTS' });
    expect(apiClient.post.mock.calls[0][0]).toBe('/api/data-imports/preview');
    expect(res.counts.rowsReady).toBe(1);
    expect(res.rejected[0].code).toBe('DRIVER_NOT_FOUND');
  });

  it('the preview sends the file as multipart, not as a JSON body', async () => {
    await DataImportService.preview({ file, entity: 'ASSIGNMENTS' });
    const body = apiClient.post.mock.calls[0][1];
    expect(body).toBeInstanceOf(FormData);
    expect(body.get('entity')).toBe('ASSIGNMENTS');
    expect(body.get('file')).toBe(file);
  });

  it('the declared mapping and resolvers travel with the file', async () => {
    await DataImportService.preview({
      file,
      entity: 'ASSIGNMENTS',
      mapping: { 'Truck No': 'vehicleRef' },
      resolvers: { vehicleRef: 'REGISTRATION' },
    });
    const body = apiClient.post.mock.calls[0][1];
    expect(JSON.parse(body.get('mapping'))).toEqual({ 'Truck No': 'vehicleRef' });
    expect(JSON.parse(body.get('resolvers'))).toEqual({ vehicleRef: 'REGISTRATION' });
  });

  it('apply is a separate, explicit call — it never fires on upload', async () => {
    await DataImportService.preview({ file, entity: 'ASSIGNMENTS' });
    expect(apiClient.post).toHaveBeenCalledTimes(1);
    await DataImportService.apply({ file, entity: 'ASSIGNMENTS' });
    expect(apiClient.post.mock.calls[1][0]).toBe('/api/data-imports/apply');
  });

  it('uploads get a budget beyond the 30s default', async () => {
    await DataImportService.apply({ file, entity: 'VEHICLE_MASTER' });
    expect(apiClient.post.mock.calls[0][2].timeout).toBeGreaterThan(30000);
  });

  it('saving a mapping is bound to the header row it was built for', async () => {
    apiClient.put.mockResolvedValue({ data: { status: 'success', data: {} } });
    await DataImportService.saveMapping('ASSIGNMENTS', {
      headers: ['Truck No', 'From Dt'],
      mapping: { 'Truck No': 'vehicleRef' },
      resolvers: { vehicleRef: 'REGISTRATION' },
    });
    expect(apiClient.put).toHaveBeenCalledWith('/api/data-imports/mappings/ASSIGNMENTS', {
      headers: ['Truck No', 'From Dt'],
      mapping: { 'Truck No': 'vehicleRef' },
      resolvers: { vehicleRef: 'REGISTRATION' },
    });
  });

  it('an empty run list comes back as an array, so the page renders', async () => {
    await expect(DataImportService.listMappings()).resolves.toEqual([]);
  });
});
