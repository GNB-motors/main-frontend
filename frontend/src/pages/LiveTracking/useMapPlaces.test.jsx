import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

const { getMapPlaces } = vi.hoisted(() => ({ getMapPlaces: vi.fn() }));

vi.mock('../../services/fleetViewService', () => ({
  fleetViewService: { getMapPlaces },
}));

import useMapPlaces from './useMapPlaces';
import indiaBoundary from './indiaPumpBoundary.json';

afterEach(() => vi.unstubAllGlobals());
import { defaultLayerSelection } from './trackLegendModel';

describe('useMapPlaces', () => {
  it('hides foreign pumps while retaining other layers and counts only visible Indian pumps', async () => {
    getMapPlaces.mockResolvedValue({
      items: [
        { id: 'indian', layer: 'pumps', lat: 22.5726, lng: 88.3639 },
        { id: 'foreign', layer: 'pumps', lat: 23.8103, lng: 90.4125 },
        { id: 'foreign-hospital', layer: 'hospitals', lat: 23.8103, lng: 90.4125 },
      ],
      truncated: false,
    });
    const { result } = renderHook(() =>
      useMapPlaces({ bbox: [20, 85, 29, 95], zoom: 13, layers: { pumps: true, hospitals: true } }),
    );
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.items.map((item) => item.id)).toEqual(['indian', 'foreign-hospital']);
    expect(result.current.counts.pumps).toBe(1);
  });

  it('coalesces quick viewport changes and does not share cached data with a new page scope', async () => {
    const useViewportPlaces = ({ bbox }) =>
      useMapPlaces({ bbox, zoom: 8, layers: { pumps: true } });
    const first = renderHook(useViewportPlaces, { initialProps: { bbox: [24, 86, 26, 88] } });
    first.rerender({ bbox: [24.1, 86.1, 26.1, 88.1] });
    first.rerender({ bbox: [24.2, 86.2, 26.2, 88.2] });
    await waitFor(() => expect(first.result.current.loaded).toBe(true));
    expect(getMapPlaces).toHaveBeenCalledTimes(1);
    first.unmount();
    const second = renderHook(useViewportPlaces, {
      initialProps: { bbox: [24.2, 86.2, 26.2, 88.2] },
    });
    await waitFor(() => expect(second.result.current.loaded).toBe(true));
    expect(getMapPlaces).toHaveBeenCalledTimes(2);
  });

  it('reuses complete buffered coverage for nearby pans and revisited areas', async () => {
    const { result, rerender } = renderHook(
      ({ bbox }) => useMapPlaces({ bbox, zoom: 8, layers: { pumps: true } }),
      { initialProps: { bbox: [24, 86, 26, 88] } },
    );
    await waitFor(() => expect(result.current.loaded).toBe(true));
    rerender({ bbox: [24.1, 86.1, 25.9, 87.9] });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(getMapPlaces).toHaveBeenCalledTimes(1);
    rerender({ bbox: [10, 76, 12, 78] });
    await waitFor(() => expect(getMapPlaces).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.loaded).toBe(true));
    rerender({ bbox: [24, 86, 26, 88] });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(getMapPlaces).toHaveBeenCalledTimes(2);
  });

  it('refetches truncated coverage when zooming in and ignores a late aborted answer', async () => {
    let finish;
    getMapPlaces.mockResolvedValueOnce({
      items: [{ id: 'old', layer: 'pumps', lat: 25, lng: 87 }],
      truncated: true,
    });
    const { result, rerender } = renderHook(
      ({ bbox }) => useMapPlaces({ bbox, zoom: 8, layers: { pumps: true } }),
      { initialProps: { bbox: [24, 86, 26, 88] } },
    );
    await waitFor(() => expect(result.current.loaded).toBe(true));
    getMapPlaces.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    rerender({ bbox: [24.1, 86.1, 25.9, 87.9] });
    await waitFor(() => expect(finish).toBeDefined());
    expect(result.current.items[0].id).toBe('old');
    getMapPlaces.mockResolvedValue({
      items: [{ id: 'new', layer: 'pumps', lat: 11, lng: 77 }],
      truncated: false,
    });
    rerender({ bbox: [10, 76, 12, 78] });
    await waitFor(() => expect(result.current.items[0]?.id).toBe('new'));
    await act(async () => finish({ items: [], truncated: false }));
    expect(result.current.items[0].id).toBe('new');
  });

  it('keeps loaded markers after a refresh error and clears disabled layers immediately', async () => {
    getMapPlaces.mockResolvedValue({
      items: [{ id: 'pump', layer: 'pumps', lat: 25, lng: 87 }],
      truncated: false,
    });
    const { result, rerender } = renderHook(
      ({ enabled }) => useMapPlaces({ bbox: [24, 86, 26, 88], layers: { pumps: true }, enabled }),
      { initialProps: { enabled: true } },
    );
    await waitFor(() => expect(result.current.loaded).toBe(true));
    getMapPlaces.mockRejectedValue(new Error('offline'));
    act(() => result.current.refetch());
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.items).toHaveLength(1);
    rerender({ enabled: false });
    expect(result.current.items).toEqual([]);
  });
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => indiaBoundary }),
    );
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
    const bounds = getMapPlaces.mock.calls[0][0].bbox.split(',').map(Number);
    [83.85, 24.975, 84.15, 25.725].forEach((value, index) =>
      expect(bounds[index]).toBeCloseTo(value),
    );
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

  it('removes offscreen markers and updates local counts immediately while a new area loads', async () => {
    getMapPlaces.mockResolvedValue({
      items: [{ id: 'pump', layer: 'pumps', lat: 25, lng: 87 }],
      truncated: false,
    });
    const { result, rerender } = renderHook(
      ({ bbox }) => useMapPlaces({ bbox, zoom: 8, layers: { pumps: true, dhabas: true } }),
      { initialProps: { bbox: [24, 85.7, 25.8, 88] } },
    );
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.counts).toEqual({ pumps: 1, dhabas: 0 });
    getMapPlaces.mockImplementation(() => new Promise(() => {}));
    rerender({ bbox: [23, 86, 24, 87] });
    expect(result.current.items).toHaveLength(0);
    expect(result.current.counts.pumps).toBe(0);
    expect(result.current.loaded).toBe(false);
  });

  it('separates Our and All caches and immediately removes unvisited places on a scope change', async () => {
    const rows = [
      { id: 'our-pump', layer: 'pumps', lat: 25, lng: 87, visited: true },
      { id: 'other-pump', layer: 'pumps', lat: 25, lng: 87, visited: false },
    ];
    getMapPlaces.mockImplementation(async ({ visitedLayers }) => ({
      items: visitedLayers ? rows.slice(0, 1) : rows,
      truncated: false,
    }));
    const { result, rerender } = renderHook(
      ({ scope }) =>
        useMapPlaces({
          bbox: [24, 86, 26, 88],
          zoom: 8,
          layers: { pumps: true },
          scopes: { pumps: scope },
        }),
      { initialProps: { scope: 'all' } },
    );
    await waitFor(() => expect(result.current.items).toHaveLength(2));
    rerender({ scope: 'visited' });
    expect(result.current.items.map((p) => p.id)).toEqual(['our-pump']);
    await waitFor(() => expect(getMapPlaces.mock.lastCall[0].visitedLayers).toBe('pumps'));
    await waitFor(() => expect(result.current.loaded).toBe(true));
    rerender({ scope: 'all' });
    await waitFor(() => expect(result.current.items).toHaveLength(2));
    expect(getMapPlaces).toHaveBeenCalledTimes(2);
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

  it('reuses a truncated answer for a pan inside the padded box', async () => {
    getMapPlaces.mockResolvedValue({
      items: [{ id: 'pump', layer: 'pumps', lat: 25, lng: 87 }],
      truncated: true,
    });
    const { result, rerender } = renderHook(
      ({ bbox }) => useMapPlaces({ bbox, zoom: 8, layers: { pumps: true } }),
      { initialProps: { bbox: [24, 86, 26, 88] } },
    );
    await waitFor(() => expect(result.current.loaded).toBe(true));
    // A pan: the box moves, its size stays.
    rerender({ bbox: [24.2, 86.2, 26.2, 88.2] });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(getMapPlaces).toHaveBeenCalledTimes(1);
  });

  it('asks again when the pan leaves the padded box', async () => {
    getMapPlaces.mockResolvedValue({
      items: [{ id: 'pump', layer: 'pumps', lat: 25, lng: 87 }],
      truncated: true,
    });
    const { result, rerender } = renderHook(
      ({ bbox }) => useMapPlaces({ bbox, zoom: 8, layers: { pumps: true } }),
      { initialProps: { bbox: [24, 86, 26, 88] } },
    );
    await waitFor(() => expect(result.current.loaded).toBe(true));
    rerender({ bbox: [26.5, 88.5, 28.5, 90.5] });
    await waitFor(() => expect(getMapPlaces).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.loaded).toBe(true));
  });
});
