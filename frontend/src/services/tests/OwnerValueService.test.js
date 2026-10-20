import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../utils/axiosConfig', () => ({ default: { get: vi.fn() } }));

import apiClient from '../../utils/axiosConfig';
import OwnerValueService from '../OwnerValueService';

const ok = (data) => Promise.resolve({ data: { status: 'success', data } });
const httpError = (status) =>
  Object.assign(new Error(`Request failed with status code ${status}`), {
    response: { status, data: { message: `HTTP ${status}` } },
  });

describe('OwnerValueService.getDigest', () => {
  beforeEach(() => vi.clearAllMocks());

  // B1: the Daily Digest used to open with eight owner-value requests.
  it('asks for every section in one request', async () => {
    apiClient.get.mockReturnValue(ok({ money: { money: {} }, errors: {} }));
    const { signal } = new AbortController();
    const out = await OwnerValueService.getDigest({ from: '2026-10-12T18:30:00.000Z' }, signal);
    expect(apiClient.get).toHaveBeenCalledTimes(1);
    expect(apiClient.get).toHaveBeenCalledWith('/api/owner-value/digest', {
      params: { from: '2026-10-12T18:30:00.000Z', efficiencyDays: 7, calendarDays: 14 },
      signal,
    });
    expect(out).toEqual({ money: { money: {} }, errors: {} });
  });

  it('builds the same shape from the section endpoints on a backend without /digest', async () => {
    apiClient.get.mockImplementation((url, { params } = {}) => {
      if (url === '/api/owner-value/digest') return Promise.reject(httpError(404));
      if (url === '/api/owner-value/health-score') return Promise.reject(httpError(500));
      return ok({ url, params });
    });
    const out = await OwnerValueService.getDigest({ from: 'F' });
    expect(apiClient.get).toHaveBeenCalledTimes(9);
    expect(out.money).toEqual({ url: '/api/owner-value/money', params: { from: 'F' } });
    expect(out.fuelEfficiency).toEqual({
      url: '/api/owner-value/fuel-efficiency',
      params: { days: 7 },
    });
    expect(out.fleetCalendar.params).toEqual({ days: 14 });
    expect(out.healthScore).toBeNull();
    expect(out.errors).toEqual({ healthScore: 'HTTP 500' });
  });

  it('surfaces other failures as an ApiError', async () => {
    apiClient.get.mockReturnValue(Promise.reject(httpError(403)));
    await expect(OwnerValueService.getDigest()).rejects.toMatchObject({
      name: 'ApiError',
      status: 403,
    });
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });
});
