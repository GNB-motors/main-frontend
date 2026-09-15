import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMutation } from './useMutation';

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe('useMutation', () => {
  it('starts idle: no loading, no data, no error', () => {
    const { result } = renderHook(() => useMutation(vi.fn()));
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('POST: passes the payload and options through to the mutation fn', async () => {
    const mutationFn = vi.fn((payload) => Promise.resolve({ ...payload, saved: true }));
    const { result } = renderHook(() => useMutation(mutationFn));

    let outcome;
    await act(async () => {
      outcome = await result.current.mutate({ name: 'widget' });
    });
    expect(mutationFn).toHaveBeenCalledWith(
      { name: 'widget' },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(outcome).toEqual({ name: 'widget', saved: true });
    expect(result.current.data).toEqual({ name: 'widget', saved: true });
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('PUT/DELETE: returns the resolved value and mirrors it into data', async () => {
    const mutationFn = vi.fn(() => Promise.resolve('updated'));
    const { result } = renderHook(() => useMutation(mutationFn));

    await act(async () => {
      await result.current.mutate({ id: 7, method: 'put' });
    });
    expect(result.current.data).toBe('updated');

    await act(async () => {
      await result.current.mutate({ id: 7, method: 'delete' });
    });
    expect(mutationFn).toHaveBeenCalledTimes(2);
    expect(result.current.loading).toBe(false);
  });

  it('exposes loading while the mutation is in flight', async () => {
    const d = deferred();
    const { result } = renderHook(() => useMutation(() => d.promise));

    let pending;
    act(() => {
      pending = result.current.mutate();
    });
    expect(result.current.loading).toBe(true);

    await act(async () => {
      d.resolve('done');
      await pending;
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe('done');
  });

  it('stores the error and rethrows it on failure', async () => {
    const failure = new Error('save failed');
    const mutationFn = vi.fn(() => Promise.reject(failure));
    const { result } = renderHook(() => useMutation(mutationFn));

    let caught;
    await act(async () => {
      await result.current.mutate({}).catch((err) => {
        caught = err;
      });
    });
    expect(caught).toBe(failure);
    expect(result.current.error).toBe(failure);
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('clears the previous error when a new mutate starts', async () => {
    let fail = true;
    const mutationFn = vi.fn(() =>
      fail ? Promise.reject(new Error('first')) : Promise.resolve('second ok'),
    );
    const { result } = renderHook(() => useMutation(mutationFn));

    await act(async () => {
      await result.current.mutate({}).catch(() => {});
    });
    expect(result.current.error).toBeInstanceOf(Error);

    fail = false;
    await act(async () => {
      await result.current.mutate({});
    });
    expect(result.current.error).toBeNull();
    expect(result.current.data).toBe('second ok');
  });

  it('a newer mutate() aborts the in-flight one and ignores its result', async () => {
    const first = deferred();
    const second = deferred();
    const mutationFn = vi
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    const { result } = renderHook(() => useMutation(mutationFn));

    let firstCall;
    act(() => {
      firstCall = result.current.mutate({ n: 1 });
    });
    const firstSignal = mutationFn.mock.calls[0][1].signal;
    expect(firstSignal.aborted).toBe(false);

    let secondCall;
    act(() => {
      secondCall = result.current.mutate({ n: 2 });
    });
    expect(firstSignal.aborted).toBe(true);

    await act(async () => {
      first.resolve('stale first');
      await firstCall;
    });
    // The aborted call must not overwrite the newer call's state.
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(true);

    await act(async () => {
      second.resolve('fresh second');
      await secondCall;
    });
    expect(result.current.data).toBe('fresh second');
    expect(result.current.loading).toBe(false);
  });

  it('resolves undefined for a canceled call instead of throwing', async () => {
    const first = deferred();
    const second = deferred();
    const mutationFn = vi
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    const { result } = renderHook(() => useMutation(mutationFn));

    let firstCall;
    act(() => {
      firstCall = result.current.mutate({});
    });
    let secondCall;
    act(() => {
      secondCall = result.current.mutate({});
    });

    let firstOutcome = 'unset';
    await act(async () => {
      first.reject(Object.assign(new Error('canceled'), { code: 'ERR_CANCELED' }));
      firstOutcome = await firstCall;
    });
    expect(firstOutcome).toBeUndefined();
    expect(result.current.error).toBeNull();

    await act(async () => {
      second.resolve('winner');
      await secondCall;
    });
    expect(result.current.data).toBe('winner');
    expect(result.current.error).toBeNull();
  });

  it('reset() aborts in-flight work and clears all state', async () => {
    const d = deferred();
    const mutationFn = vi.fn(() => d.promise);
    const { result } = renderHook(() => useMutation(mutationFn));

    let pending;
    act(() => {
      pending = result.current.mutate({});
    });
    expect(result.current.loading).toBe(true);

    act(() => {
      result.current.reset();
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(mutationFn.mock.calls[0][1].signal.aborted).toBe(true);

    await act(async () => {
      d.resolve('late');
      await pending;
    });
    expect(result.current.data).toBeNull();
  });

  it('aborts the in-flight request on unmount', async () => {
    const d = deferred();
    let capturedSignal;
    const mutationFn = vi.fn((_, opts) => {
      capturedSignal = opts.signal;
      return d.promise;
    });
    const { result, unmount } = renderHook(() => useMutation(mutationFn));

    act(() => {
      result.current.mutate({});
    });
    unmount();
    expect(capturedSignal.aborted).toBe(true);
  });
});
