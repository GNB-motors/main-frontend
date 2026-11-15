import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from '../../utils/axiosConfig';
import { getKnownEtas } from '../etaService';

vi.mock('../../utils/axiosConfig', () => ({ default: { get: vi.fn() } }));

describe('known destination ETA service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('reads the rows the backend sent', async () => {
    apiClient.get.mockResolvedValue({ data: { data: [{ registrationNumber: 'MH12AB1234' }] } });
    await expect(getKnownEtas()).resolves.toHaveLength(1);
    expect(apiClient.get).toHaveBeenCalledWith('/api/eta/known', expect.objectContaining({ signal: undefined }));
  });

  it('returns nothing when the backend has no such endpoint yet', async () => {
    apiClient.get.mockRejectedValue(
      Object.assign(new Error('Not found'), { response: { status: 404 } }),
    );
    await expect(getKnownEtas()).resolves.toEqual([]);
  });

  it('returns nothing when the endpoint is closed to this role', async () => {
    apiClient.get.mockRejectedValue(
      Object.assign(new Error('Forbidden'), { response: { status: 403 } }),
    );
    await expect(getKnownEtas()).resolves.toEqual([]);
  });
});
