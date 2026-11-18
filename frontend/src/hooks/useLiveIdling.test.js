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

  // The pushes carry the rows, but the minutes on the chip are computed
  // server-side: a stream that says 'open' and sends nothing would freeze them
  // for ever, so the read never stops - it only slows down.
  it('keeps a slow poll while the stream is connected', () => {
    vi.useFakeTimers();
    h.state = 'open';
    renderHook(() => useLiveIdling({ pollMs: 1000, openPollMs: 5000 }));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(h.refresh).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(h.refresh).toHaveBeenCalledTimes(1);
  });

  it('reads when the stream opens', () => {
    vi.useFakeTimers();
    h.state = 'closed';
    const { rerender } = renderHook(() => useLiveIdling({ pollMs: 1000, openPollMs: 5000 }));
    expect(h.refresh).not.toHaveBeenCalled();

    h.state = 'open';
    rerender();
    expect(h.refresh).toHaveBeenCalledTimes(1);
  });

  it('reads when the tab becomes visible again', () => {
    vi.useFakeTimers();
    const { unmount } = renderHook(() => useLiveIdling({ pollMs: 1000 }));
    expect(h.refresh).not.toHaveBeenCalled();

    act(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(h.refresh).not.toHaveBeenCalled();

    act(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(h.refresh).toHaveBeenCalledTimes(1);
    unmount();
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
    const { rerender } = renderHook(() => useLiveIdling({ pollMs: 1000, openPollMs: 5000 }));
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
