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
