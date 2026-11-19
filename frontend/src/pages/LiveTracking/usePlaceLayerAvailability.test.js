import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import usePlaceLayerAvailability, {
  loadPlaceLayerAvailability,
} from './usePlaceLayerAvailability.js';
import { getMapPlaces } from '../../services/fleetViewService.js';
import { clearSession, setOrgId, setSession } from '../../utils/session.js';

vi.mock('../../services/fleetViewService.js', () => ({ getMapPlaces: vi.fn() }));

// The seven legend layers the availability covers, with the API layers they
// are read from (workshops are workshops and tyres).
const EXPECTED_API_LAYERS = [
  'pumps',
  'dhabas',
  'hospitals',
  'police',
  'workshops',
  'tyres',
  'dealers',
  'parking',
];

let orgSeq = 0;

describe('place category availability', () => {
  beforeEach(() => {
    orgSeq += 1;
    getMapPlaces.mockReset();
    setSession({ token: `token-${orgSeq}`, user: { _id: 'user-1' } });
    setOrgId(`org-${orgSeq}`);
  });

  afterEach(() => {
    clearSession();
    setOrgId(null);
  });

  it('asks for every layer in one call and splits the answer per layer', async () => {
    getMapPlaces.mockResolvedValue({
      items: [
        { id: 'p1', layer: 'pumps' },
        { id: 'p2', layer: 'pumps' },
        { id: 'd1', layer: 'dhabas' },
        { id: 't1', layer: 'tyres' },
      ],
      truncated: true,
      truncatedLayers: ['pumps'],
    });
    const data = await loadPlaceLayerAvailability(new AbortController().signal);
    expect(getMapPlaces).toHaveBeenCalledTimes(1);
    const asked = getMapPlaces.mock.calls[0][0].layers.split(',');
    expect(asked).toEqual(EXPECTED_API_LAYERS);
    expect(data.pumps).toEqual({ count: 2, truncated: true });
    expect(data.dhabas).toEqual({ count: 1, truncated: false });
    expect(data.workshops).toEqual({ count: 1, truncated: false });
    expect(data.hospitals).toEqual({ count: 0, truncated: false });
    expect(data.tolls).toBeUndefined();
  });

  it('keeps the counts for the session and asks again when forced', async () => {
    getMapPlaces.mockResolvedValue({
      items: [{ id: 'p1', layer: 'pumps' }],
      truncated: false,
    });
    await loadPlaceLayerAvailability(new AbortController().signal);
    await loadPlaceLayerAvailability(new AbortController().signal);
    expect(getMapPlaces).toHaveBeenCalledTimes(1);
    await loadPlaceLayerAvailability(new AbortController().signal, { force: true });
    expect(getMapPlaces).toHaveBeenCalledTimes(2);
  });

  it('drops the counts of another org', async () => {
    getMapPlaces.mockResolvedValue({ items: [], truncated: false });
    await loadPlaceLayerAvailability(new AbortController().signal);
    setOrgId(`org-${orgSeq}-other`);
    await loadPlaceLayerAvailability(new AbortController().signal);
    expect(getMapPlaces).toHaveBeenCalledTimes(2);
  });

  it('keeps missing, empty, and capped coverage distinct', async () => {
    getMapPlaces.mockRejectedValue(new Error('offline'));
    const data = await loadPlaceLayerAvailability(new AbortController().signal);
    expect(data.hospitals).toEqual({ count: null, failed: true });
    expect(data.police).toEqual({ count: null, failed: true });
    expect(data.tolls).toBeUndefined();
  });

  it('does not keep a failed read', async () => {
    getMapPlaces.mockRejectedValueOnce(new Error('offline'));
    await loadPlaceLayerAvailability(new AbortController().signal);
    getMapPlaces.mockResolvedValue({
      items: [{ id: 'p1', layer: 'pumps' }],
      truncated: false,
    });
    const data = await loadPlaceLayerAvailability(new AbortController().signal);
    expect(data.pumps).toEqual({ count: 1, truncated: false });
    expect(getMapPlaces).toHaveBeenCalledTimes(2);
  });

  it('counts nothing when the answer is held', async () => {
    getMapPlaces.mockResolvedValue({ held: true });
    const data = await loadPlaceLayerAvailability(new AbortController().signal);
    expect(data.pumps).toEqual({ count: null });
  });

  it('asks once for the whole legend and refreshes on demand', async () => {
    getMapPlaces.mockResolvedValue({
      items: [{ id: 'p1', layer: 'pumps' }],
      truncated: false,
    });
    const { result } = renderHook(() => usePlaceLayerAvailability(true));
    await waitFor(() => expect(result.current.data?.pumps?.count).toBe(1));
    expect(getMapPlaces).toHaveBeenCalledTimes(1);
    await act(async () => {
      result.current.refetch();
    });
    await waitFor(() => expect(getMapPlaces).toHaveBeenCalledTimes(2));
  });
});
