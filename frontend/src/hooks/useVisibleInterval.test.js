import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVisibleInterval } from './useVisibleInterval';

const setVisibility = (value) => {
  Object.defineProperty(document, 'visibilityState', { value, configurable: true });
};

const fireVisibility = () => {
  document.dispatchEvent(new Event('visibilitychange'));
};

describe('useVisibleInterval', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setVisibility('visible');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('runs the callback on every tick while the tab is visible', () => {
    const fn = vi.fn();
    renderHook(() => useVisibleInterval(fn, 1000));
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('pauses the timer while the tab is hidden', () => {
    const fn = vi.fn();
    renderHook(() => useVisibleInterval(fn, 1000));
    act(() => {
      setVisibility('hidden');
      fireVisibility();
    });
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(fn).not.toHaveBeenCalled();
  });

  it('runs once and restarts when the tab becomes visible again', () => {
    const fn = vi.fn();
    renderHook(() => useVisibleInterval(fn, 1000));
    act(() => {
      setVisibility('hidden');
      fireVisibility();
    });
    act(() => {
      setVisibility('visible');
      fireVisibility();
    });
    // The read that the hidden tab owed happens the moment it is looked at.
    expect(fn).toHaveBeenCalledTimes(1);
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(fn).toHaveBeenCalledTimes(4);
  });

  it('never runs while it is hidden, even when it was hidden from the start', () => {
    setVisibility('hidden');
    const fn = vi.fn();
    renderHook(() => useVisibleInterval(fn, 1000));
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(fn).not.toHaveBeenCalled();
  });

  it('cleans up: no callback after unmount', () => {
    const fn = vi.fn();
    const { unmount } = renderHook(() => useVisibleInterval(fn, 1000));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(fn).toHaveBeenCalledTimes(1);
    unmount();
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('stays idle while disabled', () => {
    const fn = vi.fn();
    renderHook(() => useVisibleInterval(fn, 1000, { enabled: false }));
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(fn).not.toHaveBeenCalled();
  });

  it('keeps the timer when the callback changes on every render', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(({ fn }) => useVisibleInterval(fn, 1000), {
      initialProps: { fn: first },
    });
    rerender({ fn: second });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
