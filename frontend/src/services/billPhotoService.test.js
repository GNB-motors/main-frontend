import { describe, expect, it, vi } from 'vitest';
import apiClient from '../utils/axiosConfig';
import { uploadBillPhoto } from './billPhotoService';

vi.mock('../utils/axiosConfig', () => ({ default: { post: vi.fn() } }));

describe('bill photo upload', () => {
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
