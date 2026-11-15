import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../utils/axiosConfig', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

import apiClient from '../../utils/axiosConfig';
import PhotoImportService from '../PhotoImportService';

const photo = (name) => new File(['x'], name, { type: 'image/jpeg' });

describe('PhotoImportService — upload, read back, decide', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiClient.post.mockResolvedValue({ data: { status: 'success', data: { batchId: 'b1' } } });
    apiClient.get.mockResolvedValue({ data: { status: 'success', data: [] } });
  });

  it('starts a batch with every photo as a multipart file', async () => {
    const res = await PhotoImportService.start({ files: [photo('a.jpg'), photo('b.jpg')] });
    expect(apiClient.post.mock.calls[0][0]).toBe('/api/photo-imports');
    const body = apiClient.post.mock.calls[0][1];
    expect(body).toBeInstanceOf(FormData);
    expect(body.getAll('files')).toHaveLength(2);
    expect(res.batchId).toBe('b1');
  });

  it('carries the per-photo hint only when the operator gave one', async () => {
    await PhotoImportService.start({
      files: [photo('a.jpg'), photo('b.jpg')],
      uploadedAs: { 'b.jpg': 'odometer' },
    });
    const body = apiClient.post.mock.calls[0][1];
    expect(JSON.parse(body.get('uploadedAs'))).toEqual([{ fileName: 'b.jpg', kind: 'odometer' }]);
  });

  it('puts a retaken photo back into the batch it came from', async () => {
    await PhotoImportService.reupload({ batchId: 'b1', file: photo('a.jpg') });
    const body = apiClient.post.mock.calls[0][1];
    expect(body.get('batchId')).toBe('b1');
    expect(body.getAll('files')).toHaveLength(1);
  });

  it('reads the batch and the driver periods from their own routes', async () => {
    await PhotoImportService.getBatch('b1');
    expect(apiClient.get.mock.calls[0][0]).toBe('/api/photo-imports/b1');
    await PhotoImportService.getDriverPeriods('b1');
    expect(apiClient.get.mock.calls[1][0]).toBe('/api/photo-imports/b1/driver-periods');
  });

  it('confirms one period at a time, or the whole batch', async () => {
    await PhotoImportService.confirmDriverPeriods('b1', {
      items: [{ periodId: 'p1', action: 'confirm' }],
    });
    expect(apiClient.post.mock.calls[0][0]).toBe('/api/photo-imports/b1/driver-periods/confirm');
    expect(apiClient.post.mock.calls[0][1]).toEqual({
      items: [{ periodId: 'p1', action: 'confirm' }],
    });
    await PhotoImportService.confirmDriverPeriods('b1', { all: true });
    expect(apiClient.post.mock.calls[1][1]).toEqual({ all: true });
  });

  it('an empty list comes back as an array, so the page renders', async () => {
    await expect(PhotoImportService.getDriverPeriods('b1')).resolves.toEqual([]);
    await expect(PhotoImportService.listBatches()).resolves.toEqual([]);
    await expect(PhotoImportService.listDrivers()).resolves.toEqual([]);
  });
});
