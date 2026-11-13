import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { ReceiptApprovalService } from '../ReceiptApprovalService';
import { useBulkApproval } from './useBulkApproval';

vi.mock('../ReceiptApprovalService', () => ({
  ReceiptApprovalService: { bulkPublishDrafts: vi.fn() },
}));

vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const validDraft = {
  _id: 'ready-1',
  vehicleId: 'v1',
  vehicleReg: 'WB01AB1234',
  litres: 20,
  amount: 1800,
  time: { value: '2026-11-10T13:10:00.000Z' },
};

const missingDraft = {
  _id: 'missing-1',
  vehicleReg: 'WB02CD3456',
  litres: 0,
  amount: 0,
  time: {},
};

const setup = (drafts) => {
  const selectedIds = new Set(drafts.map((draft) => draft._id));
  const clearSelection = vi.fn();
  const fetchData = vi.fn().mockResolvedValue(undefined);
  const setRowError = vi.fn();
  const setShowBulkApproveModal = vi.fn();
  const hook = renderHook(() =>
    useBulkApproval({
      selectedIds,
      selectedDrafts: drafts,
      bulkBusy: false,
      setBulkBusy: vi.fn(),
      clearSelection,
      fetchData,
      setRowError,
      setShowBulkApproveModal,
    }),
  );
  return { ...hook, clearSelection, fetchData, setShowBulkApproveModal };
};

describe('useBulkApproval', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ReceiptApprovalService.bulkPublishDrafts.mockResolvedValue({
      successCount: 1,
      failureCount: 0,
      failed: [],
    });
  });

  it('skips rows with missing key fields and approves the rest', async () => {
    const { result, clearSelection } = setup([validDraft, missingDraft]);

    const outcome = await result.current.handleBulkApprove();

    expect(ReceiptApprovalService.bulkPublishDrafts).toHaveBeenCalledWith(['ready-1']);
    expect(outcome.missing).toEqual([
      expect.objectContaining({
        id: 'missing-1',
        name: 'WB02CD3456',
        missing: expect.arrayContaining(['Truck', 'Litres', 'Amount', 'Fill time']),
      }),
    ]);
    expect(clearSelection).not.toHaveBeenCalled();
  });

  it('does not call the API when every selected row is missing a key field', async () => {
    const { result } = setup([missingDraft]);

    const outcome = await result.current.handleBulkApprove();

    expect(ReceiptApprovalService.bulkPublishDrafts).not.toHaveBeenCalled();
    expect(outcome.missing).toHaveLength(1);
    expect(outcome.successCount).toBe(0);
  });
});
