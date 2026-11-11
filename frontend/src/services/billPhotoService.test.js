import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from '../utils/axiosConfig';
import service, { uploadBillPhoto } from './billPhotoService';

vi.mock('../utils/axiosConfig', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

describe('bill photo upload', () => {
  beforeEach(() => vi.clearAllMocks());
  it('uses the fuel capture endpoint and returns its persisted log and review result', async () => {
    const body = new FormData();
    body.append('vehicleId', 'vehicle-one');
    body.append('fuelType', 'DIESEL');
    body.append('fillingType', 'PARTIAL');
    body.append('fuelPhoto', new File(['bill'], 'bill.jpg', { type: 'image/jpeg' }));
    const signal = new AbortController().signal;
    const saved = {
      id: 'log-one',
      reviewStatus: 'NEEDS_REVIEW',
      reviewReasons: ['VEHICLE_NO_MISMATCH'],
    };
    apiClient.post.mockResolvedValue({ data: { status: 'success', data: saved } });

    await expect(uploadBillPhoto({ body, signal })).resolves.toEqual(saved);
    expect(apiClient.post).toHaveBeenCalledWith('/api/mileage/fuel-log/from-photo', body, {
      signal,
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });
  });
});

describe('fleet bill API', () => {
  beforeEach(() => vi.clearAllMocks());
  it('uses the fleet routes and their exact bodies', async () => {
    apiClient.post.mockResolvedValue({ data: { data: { capture: { id: 'cap' }, links: [] } } });
    apiClient.get.mockResolvedValue({ data: { data: { captures: [], entries: [] } } });
    apiClient.patch.mockResolvedValue({ data: { data: { captureId: 'cap' } } });
    const body = new FormData();
    body.append('pages', new File(['a'], 'bill.jpg'));
    body.append('clientId', 'client');
    body.append('vehicleHint', 'A');
    expect(await service.uploadBillCapture({ body, clientId: 'client' })).toEqual({ id: 'cap' });
    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/fleet-view/bills/captures',
      body,
      expect.objectContaining({ headers: { 'Idempotency-Key': 'client' } }),
    );
    await service.listBillCaptures({ status: 'submitted', uploaderRole: 'OWNER,MANAGER', page: 2, limit: 50 });
    expect(apiClient.get).toHaveBeenCalledWith(
      '/api/fleet-view/bills',
      expect.objectContaining({ params: { status: 'submitted', uploaderRole: 'OWNER,MANAGER', page: 2, limit: 50 } }),
    );
    await service.getBillPage('cap', 0);
    expect(apiClient.get).toHaveBeenCalledWith(
      '/api/fleet-view/bills/cap/pages/0',
      expect.objectContaining({ responseType: 'blob' }),
    );
    await service.saveBillLinks([{ captureId: 'cap', registrationNumber: 'A', reason: null }]);
    expect(apiClient.post).toHaveBeenCalledWith('/api/fleet-view/bills/confirmations', {
      links: [{ captureId: 'cap', registrationNumber: 'A', reason: null }],
    });
    await service.editBillLink('cap', { registrationNumber: 'B', reason: 'fix' });
    expect(apiClient.patch).toHaveBeenCalledWith('/api/fleet-view/bills/cap/link', {
      registrationNumber: 'B',
      reason: 'fix',
    });
    await service.getBillLinkHistory('cap');
    expect(apiClient.get).toHaveBeenCalledWith(
      '/api/fleet-view/bills/cap/history',
      expect.any(Object),
    );
  });
});
