import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import useTrackReviewQueue from './useTrackReviewQueue';
import service from '../PlaceHub/intelligence/PlaceIntelligenceService';
vi.mock('../PlaceHub/intelligence/PlaceIntelligenceService', () => ({ default: { reviewQueue: vi.fn() } }));

describe('review queue count', () => {
  it('reports the server total rather than the limited marker count', async () => {
    service.reviewQueue.mockResolvedValueOnce({ items: [{ site: { _id: 'one' } }], total: 137 });
    const { result } = renderHook(() => useTrackReviewQueue({ enabled: true }));
    expect(result.current.count).toBeNull();
    await waitFor(() => expect(result.current.count).toBe(137));
    expect(result.current.items).toHaveLength(1);
    service.reviewQueue.mockResolvedValueOnce({ items: [], total: 0 });
    await act(() => result.current.reload());
    expect(result.current.count).toBe(0);
    service.reviewQueue.mockRejectedValueOnce(new Error('offline'));
    await act(() => result.current.reload());
    expect(result.current.count).toBeNull();
  });
  it('does not request the queue outside the enabled view', () => {
    service.reviewQueue.mockClear();
    const { result } = renderHook(() => useTrackReviewQueue({ enabled: false }));
    expect(service.reviewQueue).not.toHaveBeenCalled();
    expect(result.current.count).toBeNull();
  });
});
