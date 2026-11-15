import { useCallback } from 'react';
import { toast } from 'react-toastify';
import { ReceiptApprovalService } from '../ReceiptApprovalService';
import { missingKeyFields } from './keyFields';
import { plainActionError } from './receiptActions';

const rowName = (draft) =>
  draft.vehicleId?.registrationNumber ||
  draft.vehicleReg ||
  draft.truck?.plate ||
  draft.plateText ||
  `Receipt #${String(draft._id).slice(-8)}`;

export const useBulkApproval = ({
  selectedIds,
  selectedDrafts,
  bulkBusy,
  setBulkBusy,
  clearSelection,
  fetchData,
  setRowError,
  setShowBulkApproveModal,
}) => {
  const handleBulkApprove = useCallback(async () => {
    if (selectedIds.size === 0 || bulkBusy) return { missing: [], successCount: 0, failureCount: 0 };

    const blockedRows = selectedDrafts
      .map((draft) => ({ draft, missing: missingKeyFields(draft) }))
      .filter((row) => row.missing.length > 0)
      .map((row) => ({
        id: row.draft._id,
        name: rowName(row.draft),
        missing: row.missing.map((field) => field.label),
      }));
    const blockedIds = new Set(blockedRows.map((row) => row.id));
    const ids = selectedDrafts
      .filter((draft) => !blockedIds.has(draft._id))
      .map((draft) => draft._id);

    setBulkBusy(true);
    try {
      const data = ids.length
        ? await ReceiptApprovalService.bulkPublishDrafts(ids)
        : { successCount: 0, failureCount: 0, failed: [] };
      const { successCount = 0, failureCount = 0, failed = [] } = data;

      if (ids.length > 0 && failureCount === 0) {
        toast.success(
          `Successfully published ${successCount} fuel receipt${successCount === 1 ? '' : 's'}`,
        );
      } else if (failureCount > 0) {
        failed.forEach((failure) =>
          setRowError(
            failure?.id,
            plainActionError(
              { message: failure?.message },
              'The receipt was not approved. Please check it and try again.',
            ),
          ),
        );
        const failureMessages = Array.from(
          new Set(failed.map((failure) => failure.message).filter(Boolean)),
        );
        if (successCount > 0) {
          toast.success(`Published ${successCount} fuel receipt${successCount === 1 ? '' : 's'}`);
        }
        if (failureMessages.length > 0) {
          failureMessages.forEach((message) => toast.error(message));
        } else {
          toast.error(`${failureCount} receipts failed to publish`);
        }
      }

      if (blockedRows.length === 0) {
        setShowBulkApproveModal(false);
        clearSelection();
      }
      await fetchData();
      return { missing: blockedRows, successCount, failureCount };
    } catch (err) {
      toast.error(plainActionError(err, 'Error processing bulk approval'));
      return { missing: blockedRows, successCount: 0, failureCount: 0 };
    } finally {
      setBulkBusy(false);
    }
  }, [
    selectedIds,
    selectedDrafts,
    bulkBusy,
    setBulkBusy,
    clearSelection,
    fetchData,
    setRowError,
    setShowBulkApproveModal,
  ]);

  return { handleBulkApprove };
};
