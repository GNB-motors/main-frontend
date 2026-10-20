import { describe, it, expect, vi } from 'vitest';

vi.mock('./intelligence/PlaceIntelligenceService.js', () => ({
  default: { listSites: vi.fn(), reviewQueue: vi.fn() },
}));
vi.mock('../../services/VehicleWarehouseService.js', () => ({ default: {} }));
vi.mock('../../services/HotspotService.js', () => ({}));
vi.mock('../IdlingConsole/IdlingConsoleService.js', () => ({ default: {} }));
vi.mock('../../utils/axiosConfig', () => ({ default: {} }));

const { default: PlaceIntelligenceService } =
  await import('./intelligence/PlaceIntelligenceService.js');
const { PlaceHubService } = await import('./PlaceHubService.js');

const site = (id, status) => ({ _id: id, status, centroidLat: 22.5, centroidLng: 88.3 });

describe('PlaceHubService.loadSites', () => {
  it('still loads every other list when the backend rejects evidence=low', async () => {
    // prod 2026-10-11: the frontend deployed before the backend that knows evidence=low
    PlaceIntelligenceService.listSites.mockImplementation(async ({ status, evidence }) => {
      if (evidence === 'low') throw Object.assign(new Error('400'), { response: { status: 400 } });
      const rows = { CONFIRMED: [site('c', 'CONFIRMED')], PROPOSED: [site('p', 'PROPOSED')] };
      return { records: rows[status] || [], total: (rows[status] || []).length };
    });
    PlaceIntelligenceService.reviewQueue.mockResolvedValue({ items: [] });
    const res = await PlaceHubService.loadSites();
    expect(res.error).toBeNull();
    expect(res.rows.map((s) => s._id).sort()).toEqual(['c', 'p']);
    expect(res.lowEvidenceTotal).toBe(0);
  });

  it('tags the low-evidence list and counts it', async () => {
    PlaceIntelligenceService.listSites.mockImplementation(async ({ status, evidence }) => {
      if (evidence === 'low') return { records: [site('l', 'PROPOSED')], total: 537 };
      return status === 'PROPOSED'
        ? { records: [site('p', 'PROPOSED')], total: 178 }
        : { records: [], total: 0 };
    });
    PlaceIntelligenceService.reviewQueue.mockResolvedValue({ items: [] });
    const res = await PlaceHubService.loadSites();
    expect(res.rows.find((s) => s._id === 'l').lowEvidence).toBe(true);
    expect(res).toMatchObject({ proposedTotal: 178, lowEvidenceTotal: 537 });
  });

  it('asks for slim list rows and leaves places said not to exist to their chip', async () => {
    PlaceIntelligenceService.listSites.mockClear();
    PlaceIntelligenceService.listSites.mockResolvedValue({ records: [], total: 0 });
    PlaceIntelligenceService.reviewQueue.mockResolvedValue({ items: [] });

    await PlaceHubService.loadSites();
    const asked = PlaceIntelligenceService.listSites.mock.calls.map(([params]) => params);
    expect(asked.every((p) => p.fields === 'list')).toBe(true);
    expect(asked.some((p) => p.status === 'REJECTED')).toBe(false);

    PlaceIntelligenceService.listSites.mockResolvedValueOnce({
      records: [site('r', 'REJECTED')],
      total: 1,
    });
    const rejected = await PlaceHubService.loadRejectedSites();
    expect(rejected.rows.map((s) => s._id)).toEqual(['r']);
    expect(PlaceIntelligenceService.listSites).toHaveBeenLastCalledWith(
      { status: 'REJECTED', limit: 200, page: 1, fields: 'list' },
      { signal: undefined },
    );
  });
});
