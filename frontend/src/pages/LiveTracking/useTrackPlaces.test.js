import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import useTrackPlaces from './useTrackPlaces.js';
import TrackPlacesService from './TrackPlacesService.js';

const flags = vi.hoisted(() => ({ on: new Set() }));
vi.mock('../../contexts/FeatureFlagsContext', () => ({
  useFeatureFlags: () => ({ isEnabled: (k) => flags.on.has(k) }),
}));
vi.mock('../../utils/session.js', () => ({ getUserRole: () => 'OWNER' }));
vi.mock('./TrackPlacesService.js', () => ({ default: { load: vi.fn() } }));

const data = {
  warehouses: [{ _id: 'w1', name: 'WH', lat: 22.7, lng: 88.2 }],
  zones: [],
  sites: [],
  sitesTruncated: false,
  failed: [],
};

beforeEach(() => {
  vi.resetAllMocks();
  flags.on = new Set();
  TrackPlacesService.load.mockResolvedValue(data);
});

describe('Track places layer', () => {
  it('is off by default and loads nothing until turned on', () => {
    const { result } = renderHook(() => useTrackPlaces());
    expect(result.current.visible).toBe(false);
    expect(result.current.shownPlaces).toEqual([]);
    expect(TrackPlacesService.load).not.toHaveBeenCalled();
  });

  it('loads once on first use and keeps the result when toggled again', async () => {
    const { result } = renderHook(() => useTrackPlaces());
    act(() => result.current.toggle());
    await waitFor(() => expect(result.current.shownPlaces).toHaveLength(1));
    act(() => result.current.toggle());
    expect(result.current.shownPlaces).toEqual([]);
    act(() => result.current.toggle());
    expect(result.current.shownPlaces).toHaveLength(1);
    expect(TrackPlacesService.load).toHaveBeenCalledTimes(1);
  });

  it('asks for zones and detected sites only where Place Hub would', async () => {
    flags.on = new Set(['geofence', 'fleetIntelligence']);
    const { result } = renderHook(() => useTrackPlaces());
    act(() => result.current.toggle());
    await waitFor(() => expect(TrackPlacesService.load).toHaveBeenCalled());
    expect(TrackPlacesService.load.mock.calls[0][0]).toMatchObject({
      allowZones: true,
      allowSites: true,
    });
  });

  it('says which layer failed instead of hiding the rest', async () => {
    TrackPlacesService.load.mockResolvedValue({ ...data, failed: ['sites'] });
    const { result } = renderHook(() => useTrackPlaces());
    act(() => result.current.toggle());
    await waitFor(() => expect(result.current.notice).toContain('detected places'));
    expect(result.current.shownPlaces).toHaveLength(1);
  });
});

describe('Track places tab', () => {
  it('lists places without putting them on the map until shown', async () => {
    const { result } = renderHook(() => useTrackPlaces());
    act(() => result.current.ensureLoaded());
    await waitFor(() => expect(result.current.listPlaces).toHaveLength(1));
    expect(result.current.visible).toBe(false);
    expect(result.current.shownPlaces).toEqual([]);
    act(() => result.current.show());
    expect(result.current.shownPlaces).toHaveLength(1);
    expect(TrackPlacesService.load).toHaveBeenCalledTimes(1);
  });
  it('keeps the picked place open when the map layer is turned off', async () => {
    const { result } = renderHook(() => useTrackPlaces());
    act(() => result.current.show());
    await waitFor(() => expect(result.current.shownPlaces).toHaveLength(1));
    act(() => result.current.selectPlace('warehouse:w1'));
    act(() => result.current.toggle());
    expect(result.current.shownPlaces).toEqual([]);
    expect(result.current.selectedPlace?.id).toBe('warehouse:w1');
  });
});
