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

  it('does not merge into a base that is not an array', () => {
    // There is nothing to merge into yet: a diff must not become the whole
    // fleet just because it arrived first.
    expect(mergeByKey(null, [{ reg: 'A' }], 'reg')).toBeNull();
    expect(mergeByKey({ reg: 'A' }, [{ reg: 'B' }], 'reg')).toEqual({ reg: 'A' });
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
    const { result } = renderHook(() =>
      useLiveData('positions', { initialFetch, resyncMinGapMs: 0 }),
    );
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(initialFetch).toHaveBeenCalledTimes(1);

    emitState('open');
    await waitFor(() => expect(initialFetch).toHaveBeenCalledTimes(2));
    expect(result.current.connectionState).toBe('open');
  });

  // The mount read and the read the stream asks for on (re)connect used to
  // land together: the fleet was read twice for one paint.
  it('does not read the fleet again when the stream opens right after the first read', async () => {
    const initialFetch = vi.fn().mockResolvedValue([{ reg: 'A', speed: 10 }]);
    renderHook(() => useLiveData('positions', { initialFetch }));
    await waitFor(() => expect(initialFetch).toHaveBeenCalledTimes(1));

    emitState('open');
    await act(async () => {});
    expect(initialFetch).toHaveBeenCalledTimes(1);
  });

  it('keeps the last good dataset when a refresh fails', async () => {
    const initialFetch = vi
      .fn()
      .mockResolvedValueOnce([{ reg: 'A', speed: 10 }])
      .mockRejectedValueOnce(new Error('network down'));
    const { result } = renderHook(() =>
      useLiveData('positions', { initialFetch, resyncMinGapMs: 0 }),
    );
    await waitFor(() => expect(result.current.status).toBe('ready'));

    emitState('open');
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.data).toEqual([{ reg: 'A', speed: 10 }]);
    expect(result.current.status).toBe('ready');
  });

  // The REST read (first load, degraded poll, reconnect resync) used to run
  // uncancelled, so overlapping reads raced and a slow one could land last.
  it('passes a signal, cancels a superseded read, and drops its late result', async () => {
    let releaseFirst;
    const signals = [];
    const initialFetch = vi
      .fn()
      .mockImplementationOnce((signal) => {
        signals.push(signal);
        return new Promise((resolve) => {
          releaseFirst = () => resolve([{ reg: 'OLD' }]);
        });
      })
      .mockImplementationOnce((signal) => {
        signals.push(signal);
        return Promise.resolve([{ reg: 'NEW' }]);
      });
    const { result } = renderHook(() => useLiveData('positions', { initialFetch }));

    await act(async () => {
      result.current.refresh();
    });
    await waitFor(() => expect(result.current.data).toEqual([{ reg: 'NEW' }]));
    expect(signals[0]).toBeInstanceOf(AbortSignal);
    expect(signals[0].aborted).toBe(true);

    await act(async () => {
      releaseFirst();
    });
    expect(result.current.data).toEqual([{ reg: 'NEW' }]);
  });

  it('cancels the in-flight read on unmount', async () => {
    let signal;
    const initialFetch = vi.fn((s) => {
      signal = s;
      return new Promise(() => {});
    });
    const { unmount } = renderHook(() => useLiveData('positions', { initialFetch }));
    await waitFor(() => expect(initialFetch).toHaveBeenCalled());
    unmount();
    expect(signal.aborted).toBe(true);
  });

  it('does nothing when disabled', async () => {
    const initialFetch = vi.fn().mockResolvedValue([]);
    const { result } = renderHook(() => useLiveData('positions', { initialFetch, enabled: false }));
    expect(initialFetch).not.toHaveBeenCalled();
    expect(result.current.status).toBe('loading');
  });

  // A read that landed a moment before the socket came back may predate the
  // drop: what the socket missed is only in the server's answer, so every
  // reconnect gets its own read.
  it('resyncs on every reconnect, even right after a read', async () => {
    const initialFetch = vi.fn().mockResolvedValue([{ reg: 'A', speed: 10 }]);
    renderHook(() => useLiveData('positions', { initialFetch }));
    await waitFor(() => expect(initialFetch).toHaveBeenCalledTimes(1));

    // The first open belongs to the read that opened the page.
    emitState('open');
    await act(async () => {});
    expect(initialFetch).toHaveBeenCalledTimes(1);

    emitState('closed');
    emitState('open');
    await waitFor(() => expect(initialFetch).toHaveBeenCalledTimes(2));
  });

  it('queues a resync when the reconnect happens while a read is in flight', async () => {
    let release;
    const initialFetch = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            release = () => resolve([{ reg: 'A' }]);
          }),
      )
      .mockImplementation(() => Promise.resolve([{ reg: 'B' }]));
    renderHook(() => useLiveData('positions', { initialFetch }));
    await waitFor(() => expect(initialFetch).toHaveBeenCalledTimes(1));

    emitState('open');
    emitState('closed');
    // A reconnect while the first read is still running: that read may have
    // started before the drop.
    emitState('open');
    expect(initialFetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      release();
    });
    await waitFor(() => expect(initialFetch).toHaveBeenCalledTimes(2));
  });
});
