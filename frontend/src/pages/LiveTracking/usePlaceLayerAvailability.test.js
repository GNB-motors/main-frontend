import { describe, it, expect, vi } from 'vitest';
import { loadPlaceLayerAvailability } from './usePlaceLayerAvailability.js';
import { getMapPlaces } from '../../services/fleetViewService.js';
vi.mock('../../services/fleetViewService.js', () => ({ getMapPlaces: vi.fn() }));

describe('place category availability', () => {
  it('keeps missing, empty, and capped coverage distinct', async () => {
    getMapPlaces.mockImplementation(async ({ layers }) => {
      if (layers === 'hospitals') throw new Error('offline');
      if (layers === 'pumps') return { items: [{ id: 'pump' }], truncated: true };
      return { items: [], truncated: false };
    });
    const data = await loadPlaceLayerAvailability(new AbortController().signal);
    expect(data.hospitals).toEqual({ count: null, failed: true });
    expect(data.police).toEqual({ count: 0, truncated: false });
    expect(data.pumps).toEqual({ count: 1, truncated: true });
    expect(data.tolls).toBeUndefined();
  });
});
