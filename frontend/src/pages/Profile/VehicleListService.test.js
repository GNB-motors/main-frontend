import { beforeEach, expect, it, vi } from 'vitest';
import VehicleListService from './VehicleListService.js';
import { VehicleService } from './VehicleService.js';

vi.mock('./VehicleService.js', () => ({ VehicleService: { getAllVehicles: vi.fn() } }));

beforeEach(() => {
  vi.clearAllMocks();
});

it.each(['ALL', 'ACTIVE', 'UNASSIGNED', 'FLEETEDGE', 'RELINK'])(
  '%s requests only the selected server page and preserves backend counts',
  async (view) => {
    const signal = new AbortController().signal;
    const meta = { total: 126, totalPages: 13, page: 7, limit: 10 };
    VehicleService.getAllVehicles.mockResolvedValue({
      data: [{ _id: 'v61', registrationNumber: 'WB61' }],
      meta,
    });
    const result = await VehicleListService.getPage({
      businessRefId: 'org1',
      view,
      page: 7,
      limit: 10,
      manufacturer: 'TATA',
      search: 'WB',
      signal,
    });
    expect(VehicleService.getAllVehicles).toHaveBeenCalledOnce();
    expect(VehicleService.getAllVehicles).toHaveBeenCalledWith('org1', 7, 10, {
      view,
      manufacturer: 'TATA',
      search: 'WB',
      signal,
    });
    expect(result.meta).toEqual(meta);
    expect(result.data.map((row) => row.id)).toEqual(['v61']);
  },
);

it('exports successive server-filtered pages without filtering or slicing locally', async () => {
  VehicleService.getAllVehicles
    .mockResolvedValueOnce({ data: [{ _id: 'v1' }], meta: { totalPages: 2 } })
    .mockResolvedValueOnce({ data: [{ _id: 'v2' }], meta: { totalPages: 2 } });
  const rows = await VehicleListService.getMatching({ businessRefId: 'org1', view: 'UNASSIGNED' });
  expect(rows.map((row) => row.id)).toEqual(['v1', 'v2']);
  expect(VehicleService.getAllVehicles).toHaveBeenNthCalledWith(
    2,
    'org1',
    2,
    1000,
    expect.objectContaining({ view: 'UNASSIGNED' }),
  );
});
