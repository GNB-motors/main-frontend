import { useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { ReceiptApprovalService } from '../ReceiptApprovalService';
import { isChatRow, publishPayload } from './chatDraft';
import { missingKeyFields } from './keyFields';
import { plainActionError, refusalMessage } from './receiptActions';

const KEY_LABELS = {
  TRUCK: 'Truck',
  LITRES: 'Litres',
  AMOUNT: 'Amount',
  FILL_TIME: 'Fill time',
};

const missingFromError = (error) => {
  const status = error?.status ?? error?.response?.status;
  if (status !== 422) return [];
  const body = error?.body ?? error?.response?.data ?? {};
  // The server sends the missing fields inside `data`: { data: { missing: [...] } }.
  const list = body?.data?.missing ?? body?.missing;
  const missing = Array.isArray(body)
    ? body
    : Array.isArray(list)
      ? list
      : Array.isArray(body.missingFields)
        ? body.missingFields
        : [];
  return missing
    .map((key) => String(key).toUpperCase())
    .filter((key) => KEY_LABELS[key])
    .map((key) => ({ key, label: KEY_LABELS[key] }));
};

export const useReceiptApprovalActions = ({
  draft,
  edits,
  loadDraft,
  onUpdated,
  actionBusy,
  setActionBusy,
  setActionError,
}) => {
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [blocked, setBlocked] = useState(false);
  const [serverMissing, setServerMissing] = useState([]);
  const [shakeCount, setShakeCount] = useState(0);
  const publishButtonRef = useRef(null);
  const clientMissing = draft ? missingKeyFields(draft, edits) : [];
  const visibleMissing = blocked ? (clientMissing.length ? clientMissing : serverMissing) : [];

  const triggerBlockedState = (fields) => {
    setBlocked(true);
    setShakeCount((count) => count + 1);
    try {
      navigator.vibrate?.(200);
    } catch {
      // Vibration is a helpful extra, never a requirement.
    }
    const first = fields[0]?.key;
    const wrapper = first ? document.querySelector(`[data-key-field="${first}"]`) : null;
    wrapper?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    const focusable = wrapper?.querySelector(
      '[role="combobox"], input:not([aria-hidden="true"]), button',
    );
    (focusable || wrapper)?.focus?.();
  };

  const handleSetTime = async (action, at) => {
    if (!draft?._id || actionBusy) return;
    setActionBusy(true);
    setActionError('');
    try {
      await ReceiptApprovalService.setDraftTime(
        draft._id,
        action === 'accept' ? { action: 'accept' } : { action: 'set', at },
      );
      toast.success(
        action === 'accept' ? 'The predicted time was accepted' : 'The time of the fill was saved',
      );
      await loadDraft();
      onUpdated?.();
    } catch (err) {
      setActionError(plainActionError(err, 'Could not save the time'));
    } finally {
      setActionBusy(false);
    }
  };

  const handlePublish = async () => {
    if (!draft?._id || actionBusy) return;
    if (clientMissing.length > 0) {
      setServerMissing([]);
      triggerBlockedState(clientMissing);
      return;
    }
    setBlocked(false);
    setServerMissing([]);
    setActionBusy(true);
    setActionError('');
    try {
      const payload = isChatRow(draft) ? publishPayload(edits) : {};
      const result = await ReceiptApprovalService.publishDraft(draft._id, payload);
      const refusal = refusalMessage(
        result,
        'The receipt was not approved. Please check the details and try again.',
      );
      if (refusal) {
        setActionError(refusal);
        return;
      }
      const vehicle = draft.vehicleId?.registrationNumber || draft.vehicleReg || 'vehicle';
      toast.success(`Published receipt for ${vehicle} to Fuel Ledger`);
      await loadDraft();
      onUpdated?.();
    } catch (err) {
      const missing = missingFromError(err);
      if (missing.length > 0) {
        setServerMissing(missing);
        triggerBlockedState(missing);
        return;
      }
      setActionError(plainActionError(err, 'The receipt was not approved. Please try again.'));
    } finally {
      setActionBusy(false);
    }
  };

  const handleMarket = async () => {
    if (!draft?._id || actionBusy) return;
    setActionBusy(true);
    setActionError('');
    try {
      const result = await ReceiptApprovalService.markDraftAsMarket(
        draft._id,
        publishPayload(edits),
      );
      const refusal = refusalMessage(
        result,
        'The row was not marked as a market truck. Please try again.',
      );
      if (refusal) {
        setActionError(refusal);
        return;
      }
      toast.success('Marked as a market truck — no fleet vehicle needed');
      await loadDraft();
      onUpdated?.();
    } catch (err) {
      setActionError(
        plainActionError(err, 'The row was not marked as a market truck. Please try again.'),
      );
    } finally {
      setActionBusy(false);
    }
  };

  const handleReject = async () => {
    if (!draft?._id || actionBusy) return;
    setActionBusy(true);
    setActionError('');
    try {
      await ReceiptApprovalService.rejectDraft(draft._id, rejectReason.trim() || undefined);
      toast.success(
        isChatRow(draft)
          ? 'Kept as “not a fill” — the photo stays in the inbox'
          : 'Receipt marked as rejected',
      );
      setRejectModalOpen(false);
      setRejectReason('');
      await loadDraft();
      onUpdated?.();
    } catch (err) {
      setActionError(plainActionError(err, 'The receipt was not rejected. Please try again.'));
    } finally {
      setActionBusy(false);
    }
  };

  const handleClear = async () => {
    if (!draft?._id || actionBusy) return;
    setActionBusy(true);
    setActionError('');
    try {
      await ReceiptApprovalService.clearDraft(draft._id, 'Cleared from drawer');
      toast.success('Receipt cleared from inbox');
      await loadDraft();
      onUpdated?.();
    } catch (err) {
      setActionError(plainActionError(err, 'The receipt was not cleared. Please try again.'));
    } finally {
      setActionBusy(false);
    }
  };

  return {
    rejectModalOpen,
    setRejectModalOpen,
    rejectReason,
    setRejectReason,
    blocked,
    shakeCount,
    publishButtonRef,
    visibleMissing,
    handleSetTime,
    handlePublish,
    handleMarket,
    handleReject,
    handleClear,
  };
};
