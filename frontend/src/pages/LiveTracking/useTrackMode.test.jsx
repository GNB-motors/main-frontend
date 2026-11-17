import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import useTrackMode from './useTrackMode';
import { fleetViewService } from '../../services/fleetViewService';
vi.mock('../../services/fleetViewService', () => ({
  fleetViewService: {
    getVehicleTrack: vi.fn(),
    getVehicleTolls: vi.fn(),
  },
}));
vi.mock('../../services/RoadService', () => ({
  default: { getRoadTrailIfEnabled: vi.fn(async () => null) },
}));
const params = (reg = 'BR44GB1262') =>
  new URLSearchParams(`v=${reg}&from=2026-11-03T00:00:00%2B05:30&to=2026-11-04T00:00:00%2B05:30`);
beforeEach(() => {
  vi.clearAllMocks();
  fleetViewService.getVehicleTrack.mockResolvedValue({ points: [] });
  fleetViewService.getVehicleTolls.mockResolvedValue({ status: 'READY', passes: [] });
});
describe('Track toll request lifecycle', () => {
  it('does not fetch tolls outside Track mode', () => {
    renderHook(() => useTrackMode({ searchParams: new URLSearchParams() }));
    expect(fleetViewService.getVehicleTolls).not.toHaveBeenCalled();
  });
  it('loads once for the replay window and does not refetch on seek', async () => {
    const searchParams = params();
    const { result } = renderHook(() => useTrackMode({ searchParams }));
    await waitFor(() => expect(result.current.tolls?.status).toBe('READY'));
    expect(fleetViewService.getVehicleTolls).toHaveBeenCalledWith(
      'BR44GB1262',
      expect.objectContaining({
        from: '2026-11-03T00:00:00+05:30',
        to: '2026-11-04T00:00:00+05:30',
        signal: expect.any(AbortSignal),
      }),
    );
    act(() => result.current.seekToTime('2026-11-03T12:00:00Z'));
    expect(fleetViewService.getVehicleTolls).toHaveBeenCalledOnce();
  });
  it('clears previous truck tolls immediately and keeps track usable after a toll error', async () => {
    const { result, rerender } = renderHook(({ searchParams }) => useTrackMode({ searchParams }), {
      initialProps: { searchParams: params() },
    });
    await waitFor(() => expect(result.current.tolls?.status).toBe('READY'));
    fleetViewService.getVehicleTolls.mockRejectedValue(new Error('Unavailable'));
    rerender({ searchParams: params('WB11F6762') });
    expect(result.current.tolls).toBeNull();
    await waitFor(() => expect(result.current.tollsError).toBeTruthy());
    expect(result.current.error).toBeNull();
    expect(result.current.track).toEqual({ points: [] });
  });
});

describe('shared vehicle journey context', () => {
  it('preserves the view and vehicle when changing dates and leaving replay', async () => {
    const searchParams = params();
    searchParams.set('view', 'places');
    searchParams.set('placesTab', 'routes');
    searchParams.set('status', 'offline');
    const setSearchParams = vi.fn();
    const { result } = renderHook(() => useTrackMode({ searchParams, setSearchParams }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() =>
      result.current.applyRange({
        from: new Date('2026-11-01T00:00:00Z'),
        to: new Date('2026-11-02T00:00:00Z'),
      }),
    );
    const changed = setSearchParams.mock.calls[0][0](searchParams);
    expect(changed.get('v')).toBe('BR44GB1262');
    expect(changed.get('view')).toBe('places');
    expect(changed.get('placesTab')).toBe('routes');
    expect(changed.get('status')).toBe('offline');
    expect(changed.get('from')).toBe('2026-11-01T05:30:00+05:30');
    act(() => result.current.exitTrackMode());
    const exited = setSearchParams.mock.calls[1][0](changed);
    expect(exited.has('v')).toBe(false);
    expect(exited.get('vehicle')).toBe('BR44GB1262');
    expect(exited.get('view')).toBe('places');
    expect(exited.get('placesTab')).toBe('routes');
  });

  it('does not reload the journey or reset the playhead when only the view changes', async () => {
    const searchParams = params();
    const { result, rerender } = renderHook(({ searchParams }) => useTrackMode({ searchParams }), {
      initialProps: { searchParams },
    });
    await waitFor(() => expect(result.current.track).toBeTruthy());
    act(() => result.current.seekToTime('2026-11-03T12:00:00Z'));
    const next = new URLSearchParams(searchParams);
    next.set('view', 'places');
    rerender({ searchParams: next });
    expect(result.current.playheadTime.toISOString()).toBe('2026-11-03T12:00:00.000Z');
    expect(result.current.isPlaying).toBe(false);
    expect(fleetViewService.getVehicleTrack).toHaveBeenCalledOnce();
    next.set('placesTab', 'routes');
    rerender({ searchParams: new URLSearchParams(next) });
    expect(fleetViewService.getVehicleTrack).toHaveBeenCalledOnce();
  });

  it('loads a live selected vehicle journey in Places without entering replay', async () => {
    const searchParams = params();
    searchParams.delete('v');
    searchParams.set('vehicle', 'WB11J7062');
    searchParams.set('view', 'places');
    const { result } = renderHook(() => useTrackMode({ searchParams }));
    await waitFor(() => expect(result.current.track).toBeTruthy());
    expect(result.current.isTrackMode).toBe(false);
    expect(fleetViewService.getVehicleTrack).toHaveBeenCalledWith(
      'WB11J7062',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('clears the previous journey immediately when the vehicle or dates change', async () => {
    const { result, rerender } = renderHook(({ searchParams }) => useTrackMode({ searchParams }), {
      initialProps: { searchParams: params() },
    });
    await waitFor(() => expect(result.current.track).toBeTruthy());
    fleetViewService.getVehicleTrack.mockImplementation(() => new Promise(() => {}));
    await act(async () => rerender({ searchParams: params('OTHER01') }));
    expect(result.current.track).toBeNull();
    expect(result.current.roadTrail).toBeNull();
  });
});
