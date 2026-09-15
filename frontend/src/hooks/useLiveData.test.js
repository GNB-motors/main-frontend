import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useLiveData, mergeByKey } from './useLiveData';

// The hook lazy-imports ../lib/liveStream; vi.mock intercepts that import so
// no real network or EventSource is involved.
const h = vi.hoisted(() => ({
  handlers: new Map(),
  stateHandlers: new Set(),
  requestTicket: vi.fn(),
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
});

describe('mergeByKey', () => {
  it('replaces rows by key, appends unknown ones, preserves order', () => {
    const current = [
      { reg: 'A', speed: 10 },
      { reg: 'B', speed: 20 },
    ];
    const next = mergeByKey(
      current,
      [
        { reg: 'B', speed: 25 },
        { reg: 'C', speed: 30 },
      ],
      'reg',
    );
    expect(next).toEqual([
      { reg: 'A', speed: 10 },
      { reg: 'B', speed: 25 },
      { reg: 'C', speed: 30 },
    ]);
    // Immutable: the base dataset is untouched.
    expect(current[1].speed).toBe(20);
  });

  it('returns the incoming diff when the base is not an array', () => {
    expect(mergeByKey(null, [{ reg: 'A' }], 'reg')).toEqual([{ reg: 'A' }]);
  });
});

describe('useLiveData', () => {
  it('loads the base dataset via initialFetch and reports ready', async () => {
    const initialFetch = vi.fn().mockResolvedValue([{ reg: 'A', speed: 10 }]);
    const { result } = renderHook(() => useLiveData('positions', { initialFetch }));

    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.data).toEqual([{ reg: 'A', speed: 10 }]);
    expect(result.current.lastEventAt).toBeInstanceOf(Date);
  });

  it('applies streamed diffs through applyDiff and stamps lastEventAt', async () => {
    const initialFetch = vi.fn().mockResolvedValue([
      { reg: 'A', speed: 10 },
      { reg: 'B', speed: 20 },
    ]);
    const { result } = renderHook(() =>
      useLiveData('positions', {
        initialFetch,
        applyDiff: (cur, diff) => mergeByKey(cur, diff, 'reg'),
      }),
    );
    await waitFor(() => expect(result.current.status).toBe('ready'));

    const before = result.current.lastEventAt;
    emitEvent('positions', [{ reg: 'B', speed: 21 }]);

    expect(result.current.data).toEqual([
      { reg: 'A', speed: 10 },
      { reg: 'B', speed: 21 },
    ]);
    expect(result.current.lastEventAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it('re-runs initialFetch once when the stream (re)connects', async () => {
    const initialFetch = vi.fn().mockResolvedValue([{ reg: 'A', speed: 10 }]);
    const { result } = renderHook(() => useLiveData('positions', { initialFetch }));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(initialFetch).toHaveBeenCalledTimes(1);

    emitState('open');
    await waitFor(() => expect(initialFetch).toHaveBeenCalledTimes(2));
    expect(result.current.connectionState).toBe('open');
  });

  it('keeps the last good dataset when a refresh fails', async () => {
    const initialFetch = vi
      .fn()
      .mockResolvedValueOnce([{ reg: 'A', speed: 10 }])
      .mockRejectedValueOnce(new Error('network down'));
    const { result } = renderHook(() => useLiveData('positions', { initialFetch }));
    await waitFor(() => expect(result.current.status).toBe('ready'));

    emitState('open');
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.data).toEqual([{ reg: 'A', speed: 10 }]);
    expect(result.current.status).toBe('ready');
  });

  it('does nothing when disabled', async () => {
    const initialFetch = vi.fn().mockResolvedValue([]);
    const { result } = renderHook(() => useLiveData('positions', { initialFetch, enabled: false }));
    expect(initialFetch).not.toHaveBeenCalled();
    expect(result.current.status).toBe('loading');
  });
});
