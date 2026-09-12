import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useLivePositions } from './useLivePositions';

// Same interception pattern as useLiveData.test.js: the hook lazy-imports
// ../lib/liveStream, so vi.mock stands in for the transport and no real
// EventSource or ticket request is involved.
const h = vi.hoisted(() => ({
  handlers: new Map(),
  stateHandlers: new Set(),
  stream: null,
}));

vi.mock('../lib/liveStream', () => ({
  getLiveStream: () => {
    if (!h.stream) {
      h.stream = {
        subscribe: (eventType, handler) => {
          if (!h.handlers.has(eventType)) h.handlers.set(eventType, new Set());
          h.handlers.get(eventType).add(handler);
          return () => h.handlers.get(eventType)?.delete(handler);
        },
        onConnectionState: (handler) => {
          h.stateHandlers.add(handler);
          return () => h.stateHandlers.delete(handler);
        },
        getState: () => 'closed',
      };
    }
    return h.stream;
  },
}));

vi.mock('../pages/LiveTracking/LiveTrackingService.jsx', () => ({
  LiveTrackingService: {
    getPositions: vi.fn(),
  },
}));

import { LiveTrackingService } from '../pages/LiveTracking/LiveTrackingService.jsx';

const emitEvent = (type, payload) =>
  act(() => {
    (h.handlers.get(type) || []).forEach((fn) => fn(payload));
  });

const emitState = (state) =>
  act(() => {
    h.stateHandlers.forEach((fn) => fn(state));
  });

beforeEach(() => {
  h.handlers.clear();
  h.stateHandlers.clear();
  h.stream = null;
  LiveTrackingService.getPositions.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useLivePositions', () => {
  it('exposes the initial REST fetch as the base dataset', async () => {
    LiveTrackingService.getPositions.mockResolvedValue([
      { registrationNumber: 'A', latitude: 1, longitude: 2 },
    ]);
    const { result } = renderHook(() => useLivePositions());
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.positions).toHaveLength(1);
  });

  it('merges streamed position diffs by registrationNumber', async () => {
    LiveTrackingService.getPositions.mockResolvedValue([
      { registrationNumber: 'A', speed: 10 },
      { registrationNumber: 'B', speed: 20 },
    ]);
    const { result } = renderHook(() => useLivePositions());
    await waitFor(() => expect(result.current.positions).toHaveLength(2));

    emitEvent('positions', [
      { registrationNumber: 'B', speed: 25 },
      { registrationNumber: 'C', speed: 30 },
    ]);
    await waitFor(() => expect(result.current.positions).toHaveLength(3));
    expect(result.current.positions.find((p) => p.registrationNumber === 'B').speed).toBe(25);
  });

  it('maps streamed rows through mapStreamRow before merging', async () => {
    LiveTrackingService.getPositions.mockResolvedValue([]);
    const mapStreamRow = (row) => ({ reg: row.registrationNumber, seen: row.eventDateTime });
    const { result } = renderHook(() =>
      useLivePositions({ initialFetch: () => Promise.resolve([]), mapStreamRow, mergeKey: 'reg' }),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    emitEvent('positions', [{ registrationNumber: 'A', eventDateTime: 't1' }]);
    await waitFor(() => expect(result.current.positions).toHaveLength(1));
    expect(result.current.positions[0]).toEqual({ reg: 'A', seen: 't1' });
  });

  it('resumes the REST poll only after the stream settles closed (degraded fallback)', async () => {
    // shouldAdvanceTime lets `waitFor` still make progress under fake timers —
    // without it waitFor polls on a clock that never moves and deadlocks.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    LiveTrackingService.getPositions.mockResolvedValue([]);
    const { result } = renderHook(() => useLivePositions({ fallbackPollMs: 5000 }));
    await waitFor(() => expect(LiveTrackingService.getPositions).toHaveBeenCalledTimes(1));

    // Stream tries, then gives up (e.g. ticket endpoint 404) → 'closed'.
    emitState('connecting');
    emitState('closed');
    await waitFor(() => expect(result.current.connectionState).toBe('closed'));

    // Degraded: the old poll cadence takes over without any UI breakage.
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(LiveTrackingService.getPositions).toHaveBeenCalledTimes(2);
    await act(async () => {
      vi.advanceTimersByTime(10000);
    });
    expect(LiveTrackingService.getPositions).toHaveBeenCalledTimes(4);
  });

  it('does not fall back to polling while the stream is reconnecting', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    LiveTrackingService.getPositions.mockResolvedValue([]);
    renderHook(() => useLivePositions({ fallbackPollMs: 5000 }));
    await waitFor(() => expect(LiveTrackingService.getPositions).toHaveBeenCalledTimes(1));

    emitState('connecting');
    emitState('reconnecting');
    await act(async () => {
      vi.advanceTimersByTime(60000);
    });
    // No poll ran: the reconnecting stream still owns freshness.
    expect(LiveTrackingService.getPositions).toHaveBeenCalledTimes(1);
  });

  it('stays entirely idle when disabled', async () => {
    LiveTrackingService.getPositions.mockResolvedValue([]);
    const { result } = renderHook(() => useLivePositions({ enabled: false }));
    await new Promise((r) => setTimeout(r, 20));
    expect(LiveTrackingService.getPositions).not.toHaveBeenCalled();
    expect(result.current.positions).toEqual([]);
  });
});
