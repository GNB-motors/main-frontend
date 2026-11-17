import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import useTrackReviewQueue from './useTrackReviewQueue';
import service from '../PlaceHub/intelligence/PlaceIntelligenceService';
vi.mock('../PlaceHub/intelligence/PlaceIntelligenceService', () => ({
  default: { listSites: vi.fn() },
}));

describe('review queue count', () => {
  it('reports the server total rather than the limited marker count', async () => {
    service.listSites.mockResolvedValueOnce({
      records: [{ _id: 'one', status: 'PROPOSED' }],
      total: 137,
    });
    const { result } = renderHook(() => useTrackReviewQueue({ enabled: true }));
    expect(result.current.count).toBeNull();
    await waitFor(() => expect(result.current.count).toBe(137));
    expect(result.current.items).toHaveLength(1);
    expect(service.listSites).toHaveBeenCalledWith({
      status: 'PROPOSED',
      evidence: 'ready',
      fields: 'list',
      limit: 100,
    });
    service.listSites.mockResolvedValueOnce({ records: [], total: 0 });
    await act(() => result.current.reload());
    expect(result.current.count).toBe(0);
    service.listSites.mockRejectedValueOnce(new Error('offline'));
    await act(() => result.current.reload());
    expect(result.current.count).toBeNull();
  });
  it('does not request the queue outside the enabled view', () => {
    service.listSites.mockClear();
    const { result } = renderHook(() => useTrackReviewQueue({ enabled: false }));
    expect(service.listSites).not.toHaveBeenCalled();
    expect(result.current.count).toBeNull();
  });
});

it('keeps answered places out of pending reviews even if a stale response returns them', async () => {
  service.listSites.mockResolvedValueOnce({
    records: [
      { _id: 'pending', status: 'PROPOSED' },
      { _id: 'answered', status: 'CONFIRMED' },
    ],
    total: 2,
  });
  const { result } = renderHook(() => useTrackReviewQueue({ enabled: true }));
  await waitFor(() => expect(result.current.items).toHaveLength(1));
  expect(result.current.count).toBe(1);
  act(() => result.current.resolve('pending'));
  expect(result.current.items).toHaveLength(0);
  service.listSites.mockResolvedValueOnce({
    records: [{ _id: 'pending', status: 'PROPOSED' }],
    total: 1,
  });
  await act(() => result.current.reload());
  expect(result.current.items).toHaveLength(0);
  expect(result.current.count).toBe(0);
});
