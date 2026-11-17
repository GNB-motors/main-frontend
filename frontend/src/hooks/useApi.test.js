import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useApi } from './useApi';
import apiMemo from '../utils/apiMemo';

vi.mock('../utils/session', () => ({
  getToken: () => 'T',
  getUserId: () => 'U1',
  getOrgId: () => 'O1',
  getBranchId: () => null,
}));

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe('useApi', () => {
  it('starts in loading state with no data or error', () => {
    const d = deferred();
    const fetcher = vi.fn(() => d.promise);
    const { result } = renderHook(() => useApi(fetcher, []));
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('passes an AbortSignal to the fetcher', () => {
    const d = deferred();
    const fetcher = vi.fn(() => d.promise);
    renderHook(() => useApi(fetcher, []));
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][0]).toBeInstanceOf(AbortSignal);
  });

  it('resolves to data on success and clears loading', async () => {
    const fetcher = vi.fn(() => Promise.resolve({ id: 1 }));
    const { result } = renderHook(() => useApi(fetcher, []));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ id: 1 });
    expect(result.current.error).toBeNull();
  });

  it('stores the thrown value on failure and clears loading', async () => {
    const failure = new Error('nope');
    const fetcher = vi.fn(() => Promise.reject(failure));
    const { result } = renderHook(() => useApi(fetcher, []));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(failure);
    expect(result.current.data).toBeNull();
  });

  it('refetch() re-runs the fetcher and clears the previous error', async () => {
    let fail = true;
    const fetcher = vi.fn(() =>
      fail ? Promise.reject(new Error('first fails')) : Promise.resolve('ok'),
    );
    const { result } = renderHook(() => useApi(fetcher, []));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(fetcher).toHaveBeenCalledTimes(1);

    fail = false;
    await act(async () => {
      await result.current.refetch();
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(result.current.data).toBe('ok'));
    expect(result.current.error).toBeNull();
  });

  it('keeps last good data while a refetch is in flight', async () => {
    const first = deferred();
    const second = deferred();
    const fetcher = vi
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    const { result } = renderHook(() => useApi(fetcher, []));

    await act(async () => {
      first.resolve('stale but good');
      await first.promise;
    });
    expect(result.current.data).toBe('stale but good');

    act(() => {
      result.current.refetch();
    });
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe('stale but good');
  });

  it('aborts the in-flight request when deps change and ignores its result', async () => {
    const first = deferred();
    const second = deferred();
    const fetchers = [vi.fn(() => first.promise), vi.fn(() => second.promise)];
    const { result, rerender } = renderHook(({ i }) => useApi(fetchers[i], [i]), {
      initialProps: { i: 0 },
    });

    // Switch deps before the first request settles.
    rerender({ i: 1 });
    expect(fetchers[0].mock.calls[0][0].aborted).toBe(true);
    expect(fetchers[1]).toHaveBeenCalledTimes(1);

    await act(async () => {
      first.resolve('too late');
      await first.promise;
    });
    // The aborted response must not clobber state.
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(true);

    await act(async () => {
      second.resolve('fresh');
      await second.promise;
    });
    expect(result.current.data).toBe('fresh');
    expect(result.current.loading).toBe(false);
  });

  it('does not set error for a cancelled request (CanceledError / ERR_CANCELED)', async () => {
    const d = deferred();
    const fetcher = vi.fn(() => d.promise);
    const { result, unmount } = renderHook(() => useApi(fetcher, []));

    await act(async () => {
      unmount();
      d.reject(
        Object.assign(new Error('canceled'), { name: 'CanceledError', code: 'ERR_CANCELED' }),
      );
      await d.promise.catch(() => {});
    });
    expect(result.current.error).toBeNull();
  });

  it('does not update state after unmount', async () => {
    const d = deferred();
    const fetcher = vi.fn(() => d.promise);
    const { result, unmount } = renderHook(() => useApi(fetcher, []));

    unmount();
    await act(async () => {
      d.resolve('late');
      await d.promise;
    });
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it('does not fetch when enabled is false', async () => {
    const fetcher = vi.fn(() => Promise.resolve('x'));
    const { result } = renderHook(() => useApi(fetcher, [], { enabled: false }));
    expect(fetcher).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('re-runs the fetcher when a dep value changes', async () => {
    const fetcher = vi.fn(({ id }) => Promise.resolve({ id }));
    const { result, rerender } = renderHook(({ id }) => useApi(() => fetcher({ id }), [id]), {
      initialProps: { id: 1 },
    });
    await waitFor(() => expect(result.current.data).toEqual({ id: 1 }));

    rerender({ id: 2 });
    await waitFor(() => expect(result.current.data).toEqual({ id: 2 }));
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});

it('hides data from a previous scope immediately and remains retryable after failure', async () => {
  const pending = deferred();
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(['tata'])
    .mockImplementationOnce(() => pending.promise)
    .mockResolvedValueOnce(['ashok']);
  const { result, rerender } = renderHook(({ scopeKey }) => useApi(fetcher, [], { scopeKey }), {
    initialProps: { scopeKey: 'TATA' },
  });
  await waitFor(() => expect(result.current.data).toEqual(['tata']));
  rerender({ scopeKey: 'ASHOK LEYLAND' });
  expect(result.current.data).toBeNull();
  expect(result.current.loading).toBe(true);
  await act(async () => {
    pending.reject(new Error('offline'));
    await pending.promise.catch(() => {});
  });
  expect(result.current.loading).toBe(false);
  expect(result.current.data).toBeNull();
  act(() => {
    result.current.refetch();
  });
  await waitFor(() => expect(result.current.data).toEqual(['ashok']));

  describe('with cacheKey (revisits ask the server nothing)', () => {
    it('a second mount inside the window shows the kept answer without a request', async () => {
      apiMemo.clear();
      const fetcher = vi.fn(() => Promise.resolve({ id: 7 }));
      const opts = { cacheKey: 'thing:1', cacheMs: 60000 };
      const first = renderHook(() => useApi(fetcher, [], opts));
      await waitFor(() => expect(first.result.current.data).toEqual({ id: 7 }));
      first.unmount();
      const second = renderHook(() => useApi(fetcher, [], opts));
      expect(second.result.current.loading).toBe(false);
      expect(second.result.current.data).toEqual({ id: 7 });
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('refetch always asks the server and refills the cache', async () => {
      apiMemo.clear();
      let n = 0;
      const fetcher = vi.fn(() => Promise.resolve({ n: ++n }));
      const opts = { cacheKey: 'thing:2', cacheMs: 60000 };
      const { result } = renderHook(() => useApi(fetcher, [], opts));
      await waitFor(() => expect(result.current.data).toEqual({ n: 1 }));
      act(() => {
        result.current.refetch();
      });
      await waitFor(() => expect(result.current.data).toEqual({ n: 2 }));
      expect(fetcher).toHaveBeenCalledTimes(2);
      expect(apiMemo.get('thing:2', 60000)).toEqual({ n: 2 });
    });

    it('a failed read is not kept', async () => {
      apiMemo.clear();
      const fetcher = vi.fn(() => Promise.reject(Object.assign(new Error('x'), { status: 500 })));
      const { result } = renderHook(() =>
        useApi(fetcher, [], { cacheKey: 'thing:3', cacheMs: 60000 }),
      );
      await waitFor(() => expect(result.current.error).toBeTruthy());
      expect(apiMemo.get('thing:3', 60000)).toBeUndefined();
    });

    it('without a cacheKey every mount asks the server, as before', async () => {
      const fetcher = vi.fn(() => Promise.resolve(1));
      const a = renderHook(() => useApi(fetcher, []));
      await waitFor(() => expect(a.result.current.loading).toBe(false));
      a.unmount();
      const b = renderHook(() => useApi(fetcher, []));
      await waitFor(() => expect(b.result.current.loading).toBe(false));
      expect(fetcher).toHaveBeenCalledTimes(2);
    });
  });
});
