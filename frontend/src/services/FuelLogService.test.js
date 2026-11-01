import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from '../utils/axiosConfig';
import FuelLogService from './FuelLogService';

vi.mock('../utils/axiosConfig', () => ({ default: { post: vi.fn(), get: vi.fn() } }));
const payload = {
  vehicleId: 'v1',
  driverId: 'd1',
  fuelType: 'DIESEL',
  fillingType: 'PARTIAL',
  litres: 40,
  refuelTime: '2026-10-31T04:30:00Z',
};
const photo = { file: new File(['photo'], 'bill.jpg', { type: 'image/jpeg' }) };

describe('manual diesel save service', () => {
  beforeEach(() => vi.clearAllMocks());
  it('sends one request when no receipt is attached', async () => {
    apiClient.post.mockResolvedValue({ data: { data: { id: 'fill1' } } });
    const signal = new AbortController().signal;
    await expect(
      FuelLogService.submitEntry({ payload, documents: {} }, { signal }),
    ).resolves.toEqual({ id: 'fill1' });
    expect(apiClient.post).toHaveBeenCalledTimes(1);
    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/mileage/fuel-log',
      payload,
      expect.objectContaining({ signal }),
    );
  });
  it('links uploaded photos and never sends an odometer photo from a hidden partial field', async () => {
    apiClient.post
      .mockResolvedValueOnce({ data: { data: { _id: 'doc1' } } })
      .mockResolvedValueOnce({ data: { data: { id: 'fill1' } } });
    await FuelLogService.submitEntry({ payload, documents: { fuel: photo, odometer: photo } });
    expect(apiClient.post).toHaveBeenCalledTimes(2);
    expect(apiClient.post.mock.calls[1][1]).toEqual({ ...payload, documentId: 'doc1' });
  });
  it('stops after upload if navigating away cancels the save', async () => {
    const controller = new AbortController();
    apiClient.post.mockImplementationOnce(async () => {
      controller.abort();
      return { data: { data: { _id: 'doc1' } } };
    });
    await expect(
      FuelLogService.submitEntry(
        { payload, documents: { fuel: photo } },
        { signal: controller.signal },
      ),
    ).rejects.toThrow();
    expect(apiClient.post).toHaveBeenCalledTimes(1);
  });
  it('keeps the server error available when a save fails', async () => {
    apiClient.post.mockRejectedValue({
      response: { status: 409, data: { message: 'Duplicate fill' } },
    });
    await expect(FuelLogService.submitEntry({ payload })).rejects.toMatchObject({
      status: 409,
      displayMessage: 'Duplicate fill',
    });
  });
});
