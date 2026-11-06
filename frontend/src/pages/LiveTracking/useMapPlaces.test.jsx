import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const { getMapPlaces } = vi.hoisted(() => ({ getMapPlaces: vi.fn() }));

vi.mock('../../services/fleetViewService', () => ({
  fleetViewService: { getMapPlaces },
}));

import useMapPlaces from './useMapPlaces';
import { defaultLayerSelection } from './trackLegendModel';

describe('useMapPlaces', () => {
  beforeEach(() => {
    getMapPlaces.mockReset();
    getMapPlaces.mockResolvedValue({ items: [], truncated: false });
  });

  it('asks for the visible map box', async () => {
    const { result } = renderHook(() =>
      useMapPlaces({
        bbox: [25.1, 83.9, 25.6, 84.1],
        zoom: 13,
        layers: defaultLayerSelection(),
      }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(getMapPlaces).toHaveBeenCalledTimes(1);
    expect(getMapPlaces.mock.calls[0][0].bbox).toBe('83.9,25.1,84.1,25.6');
  });

  it('loads selected nearby categories even when the map is far out', async () => {
    const { result } = renderHook(() =>
      useMapPlaces({ bbox: [25.1, 83.9, 25.6, 84.1], zoom: 7, layers: defaultLayerSelection() }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(getMapPlaces.mock.calls[0][0].layers).toContain('pumps');
  });

  it('asks for the zoom-gated layers when the map is close enough', async () => {
    const { result } = renderHook(() =>
      useMapPlaces({ bbox: [25.1, 83.9, 25.6, 84.1], zoom: 12, layers: defaultLayerSelection() }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(getMapPlaces.mock.calls[0][0].layers).toContain('pumps');
  });

  it('reports local category counts and clears them when the view changes', async () => {
    getMapPlaces.mockResolvedValue({ items: [{ id: 'pump', layer: 'pumps' }], truncated: false });
    const { result, rerender } = renderHook(({ bbox }) => useMapPlaces({ bbox, zoom: 8, layers: { pumps: true, dhabas: true } }), { initialProps: { bbox: [24, 85.7, 25.8, 88] } });
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.counts).toEqual({ pumps: 1, dhabas: 0 });
    getMapPlaces.mockImplementation(() => new Promise(() => {}));
    rerender({ bbox: [23, 86, 24, 87] });
    expect(result.current.items).toEqual([]);
    expect(result.current.loaded).toBe(false);
  });

  it('does not ask for anything before the map has a box', () => {
    renderHook(() => useMapPlaces({ bbox: null, zoom: 12, layers: defaultLayerSelection() }));
    expect(getMapPlaces).not.toHaveBeenCalled();
  });

  it('says the layer is not available yet when the endpoint is not deployed', async () => {
    getMapPlaces.mockRejectedValue(Object.assign(new Error('Not found'), { status: 404 }));
    const { result } = renderHook(() =>
      useMapPlaces({ bbox: [25.1, 83.9, 25.6, 84.1], zoom: 12, layers: defaultLayerSelection() }),
    );
    await waitFor(() => expect(result.current.notAvailable).toBe(true));
    expect(result.current.error).toBeNull();
  });

  it('reports a real failure as an error', async () => {
    getMapPlaces.mockRejectedValue(Object.assign(new Error('Server'), { status: 500 }));
    const { result } = renderHook(() =>
      useMapPlaces({ bbox: [25.1, 83.9, 25.6, 84.1], zoom: 12, layers: defaultLayerSelection() }),
    );
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.notAvailable).toBe(false);
  });
});
