import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import useApprovalBadges from './useApprovalBadges';
import ApprovalService from '../pages/ErpApprovals/ApprovalService';
import BillApprovalsService from '../pages/ErpBillApprovals/BillApprovalsService';

vi.mock('../pages/ErpApprovals/ApprovalService', () => ({
  default: { getSummary: vi.fn() },
}));
vi.mock('../pages/ErpBillApprovals/BillApprovalsService', () => ({
  default: { list: vi.fn() },
}));

describe('useApprovalBadges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ApprovalService.getSummary.mockResolvedValue({ status: 'success', data: { total: 4 } });
    BillApprovalsService.list.mockResolvedValue({ total: 7 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // The bill badge used a bare relative fetch, which on Vercel hit the SPA's
  // index.html instead of the API, so it never lit up.
  it('loads both counts through the API services', async () => {
    const { result } = renderHook(() => useApprovalBadges(true));
    await waitFor(() => expect(result.current).toEqual({ approvals: 4, bills: 7 }));
    expect(BillApprovalsService.list).toHaveBeenCalledWith(
      { status: 'PENDING', limit: 1 },
      { signal: expect.any(AbortSignal) },
    );
    expect(ApprovalService.getSummary).toHaveBeenCalledWith({ signal: expect.any(AbortSignal) });
  });

  it('polls every 30 s and keeps the last counts when a poll fails', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useApprovalBadges(true));
    await act(async () => {});
    expect(result.current).toEqual({ approvals: 4, bills: 7 });

    ApprovalService.getSummary.mockRejectedValueOnce(new Error('Network Error'));
    BillApprovalsService.list.mockResolvedValueOnce({ total: 9 });
    await act(async () => {
      vi.advanceTimersByTime(30000);
    });
    expect(result.current).toEqual({ approvals: 4, bills: 9 });
  });

  it('does not poll, and shows zero, without access', () => {
    const { result } = renderHook(() => useApprovalBadges(false));
    expect(result.current).toEqual({ approvals: 0, bills: 0 });
    expect(ApprovalService.getSummary).not.toHaveBeenCalled();
  });

  it('aborts the in-flight poll on unmount', async () => {
    let signal;
    ApprovalService.getSummary.mockImplementation((opts) => {
      signal = opts.signal;
      return new Promise(() => {});
    });
    const { unmount } = renderHook(() => useApprovalBadges(true));
    unmount();
    expect(signal.aborted).toBe(true);
  });
});
