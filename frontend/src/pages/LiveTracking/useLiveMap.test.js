import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useLiveMap from './useLiveMap.js';
import { LiveTrackingService } from './LiveTrackingService.jsx';
import RoadService from '../../services/RoadService.js';

vi.mock('./LiveTrackingService.jsx', () => ({ LiveTrackingService: { getTrail: vi.fn() } }));
vi.mock('../../services/RoadService.js', () => ({ default: { getRoadTrailIfEnabled: vi.fn() } }));
const vehicle = { id: 'v1', plate: 'WB01', hasFix: true, lat: 22, lng: 88 };
const points = [
  { latitude: 22, longitude: 88, eventDateTime: '2026-11-02T10:00:00Z' },
  { latitude: 23, longitude: 89, eventDateTime: '2026-11-02T11:00:00Z' },
];
function setup() {
  return renderHook(
    ({ v }) =>
      useLiveMap({
        theme: 'light',
        mapMode: 'map',
        vehicles: [v],
        selectedId: v?.id,
        selectedVehicle: v,
        showToast: vi.fn(),
      }),
    { initialProps: { v: vehicle } },
  );
}
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});

describe('Track trail dates', () => {
  it('uses both custom dates for GPS, roads and replay, and reloads when the end date changes', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-02T08:00:00Z'));
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn(() => 1),
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    LiveTrackingService.getTrail.mockResolvedValue({ points });
    RoadService.getRoadTrailIfEnabled.mockResolvedValue(null);
    const { result } = setup();
    const selection = { period: 'custom', startDate: '2026-10-20', endDate: '2026-10-22' };
    const range = { from: '2026-10-19T18:30:00.000Z', to: '2026-10-22T18:29:59.999Z' };
    await act(() => result.current.loadTrail(vehicle, selection));
    expect(LiveTrackingService.getTrail.mock.lastCall[1]).toMatchObject(range);
    expect(RoadService.getRoadTrailIfEnabled.mock.lastCall[1]).toEqual(range);
    await act(() => result.current.enterReplay(vehicle));
    expect(LiveTrackingService.getTrail.mock.lastCall[1]).toMatchObject(range);
    expect(RoadService.getRoadTrailIfEnabled.mock.lastCall[1]).toEqual(range);
    await act(() => result.current.loadTrail(vehicle, { ...selection, endDate: '2026-10-23' }));
    await act(() => result.current.enterReplay(vehicle));
    expect(LiveTrackingService.getTrail).toHaveBeenCalledTimes(4);
    expect(LiveTrackingService.getTrail.mock.lastCall[1].to).toBe('2026-10-23T18:29:59.999Z');
  });

  it('loads Today from IST midnight and uses Yesterday for both trail and replay', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-02T08:00:00Z'));
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn(() => 1),
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    LiveTrackingService.getTrail.mockResolvedValue({ points });
    RoadService.getRoadTrailIfEnabled.mockResolvedValue(null);
    const { result } = setup();
    await act(() => result.current.toggleTrail(vehicle));
    expect(LiveTrackingService.getTrail.mock.calls[0][1]).toEqual({
      from: '2026-11-01T18:30:00.000Z',
      to: '2026-11-02T08:00:00.000Z',
      limit: 10000,
    });
    await act(() => result.current.loadTrail(vehicle, { period: 'yesterday' }));
    const yesterday = { from: '2026-10-31T18:30:00.000Z', to: '2026-11-01T18:29:59.999Z' };
    expect(result.current.trailSelection).toEqual({ period: 'yesterday' });
    expect(LiveTrackingService.getTrail.mock.lastCall[1]).toMatchObject(yesterday);
    expect(RoadService.getRoadTrailIfEnabled.mock.lastCall[1]).toEqual(yesterday);
    await act(() => result.current.enterReplay(vehicle));
    expect(result.current.replayState.on).toBe(true);
    expect(LiveTrackingService.getTrail.mock.lastCall[1]).toMatchObject(yesterday);
    expect(RoadService.getRoadTrailIfEnabled.mock.lastCall[1]).toEqual(yesterday);
  });

  it('does not let an older trail response replace the newly selected date', async () => {
    let resolve;
    LiveTrackingService.getTrail
      .mockImplementationOnce(
        () =>
          new Promise((r) => {
            resolve = r;
          }),
      )
      .mockResolvedValueOnce({ points });
    RoadService.getRoadTrailIfEnabled.mockResolvedValue(null);
    const { result } = setup();
    let first;
    act(() => {
      first = result.current.toggleTrail(vehicle);
    });
    const signal = LiveTrackingService.getTrail.mock.calls[0][2].signal;
    await act(() => result.current.loadTrail(vehicle, { period: 'yesterday' }));
    await act(async () => {
      resolve({ points: points.map((p) => ({ ...p, latitude: 55 })) });
      await first;
    });
    expect(signal.aborted).toBe(true);
    expect(result.current.trailSelection.period).toBe('yesterday');
    expect(result.current.trailPoints).toEqual([
      [22, 88],
      [23, 89],
    ]);
  });

  it('clears the previous date’s trail when the chosen day has no fixes', async () => {
    LiveTrackingService.getTrail
      .mockResolvedValueOnce({ points })
      .mockResolvedValueOnce({ points: [] });
    RoadService.getRoadTrailIfEnabled.mockResolvedValue(null);
    const { result } = setup();
    await act(() => result.current.toggleTrail(vehicle));
    await act(() => result.current.loadTrail(vehicle, { period: 'yesterday' }));
    expect(result.current.trailPoints).toEqual([]);
    expect(result.current.trailLoading).toBe(false);
    expect(result.current.trailNotice).toContain('No recorded trail');
    expect(result.current.isTrailVisible).toBe(true);
  });

  it('keeps a historical trail in view when the live position updates', async () => {
    LiveTrackingService.getTrail.mockResolvedValue({ points });
    RoadService.getRoadTrailIfEnabled.mockResolvedValue(null);
    const { result, rerender } = setup();
    await act(() => result.current.loadTrail(vehicle, { period: 'yesterday' }));
    const map = { panTo: vi.fn(), getZoom: () => 14, setZoom: vi.fn() };
    result.current.mapRef.current = map;
    rerender({ v: { ...vehicle, lat: 24, lng: 90 } });
    expect(map.panTo).not.toHaveBeenCalled();
  });
});

describe('Track selection recentering', () => {
  it('recenters on a newly picked vehicle in one camera move, then follows with panTo', () => {
    const { result, rerender } = setup();
    const map = { panTo: vi.fn(), getZoom: () => 9, setZoom: vi.fn(), moveCamera: vi.fn() };
    result.current.mapRef.current = map;
    const other = { id: 'v2', plate: 'WB02', hasFix: true, lat: 26, lng: 91 };
    rerender({ v: other });
    expect(map.moveCamera).toHaveBeenCalledWith({ center: { lat: 26, lng: 91 }, zoom: 14 });
    expect(map.panTo).not.toHaveBeenCalled();
    expect(map.setZoom).not.toHaveBeenCalled();
    rerender({ v: { ...other, lat: 26.01 } });
    expect(map.panTo).toHaveBeenCalledWith({ lat: 26.01, lng: 91 });
    expect(map.moveCamera).toHaveBeenCalledTimes(1);
  });

  it('recenters on the new vehicle after the previous one had its Trail open', async () => {
    LiveTrackingService.getTrail.mockResolvedValue({ points });
    RoadService.getRoadTrailIfEnabled.mockResolvedValue(null);
    const { result, rerender } = setup();
    await act(() => result.current.toggleTrail(vehicle));
    expect(result.current.isTrailVisible).toBe(true);
    const map = { panTo: vi.fn(), getZoom: () => 16, setZoom: vi.fn(), moveCamera: vi.fn() };
    result.current.mapRef.current = map;
    rerender({ v: { id: 'v2', plate: 'WB02', hasFix: true, lat: 26, lng: 91 } });
    expect(result.current.isTrailVisible).toBe(false);
    // Already closer than 14: keep the user's zoom.
    expect(map.moveCamera).toHaveBeenCalledWith({ center: { lat: 26, lng: 91 }, zoom: 16 });
  });
});

describe('Track replay lifecycle', () => {
  it('keeps the active replay and viewport when Replay is clicked again', async () => {
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn(() => 1),
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    LiveTrackingService.getTrail
      .mockResolvedValueOnce({ points })
      .mockRejectedValueOnce(new Error('A second load should not happen'));
    RoadService.getRoadTrailIfEnabled.mockResolvedValue(null);
    const { result } = setup();
    await act(() => result.current.enterReplay(vehicle));
    act(() =>
      result.current.setReplayState((state) => ({ ...state, t: 0.4, playing: false, speed: 2 })),
    );
    const replay = result.current.replayState;
    const map = { panTo: vi.fn(), getZoom: () => 14, setZoom: vi.fn() };
    result.current.mapRef.current = map;
    await act(() => result.current.enterReplay(vehicle));
    expect(result.current.replayState).toBe(replay);
    expect(result.current.replayState).toMatchObject({
      on: true,
      t: 0.4,
      playing: false,
      speed: 2,
    });
    expect(LiveTrackingService.getTrail).toHaveBeenCalledTimes(1);
    expect(RoadService.getRoadTrailIfEnabled).toHaveBeenCalledTimes(1);
    expect(map.panTo).not.toHaveBeenCalled();
  });

  it('does not cancel and restart a replay load on a rapid second click', async () => {
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn(() => 1),
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    let resolve;
    LiveTrackingService.getTrail.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    RoadService.getRoadTrailIfEnabled.mockResolvedValue(null);
    const { result } = setup();
    let first;
    let second;
    act(() => {
      first = result.current.enterReplay(vehicle);
      second = result.current.enterReplay(vehicle);
    });
    const signal = LiveTrackingService.getTrail.mock.calls[0][2].signal;
    const callCount = LiveTrackingService.getTrail.mock.calls.length;
    const cancelled = signal.aborted;
    await act(async () => {
      resolve({ points });
      await Promise.all([first, second]);
    });
    expect(callCount).toBe(1);
    expect(cancelled).toBe(false);
    expect(result.current.replayState.on).toBe(true);
  });

  it('can open replay again after explicitly exiting it', async () => {
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn(() => 1),
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    LiveTrackingService.getTrail.mockResolvedValue({ points });
    RoadService.getRoadTrailIfEnabled.mockResolvedValue(null);
    const { result } = setup();
    await act(() => result.current.enterReplay(vehicle));
    act(() => result.current.exitReplay());
    expect(result.current.replayState.on).toBe(false);
    await act(() => result.current.enterReplay(vehicle));
    expect(result.current.replayState.on).toBe(true);
    expect(LiveTrackingService.getTrail).toHaveBeenCalledTimes(2);
  });

  it('keeps the viewport on the historical route when live positions update', () => {
    const { result, rerender } = setup();
    const map = { panTo: vi.fn(), getZoom: () => 14, setZoom: vi.fn() };
    result.current.mapRef.current = map;
    act(() =>
      result.current.setReplayState({
        on: true,
        playing: false,
        pts: [
          [22, 88],
          [23, 89],
        ],
        t: 0.5,
        speed: 4,
      }),
    );
    rerender({ v: { ...vehicle, lat: 24, lng: 90 } });
    expect(map.panTo).not.toHaveBeenCalled();
  });
  it('uses exactly the same window for GPS and roads and takes 15 seconds at default 4×', async () => {
    let tick;
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((cb) => {
        tick = cb;
        return 1;
      }),
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    LiveTrackingService.getTrail.mockResolvedValue({ points });
    RoadService.getRoadTrailIfEnabled.mockResolvedValue(null);
    const { result } = setup();
    await act(() => result.current.enterReplay(vehicle));
    const window = LiveTrackingService.getTrail.mock.calls[0][1];
    expect(window).toMatchObject({ from: expect.any(String), to: expect.any(String), limit: 5000 });
    expect(RoadService.getRoadTrailIfEnabled.mock.calls[0][1]).toMatchObject({
      from: window.from,
      to: window.to,
    });
    act(() => tick(100));
    act(() => tick(7600));
    expect(result.current.replayState.t).toBeCloseTo(0.5);
    act(() => tick(15100));
    expect(result.current.replayState).toMatchObject({ t: 1, playing: false });
  });
  it('discards a replay response after a different vehicle is selected', async () => {
    let resolve;
    LiveTrackingService.getTrail.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const { result, rerender } = setup();
    let pending;
    act(() => {
      pending = result.current.enterReplay(vehicle);
    });
    rerender({ v: { ...vehicle, id: 'v2', plate: 'WB02' } });
    await act(async () => {
      resolve({ points });
      await pending;
    });
    expect(result.current.replayState.on).toBe(false);
    expect(result.current.trailPoints).toEqual([]);
  });
});
