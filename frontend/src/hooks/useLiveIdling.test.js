import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const h = vi.hoisted(() => ({ refresh: vi.fn(), state: 'closed' }));

// The hook only asks useLiveData for data and for the stream's state; the
// transport itself is not under test here.
vi.mock('./useLiveData', () => ({
  useLiveData: () => ({
    data: [],
    status: 'ready',
    error: null,
    lastEventAt: null,
    refresh: h.refresh,
    connectionState: h.state,
  }),
}));
vi.mock('../pages/IdlingConsole/IdlingConsoleService', () => ({
  default: { getLive: vi.fn() },
}));

const { useLiveIdling } = await import('./useLiveIdling');

describe('useLiveIdling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.state = 'closed';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not poll while the stream is connected', () => {
    vi.useFakeTimers();
    h.state = 'open';
    renderHook(() => useLiveIdling({ pollMs: 1000 }));
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(h.refresh).not.toHaveBeenCalled();
  });

  it('polls when the stream is not carrying the feed', () => {
    vi.useFakeTimers();
    h.state = 'closed';
    renderHook(() => useLiveIdling({ pollMs: 1000 }));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(h.refresh).toHaveBeenCalledTimes(1);
  });

  it('starts polling again when the stream drops', () => {
    vi.useFakeTimers();
    h.state = 'open';
    const { rerender } = renderHook(() => useLiveIdling({ pollMs: 1000 }));
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(h.refresh).not.toHaveBeenCalled();

    h.state = 'closed';
    rerender();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(h.refresh).toHaveBeenCalledTimes(1);
  });
});
