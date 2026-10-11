import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../utils/axiosConfig', () => ({ default: { get: vi.fn() } }));
vi.mock('../../utils/session.js', () => ({
  getUserId: vi.fn(() => 'u1'),
  getOrgId: vi.fn(() => 'org1'),
  getBranchId: vi.fn(() => null),
}));

import apiClient from '../../utils/axiosConfig';
import { getOrgId, getBranchId } from '../../utils/session.js';
import ApiError from '../../errors/ApiError';
import { getVehicleList, invalidateVehicleList } from '../vehicleListService';

const row = (i) => ({ _id: `v${i}`, registrationNumber: `WB${String(i).padStart(4, '0')}` });
const page = (rows, pageNo, totalPages) => ({
  data: { status: 'success', data: rows, meta: { page: pageNo, totalPages } },
});
const fleet = [row(1), row(2)];
const notFound = () =>
  Object.assign(new Error('Request failed with status code 404'), { response: { status: 404 } });

describe('vehicleListService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateVehicleList();
    getOrgId.mockReturnValue('org1');
    getBranchId.mockReturnValue(null);
    apiClient.get.mockResolvedValue(page(fleet, 1, 1));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('asks the slim options endpoint for the first page of 500', async () => {
    expect(await getVehicleList()).toEqual(fleet);
    expect(apiClient.get).toHaveBeenCalledTimes(1);
    expect(apiClient.get).toHaveBeenCalledWith('/api/vehicles/options', {
      params: { page: 1, limit: 500 },
    });
  });

  // Pickers used to ask for 100, 200 or the API default of 10 and drop trucks.
  it('keeps paging until it has every vehicle', async () => {
    const p1 = Array.from({ length: 500 }, (_, i) => row(i));
    const p2 = Array.from({ length: 500 }, (_, i) => row(500 + i));
    const p3 = [row(1000), row(1001)];
    apiClient.get
      .mockResolvedValueOnce(page(p1, 1, 3))
      .mockResolvedValueOnce(page(p2, 2, 3))
      .mockResolvedValueOnce(page(p3, 3, 3));

    const list = await getVehicleList();

    expect(list).toHaveLength(1002);
    expect(list.at(-1)).toEqual(row(1001));
    expect(apiClient.get.mock.calls.map((c) => c[1].params.page)).toEqual([1, 2, 3]);
  });

  // Until the backend with /vehicles/options is deployed, the old list still works.
  it('falls back to the full list endpoint when options is not deployed yet', async () => {
    apiClient.get.mockRejectedValueOnce(notFound()).mockResolvedValueOnce(page(fleet, 1, 1));

    expect(await getVehicleList()).toEqual(fleet);
    expect(apiClient.get).toHaveBeenLastCalledWith('/api/vehicles', {
      params: { page: 1, limit: 1000 },
    });
  });

  it('shares one request between screens', async () => {
    const [a, b] = await Promise.all([getVehicleList(), getVehicleList()]);
    await getVehicleList();
    expect(a).toEqual(fleet);
    expect(b).toEqual(fleet);
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it('keeps a separate list per active branch and per org', async () => {
    await getVehicleList();
    getBranchId.mockReturnValue('br1');
    await getVehicleList();
    getOrgId.mockReturnValue('org2');
    await getVehicleList();
    expect(apiClient.get).toHaveBeenCalledTimes(3);
  });

  it('refetches after a vehicle write invalidates it', async () => {
    await getVehicleList();
    invalidateVehicleList();
    await getVehicleList();
    expect(apiClient.get).toHaveBeenCalledTimes(2);
  });

  it('refetches once the cached copy is five minutes old', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-11T10:00:00Z'));
    await getVehicleList();
    vi.setSystemTime(new Date('2026-10-11T10:04:59Z'));
    await getVehicleList();
    expect(apiClient.get).toHaveBeenCalledTimes(1);
    vi.setSystemTime(new Date('2026-10-11T10:05:01Z'));
    await getVehicleList();
    expect(apiClient.get).toHaveBeenCalledTimes(2);
  });

  it('does not cache a failure', async () => {
    apiClient.get.mockRejectedValueOnce(new Error('Network Error'));
    const err = await getVehicleList().catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(await getVehicleList()).toEqual(fleet);
    expect(apiClient.get).toHaveBeenCalledTimes(2);
  });

  it("one screen's abort detaches only that screen", async () => {
    let release;
    apiClient.get.mockReturnValueOnce(new Promise((r) => (release = r)));
    const controller = new AbortController();
    const leaving = getVehicleList({ signal: controller.signal });
    const staying = getVehicleList();

    controller.abort();
    release(page(fleet, 1, 1));

    const err = await leaving.catch((e) => e);
    expect(err.code).toBe('ERR_CANCELED');
    expect(await staying).toEqual(fleet);
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });
});
