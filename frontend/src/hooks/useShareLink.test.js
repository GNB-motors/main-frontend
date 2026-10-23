import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useShareLink } from './useShareLink';
import { ShareService } from '../services/ShareService';

vi.mock('../services/ShareService', () => {
  const service = { createShareLink: vi.fn() };
  return { ShareService: service, default: service };
});

const originalClipboard = navigator.clipboard;
const setClipboard = (clipboard) =>
  Object.defineProperty(navigator, 'clipboard', { value: clipboard, configurable: true });

describe('useShareLink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ShareService.createShareLink.mockResolvedValue({ url: 'https://app/track/abc' });
  });

  afterEach(() => {
    setClipboard(originalClipboard);
  });

  it('reports copied: true when the clipboard write succeeds', async () => {
    setClipboard({ writeText: vi.fn().mockResolvedValue(undefined) });
    const onDone = vi.fn();
    const { result } = renderHook(() => useShareLink());
    await act(() => result.current.createAndCopy({}, { onDone }));
    expect(onDone).toHaveBeenCalledWith('https://app/track/abc', expect.any(Object), {
      copied: true,
    });
  });

  // The page used to toast "copied" even when the browser refused the write.
  it('reports copied: false when the browser refuses the clipboard', async () => {
    setClipboard({ writeText: vi.fn().mockRejectedValue(new Error('NotAllowedError')) });
    const onDone = vi.fn();
    const { result } = renderHook(() => useShareLink());
    await act(() => result.current.createAndCopy({}, { onDone }));
    expect(onDone).toHaveBeenCalledWith('https://app/track/abc', expect.any(Object), {
      copied: false,
    });
  });
});
